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

# Stage 2: Download and prepare the AppImage
FROM node:20-alpine AS appimage

WORKDIR /app

# Install wget and curl
RUN apk add --no-cache wget curl

# Set the OrcaSlicer version as an environment variable
ENV ORCASLICER_DOWNLOAD_URL=https://github.com/SoftFever/OrcaSlicer/releases/download/v2.2.0/OrcaSlicer_Linux_V2.2.0.AppImage

# Download the AppImage, verify it, extract it, and move it to /opt/orcaslicer
RUN curl -o /tmp/orca.app -L \
    ${ORCASLICER_DOWNLOAD_URL} && \
    chmod +x /tmp/orca.app && \
    /tmp/orca.app --appimage-extract && \
    ls -la squashfs-root && \
    mv squashfs-root /opt/orcaslicer && \
    echo "**** cleanup ****"

# Stage 3: Create the production image
FROM ubuntu:latest AS production

WORKDIR /app

# Install curl, ca-certificates, and Node.js 20
#RUN install_packages curl ca-certificates \
#    && update-ca-certificates
RUN apt-get update && apt-get install -y curl ca-certificates
RUN curl https://get.volta.sh | bash \
    && /root/.volta/bin/volta install node@20

# Add Volta to PATH
ENV PATH="/root/.volta/bin:$PATH"

# Set environment variable for the AppImage path
ENV SLICER_EXECUTABLE_PATH=/opt/orcaslicer/AppRun

# Copy the extracted OrcaSlicer from the appimage stage
COPY --from=appimage /opt/orcaslicer /opt/orcaslicer

# Copy the built Next.js application from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Start the Next.js application with a dynamic port
CMD ["sh", "-c", "npm run start -- --port ${PORT:-8080}"]
