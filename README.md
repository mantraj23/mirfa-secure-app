# Mirfa Secure Transaction App 🔒

A secure transaction processing application built for the Mirfa Engineering Challenge, featuring Envelope Encryption (AES-256-GCM), TurboRepo, and Docker support.

---

## 🚀 Live Demo

**Frontend:**  
https://mirfa-secure-app-web-ivory.vercel.app/

**Backend:**  
https://api-production-5ffc.up.railway.app/

---

## Loom Video 
https://www.loom.com/share/eef0535e7efa44f697895bceb1940cce


-----

## 🔑 Core Security (Envelope Encryption)

We use a two-tier key architecture to ensure maximum security:

- **Data Encryption Key (DEK):** Unique 32-byte key generated per transaction. Encrypts the payload.
- **Master Key (KEK):** System-wide key. Encrypts the DEK.
- **Storage:** Only encrypted payloads, wrapped DEKs, and nonces are stored. Plaintext keys never touch the disk.

---

## 🛠 Quick Start

### 1️⃣ Setup

```bash
git clone <your-repo-url>
cd mirfa-secure-app
pnpm install
```

---

### 2️⃣ Environment Variables (`.env`)

```env
DATABASE_URL="your_postgres_databse_url"
MASTER_KEY="<your_64_char_hex_key>" # Generate: openssl rand -hex 32
PORT=3001
JWT_SECRET= your_jwt_secret
```

---

### 3️⃣ Run Locally

```bash
pnpm db:push     # Push schema to DB (defined in packages/db)
pnpm build       # Runs build scripts 
pnpm dev         # Start Frontend (3000) & Backend (3001)
```

---

### 4️⃣ Run via Docker

```bash
docker build -t mirfa-api .
docker run -p 3001:3001 --env-file .env mirfa-api
```

---

## 📂 Architecture

### 🧰 Tech Stack

- **Frontend:** Next.js 14
- **Backend:** Fastify,  Prisma (Postgres-Neon)
- **Shared Packages:**
  - `@repo/crypto` → AES-GCM encryption logic
  - `@repo/db` → Prisma Client

---

## 🔌 API Endpoints

| Method | Endpoint            | Description                               |
|--------|--------------------|-------------------------------------------|
| POST   | `/auth/signup`     | Register new user                        |
| POST   | `/auth/login`      | Login & get JWT                          |
| POST   | `/tx/encrypt`      | Encrypt payload & store record           |
| GET    | `/tx`              | List user's encrypted records            |
| POST   | `/tx/:id/decrypt`  | Decrypt record (Server-side unwrapping)  |

---

## 🧪 Testing

Run the Vitest suite to verify encryption integrity and tamper resistance:

```bash
cd packages/crypto
pnpm test
```

---
