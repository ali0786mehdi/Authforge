# 🛡️ AuthForge

A production-grade authentication and authorization API built with Node.js, TypeScript, and PostgreSQL.

Designed as a plug-and-play identity provider implementing modern security standards — JWT token rotation, RBAC, OAuth2 social login, TOTP-based 2FA, and Redis-backed session management.

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7+-DC382D?style=flat-square&logo=redis&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## Overview

AuthForge is a standalone auth service built to be integrated with any frontend or backend system. It handles the entire identity lifecycle — from registration to session revocation — so your main application doesn't have to.

Built as a real-world portfolio project to demonstrate deep backend engineering: not just "it works" but correct security patterns, clean architecture, and production deployment practices.

---

## Features

| Feature | Status |
|---------|--------|
| Email/password registration with bcrypt hashing | ✅ Phase 2 |
| JWT access token + refresh token rotation | ✅ Phase 2 |
| Redis-backed token blacklisting | ✅ Phase 3 |
| Role-Based Access Control (RBAC) | ✅ Phase 3 |
| Rate limiting and brute-force protection | ✅ Phase 3 |
| Email verification | ✅ Phase 4 |
| Password reset flow | ✅ Phase 4 |
| Time-based 2FA (TOTP — Google Authenticator) | ✅ Phase 4 |
| Google and GitHub OAuth2 login | ✅ Phase 5 |
| Multi-device session management | ✅ Phase 5 |
| OpenAPI / Swagger documentation | ✅ Phase 6 |
| Docker + docker-compose setup | ✅ Phase 6 |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18+ |
| Language | TypeScript 5.x |
| Framework | Express.js |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Cache / Sessions | Redis |
| Auth tokens | JSON Web Tokens (JWT) |
| Password hashing | bcrypt |
| Validation | Zod |
| API docs | Swagger / OpenAPI 3.0 |
| Containerization | Docker + docker-compose |

---

## Project Structure

```
authforge/
├── prisma/
│   ├── migrations/          # Auto-generated migration history
│   └── schema.prisma        # Database schema
├── src/
│   ├── config/
│   │   └── env.ts           # Zod-validated environment variables
│   ├── lib/
│   │   └── prisma.ts        # Prisma client singleton
│   ├── routes/
│   │   └── health.routes.ts
│   ├── app.ts               # Express app factory
│   └── server.ts            # Entry point + graceful shutdown
├── .env.example
├── .gitignore
├── tsconfig.json
├── package.json
└── README.md
```

> Structure grows as phases are completed — `controllers/`, `middleware/`, `services/`, and `utils/` folders are added from Phase 2 onwards.

---

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL 16 (or Docker)
- Redis 7+ (added in Phase 3, or Docker)

The quickest local setup uses Docker — no Postgres or Redis install needed:

```bash
# PostgreSQL
docker run --name authforge-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=authforge \
  -p 5432:5432 -d postgres:16

# Redis (Phase 3 onwards)
docker run --name authforge-redis \
  -p 6379:6379 -d redis:7-alpine
```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ali0786mehdi/authforge.git
cd authforge

# 2. Install dependencies
npm install

# 3. Copy environment file and fill in your values
cp .env.example .env

# 4. Run database migrations
npx prisma migrate dev

# 5. Start the development server
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env`. Variables are validated at startup — the server will crash immediately with a clear error if any required variable is missing.

**Phase 1 (current)**

```env
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/authforge?schema=public"
```

**Added in later phases**

```env
# Phase 2 — JWT
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Phase 3 — Redis
REDIS_URL=redis://localhost:6379

# Phase 4 — Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

# Phase 5 — OAuth2
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=

# Phase 6 — App URL (for CORS lock-down)
CLIENT_URL=http://localhost:3000
```

### Available Scripts

```bash
npm run dev          # Start dev server with hot reload (tsx watch)
npm run build        # Compile TypeScript to dist/
npm run start        # Run compiled output (production)
npm run prisma:studio # Open Prisma Studio (visual DB browser)
```

---

## API Reference

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | None | Server + database status |

**Response `200 OK`**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-06-14T12:00:00.000Z"
}
```

**Response `503 Service Unavailable`** *(database unreachable)*
```json
{
  "status": "error",
  "database": "disconnected",
  "timestamp": "2026-06-14T12:00:00.000Z"
}
```

### Auth — Phase 2

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/auth/register` | None | Register a new user |
| `POST` | `/api/v1/auth/login` | None | Login, returns token pair |
| `POST` | `/api/v1/auth/logout` | Bearer | Revoke refresh token |
| `POST` | `/api/v1/auth/refresh` | Cookie | Issue new access token |
| `GET` | `/api/v1/auth/me` | Bearer | Get current user profile |

### 2FA, OAuth2, Sessions — Phases 3–5

Full API reference available at `/api/docs` once Phase 6 (Swagger) is complete.

---

## Roadmap

- [x] Phase 1 — Foundation (Express, TypeScript, PostgreSQL, Prisma, health check)
- [ ] Phase 2 — Core auth (register, login, JWT access + refresh token rotation)
- [ ] Phase 3 — Sessions & security (Redis, rate limiting, RBAC, token blacklisting)
- [ ] Phase 4 — Account lifecycle (email verification, password reset, 2FA/TOTP)
- [ ] Phase 5 — Social login (Google + GitHub OAuth2, multi-device session management)
- [ ] Phase 6 — Docs & containers (Swagger/OpenAPI, Dockerfile, docker-compose)

---

## License

MIT © [Ali Mehdi Mirza](https://github.com/ali0786mehdi)
