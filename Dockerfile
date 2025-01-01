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
FROM linuxserver/orcaslicer

# Set environment variable for the AppImage path
ENV SLICER_EXECUTABLE_PATH=/opt/orcaslicer/AppRun

WORKDIR /app

# Install Volta and Node.js
RUN apt-get update && apt-get install -y curl bash tar
RUN curl https://get.volta.sh | bash
ENV PATH="/config/.volta/bin:$PATH"
RUN /config/.volta/bin/volta install node@20

# Copy the built Next.js application from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm install --only=production

ENTRYPOINT []
# Start the Next.js application with a dynamic port
CMD [ "/config/.volta/bin/npm", "run", "start", "--", "--port", "$PORT" ]
