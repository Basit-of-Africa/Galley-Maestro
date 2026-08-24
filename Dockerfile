# --- Build Stage ---
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies needed for native modules (canvas, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# --- Production Stage ---
FROM node:20-slim

WORKDIR /app

# Install Chrome dependencies + Chromium for Puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    libnss3 \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libgbm1 \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Copy only what's needed for production
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/assets ./src/assets

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
