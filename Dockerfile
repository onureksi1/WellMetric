FROM node:22-slim AS builder

WORKDIR /app

# Bağımlılık dosyalarını kopyala
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

# Yükle (devDependencies dahil)
RUN npm install

# Tüm kodu kopyala
COPY . .

# Build et
RUN npm run build -w packages/shared
RUN npm run build -w @wellanalytics/api

# --- RUN STAGE ---
FROM node:22-slim

WORKDIR /app

# Sadece gerekli dosyaları al
COPY --from=builder /app /app

# API portu
EXPOSE 3001

# Uygulamayı başlat
CMD ["npm", "run", "start", "-w", "@wellanalytics/api"]
