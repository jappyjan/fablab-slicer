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
FROM debian:bullseye

# Set environment variable for the AppImage path
ENV SLICER_EXECUTABLE_PATH=/orcaslicer/squashfs-root/AppRun

# Set the OrcaSlicer version as an environment variable
ENV ORCASLICER_DOWNLOAD_URL=https://github.com/SoftFever/OrcaSlicer/releases/download/v2.2.0/OrcaSlicer_Linux_Ubuntu2404_V2.2.0.AppImage

RUN apt update -y \
    && apt install -y --no-install-recommends --allow-unauthenticated \
        gosu ca-certificates lxde gtk2-engines-murrine gnome-themes-standard gtk2-engines-pixbuf gtk2-engines-murrine arc-theme libwebkit2gtk-4.0-37 \
        freeglut3 libgtk2.0-dev libwxgtk3.0-gtk3-dev libwx-perl libxmu-dev libgl1-mesa-glx libgl1-mesa-dri \
        xdg-utils locales pcmanfm libgtk-3-dev libglew-dev libudev-dev libdbus-1-dev zlib1g-dev locales locales-all \
        libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev libgstreamer-plugins-bad1.0-dev gstreamer1.0-plugins-base \
        gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly gstreamer1.0-libav gstreamer1.0-tools \
        gstreamer1.0-x gstreamer1.0-alsa gstreamer1.0-gl gstreamer1.0-gtk3 gstreamer1.0-qt5 gstreamer1.0-pulseaudio \
        jq curl git 
        #firefox-esr 
#    && apt autoclean -y \
#    && apt autoremove -y

WORKDIR /orcaslicer

RUN mkdir -p /orcaslicer/orcaslicer-dist

RUN curl -sSL ${ORCASLICER_DOWNLOAD_URL} > /orcaslicer/orcaslicer-dist/orcaslicer.AppImage \
    && chmod -R 775 /orcaslicer/orcaslicer-dist/orcaslicer.AppImage \
    && dd if=/dev/zero bs=1 count=3 seek=8 conv=notrunc of=orcaslicer-dist/orcaslicer.AppImage \
    && bash -c "/orcaslicer/orcaslicer-dist/orcaslicer.AppImage --appimage-extract"

#RUN rm -rf /var/lib/apt/lists/*
#RUN apt-get autoclean 

RUN chmod -R 777 /orcaslicer/
RUN groupadd orcaslicer
RUN useradd -g orcaslicer --create-home --home-dir /home/orcaslicer orcaslicer
RUN mkdir -p /orcaslicer
RUN mkdir -p /configs 
RUN mkdir -p /prints/ 
RUN chown -R orcaslicer:orcaslicer /orcaslicer/ /home/orcaslicer/ /prints/ /configs/ 
RUN locale-gen en_US 
RUN mkdir /configs/.local 
RUN mkdir -p /configs/.config/ 
RUN ln -s /configs/.config/ /home/orcaslicer/
RUN mkdir -p /home/orcaslicer/.config/
RUN mkdir -p /home/orcaslicer/.config/OrcaSlicer/

WORKDIR /app


# Install Volta and Node.js
RUN curl https://get.volta.sh | bash \
    && /root/.volta/bin/volta install node@20

# Add Volta to PATH
ENV PATH="/root/.volta/bin:$PATH"

# Copy the built Next.js application from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Start the Next.js application with a dynamic port
CMD ["bash", "-c", "chown -R orcaslicer:orcaslicer /configs/ /home/orcaslicer/ /prints/ /dev/stdout && exec /root/.volta/bin/npm run start -- --port ${PORT:-8080}"]
