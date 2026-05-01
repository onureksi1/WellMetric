# WellAnalytics

> **Multi-tenant çalışan deneyimi & wellbeing analitik platformu**

---

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Backend API | Node.js + NestJS |
| Veritabanı | PostgreSQL 16 (multi-tenant schema) |
| Cache / Kuyruk | Redis + BullMQ |
| Dosya Depolama | AWS S3 / Cloudflare R2 |
| E-posta | Resend |
| Auth | JWT + Refresh Token (rol bazlı) |
| AI / Analiz | Claude API (Anthropic) |
| CI/CD | GitHub Actions + Docker |

---

## Monorepo Yapısı

```
wellanalytics/
├── apps/
│   ├── api/          ← NestJS REST API (port 3001)
│   └── web/          ← Next.js 14 (port 3000)
├── packages/
│   └── shared/       ← Ortak TypeScript tipleri & sabitler
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## Hızlı Başlangıç

### 1. Ortam değişkenlerini ayarla

```bash
cp .env.example .env
# .env dosyasını düzenle
```

### 2. Altyapıyı başlat (PostgreSQL + Redis)

```bash
docker compose up -d
```

### 3. API'yi başlat

```bash
cd apps/api
npm install
npm run start:dev
```

### 4. Web uygulamasını başlat

```bash
cd apps/web
npm install
npm run dev
```

---

## Roller

| Rol | Açıklama |
|---|---|
| `super_admin` | Tüm firmalar, lisanslar, global anketler |
| `hr_admin` | Firma bazlı yönetim, raporlar |
| `employee` | Anket katılımı (opsiyonel hesap) |

---

## Mimari Notlar

- Tüm sorgular **`company_id`** ile izole edilir (NestJS interceptor katmanında zorlanır).
- Çalışan hesabı olmayan firmalar için **tek kullanımlık survey token** sistemi kullanılır.
- Anonimlik eşiği: minimum `anonymity_threshold` (varsayılan 5) yanıt olmadan departman detayı gösterilmez.
