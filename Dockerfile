FROM node:22-slim AS builder

WORKDIR /app

# Bağımlılık dosyalarını kopyala
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

# Yükle (devDependencies dahil) — puppeteer Chromium indirmesin
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm install --include=dev

# Tüm kodu kopyala
COPY . .

# Build et
RUN npm run build -w @wellanalytics/api

# --- RUN STAGE ---
FROM node:22-slim

WORKDIR /app

# Chromium ve bağımlılıklarını kur (Puppeteer için)
RUN apt-get update && apt-get install -y \
    chromium \
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxcb1 \
    libxkbcommon0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    fonts-liberation \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Puppeteer'ı sistem Chromium'una yönlendir
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Sadece gerekli dosyaları al
COPY --from=builder /app /app

# API portu
EXPOSE 3001

# Uygulamayı başlat
CMD ["npm", "run", "start", "-w", "@wellanalytics/api"]
