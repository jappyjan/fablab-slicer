# Stage 1: Build the Next.js application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 3: Create the production image
FROM ubuntu:latest AS production

WORKDIR /app

# Install curl, ca-certificates, Node.js 20, OpenGL, and EGL libraries
RUN apt-get update && apt-get install -y curl ca-certificates libgl1 libegl1
RUN curl https://get.volta.sh | bash \
    && /root/.volta/bin/volta install node@20

# Add Volta to PATH
ENV PATH="/root/.volta/bin:$PATH"

# Set environment variable for the AppImage path
ENV SLICER_EXTRACTED_APPIMAGE_PATH=/app/orcaslicer
ENV SLICER_EXECUTABLE_PATH=${SLICER_EXTRACTED_APPIMAGE_PATH}/AppRun

# Set the OrcaSlicer version as an environment variable
ENV ORCASLICER_DOWNLOAD_URL=https://github.com/SoftFever/OrcaSlicer/releases/download/v2.2.0/OrcaSlicer_Linux_Ubuntu2404_V2.2.0.AppImage

# Download the AppImage, verify it, extract it, and move it to /opt/orcaslicer
RUN curl -o /app/orca.AppImage -L ${ORCASLICER_DOWNLOAD_URL}
RUN chmod +x /app/orca.AppImage 
RUN /app/orca.AppImage --appimage-extract
RUN mv squashfs-root ${SLICER_EXTRACTED_APPIMAGE_PATH}

RUN chmod +x ${SLICER_EXECUTABLE_PATH}
RUN ls -la ${SLICER_EXTRACTED_APPIMAGE_PATH}

# Copy the built Next.js application from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Start the Next.js application with a dynamic port
CMD ["sh", "-c", "npm run start -- --port ${PORT:-8080}"]
