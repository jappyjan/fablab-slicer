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

# Install wget
RUN apk add --no-cache wget

# Download the AppImage and extract it
RUN wget -O OrcaSlicer.AppImage https://github.com/SoftFever/OrcaSlicer/releases/download/v2.2.0/OrcaSlicer_Linux_V2.2.0.AppImage \
    && chmod +x OrcaSlicer.AppImage \
    && ./OrcaSlicer.AppImage --appimage-extract

# Stage 3: Create the production image
FROM bitnami/minideb:latest AS production

WORKDIR /app

# Install curl, ca-certificates, Node.js 20
RUN install_packages curl ca-certificates \
    && update-ca-certificates \
    && curl https://get.volta.sh | bash \
    && /root/.volta/bin/volta install node@20

# Add Volta to PATH
ENV PATH="/root/.volta/bin:$PATH"

# Copy the extracted AppImage files from the appimage stage
COPY --from=appimage /app/squashfs-root /app/squashfs-root

# Set environment variable for the AppImage path
ENV SLICER_EXECUTABLE_PATH=/app/squashfs-root/AppRun

# Copy the built Next.js application from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Start the Next.js application with a dynamic port
CMD ["sh", "-c", "npm run start -- --port ${PORT:-8080}"]
