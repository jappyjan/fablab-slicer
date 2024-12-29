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

# Download the AppImage and rename it to OrcaSlicer.AppImage
RUN wget -O OrcaSlicer.AppImage https://github.com/SoftFever/OrcaSlicer/releases/download/v2.2.0/OrcaSlicer_Linux_V2.2.0.AppImage

# Make the AppImage executable
RUN chmod +x OrcaSlicer.AppImage

# Stage 3: Create the production image
FROM linuxserver/orcaslicer:latest AS production

WORKDIR /app

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Set environment variable for the AppImage path
ENV SLICER_EXECUTABLE_PATH=/tmp/orca.app

# Copy the built Next.js application from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./

# Copy the AppImage from the appimage stage
COPY --from=appimage /app/OrcaSlicer.AppImage $SLICER_EXECUTABLE_PATH

# Install only production dependencies
RUN npm install --only=production

# Expose the port the app runs on
EXPOSE 3000

# Start the Next.js application
CMD ["npm", "start"]
