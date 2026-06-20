# 🛡️ AuthForge

> Enterprise-Grade Authentication & Authorization Service built with Node.js, TypeScript, PostgreSQL, Prisma, and Redis.

AuthForge is a production-oriented identity platform designed to handle authentication, authorization, session management, and account security for modern web applications.

Instead of rebuilding authentication logic inside every project, AuthForge acts as a standalone authentication service responsible for user identity, access control, session lifecycle management, and security enforcement.

The project is being developed as a backend engineering portfolio project focused on real-world architecture, security practices, scalability considerations, and production readiness.

---

## ✨ Goals

AuthForge aims to demonstrate:

- Secure authentication architecture
- JWT access and refresh token lifecycle management
- Session management using Redis
- Role-Based Access Control (RBAC)
- Multi-Factor Authentication (MFA)
- OAuth2 Social Authentication
- Secure password recovery flows
- Production-grade API design
- Dockerized deployment
- OpenAPI documentation
- Scalable backend architecture

---

# 🏗 System Architecture

```text
                     ┌──────────────────┐
                     │  Client Apps     │
                     │ Web / Mobile     │
                     └────────┬─────────┘
                              │
                              ▼

                 ┌─────────────────────────┐
                 │      Express API        │
                 │ Authentication Service  │
                 └─────────┬───────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼

┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ PostgreSQL   │   │ Redis Cache  │   │ OAuth/Email │
│ User Data    │   │ Sessions     │   │ Providers   │
└──────────────┘   └──────────────┘   └──────────────┘
```

---

# ⚙️ Tech Stack

| Layer | Technology |
|---------|------------|
| Runtime | Node.js 20+ |
| Language | TypeScript |
| Framework | Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Cache | Redis |
| Authentication | JWT |
| Validation | Zod |
| Password Hashing | bcrypt |
| API Documentation | Swagger/OpenAPI |
| Containerization | Docker |
| Background Jobs | BullMQ *(planned)* |
| Logging | Pino *(planned)* |

---

# 📂 Project Structure

```text
authforge/

├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   │
│   ├── config/
│   │   ├── env.ts
│   │   └── constants.ts
│   │
│   ├── lib/
│   │   ├── prisma.ts
│   │   └── redis.ts
│   │
│   ├── routes/
│   │
│   ├── controllers/
│   │
│   ├── services/
│   │
│   ├── repositories/
│   │
│   ├── middleware/
│   │
│   ├── validators/
│   │
│   ├── utils/
│   │
│   ├── types/
│   │
│   ├── app.ts
│   └── server.ts
│
├── docs/
├── docker/
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

---

# 🧠 Architecture Principles

AuthForge follows a layered architecture.

```text
Routes
  │
Controllers
  │
Services
  │
Repositories
  │
Database
```

### Routes

Responsible only for endpoint definitions and middleware composition.

### Controllers

Handle HTTP concerns and response formatting.

### Services

Contain business logic.

### Repositories

Abstract database access and persistence operations.

### Infrastructure Layer

Handles:

- PostgreSQL
- Redis
- SMTP
- OAuth Providers
- Logging
- Configuration

---

# 🔐 Security Features

## Password Security

Passwords are hashed using bcrypt before storage.

```text
Password
   ↓
bcrypt
   ↓
Database
```

---

## JWT Authentication

AuthForge uses:

- Access Tokens
- Refresh Tokens

```text
Login
  ↓
Access Token (Short-lived)
Refresh Token (Long-lived)
```

---

## Refresh Token Rotation

Every refresh operation issues:

- New Access Token
- New Refresh Token

and invalidates the previous refresh token.

This helps mitigate token replay attacks.

---

## Session Revocation

Redis stores active sessions and revoked tokens.

```text
Logout
  ↓
Token Revoked
  ↓
Redis
  ↓
Future Requests Rejected
```

---

## Rate Limiting

Planned protection against:

- Credential stuffing
- Brute-force attacks
- API abuse

---

## Multi-Factor Authentication

Planned support:

- TOTP
- Google Authenticator
- Authenticator Apps

---

# 🚀 Features

## Phase 1 — Foundation

- [x] Express Setup
- [x] TypeScript Configuration
- [x] PostgreSQL Integration
- [x] Prisma ORM
- [x] Environment Validation
- [x] Health Check Endpoint
- [x] Graceful Shutdown

---

## Phase 2 — Core Authentication

- [ ] User Registration
- [ ] User Login
- [ ] Password Hashing
- [ ] JWT Access Tokens
- [ ] Refresh Tokens
- [ ] Logout
- [ ] Current User Endpoint

---

## Phase 3 — Security & Sessions

- [ ] Redis Integration
- [ ] Session Management
- [ ] Token Blacklisting
- [ ] Refresh Token Rotation
- [ ] Refresh Token Reuse Detection
- [ ] Rate Limiting
- [ ] RBAC

---

## Phase 4 — Account Lifecycle

- [ ] Email Verification
- [ ] Password Reset
- [ ] Change Password
- [ ] TOTP-Based MFA
- [ ] Audit Logging

---

## Phase 5 — Social Authentication

- [ ] Google OAuth2
- [ ] GitHub OAuth2
- [ ] Multi-Device Sessions
- [ ] Session Dashboard

---

## Phase 6 — Production Readiness

- [ ] Swagger Documentation
- [ ] Dockerfile
- [ ] Docker Compose
- [ ] Structured Logging
- [ ] Health Monitoring
- [ ] CI/CD Pipeline

---

# 📖 API Reference

## Health

### GET /api/health

Response

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-06-20T12:00:00.000Z"
}
```

---

## Authentication (Phase 2)

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET  /api/v1/auth/me
```

---

## Authorization (Phase 3)

```http
GET /api/v1/admin/users
GET /api/v1/admin/sessions
```

---

# 🛠 Local Development

## Clone Repository

```bash
git clone https://github.com/ali0786mehdi/authforge.git

cd authforge
```

---

## Install Dependencies

```bash
npm install
```

---

## Configure Environment

```bash
cp .env.example .env
```

---

## Run PostgreSQL

```bash
docker run \
--name authforge-db \
-e POSTGRES_PASSWORD=postgres \
-e POSTGRES_DB=authforge \
-p 5432:5432 \
-d postgres:16
```

---

## Run Redis

```bash
docker run \
--name authforge-redis \
-p 6379:6379 \
-d redis:7-alpine
```

---

## Run Migrations

```bash
npx prisma migrate dev
```

---

## Start Development Server

```bash
npm run dev
```

---

# 🌍 Environment Variables

```env
NODE_ENV=development

PORT=5000

DATABASE_URL=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

REDIS_URL=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

CLIENT_URL=
```

---

# 📈 Future Enhancements

- SAML Authentication
- Organization Workspaces
- Fine-Grained Permissions
- Audit Dashboard
- API Keys
- Device Trust Management
- Queue-Based Email Delivery
- Redis Clustering
- Read Replicas
- Distributed Tracing

---

# 🤝 Contributing

Contributions, issues, and feature requests are welcome.

Feel free to fork the repository and submit a pull request.

---

# 📄 License

MIT License

---

# 👨‍💻 Author

**Ali Mehdi Mirza**

Backend Engineering Portfolio Project

Building production-grade backend systems with Node.js, TypeScript, PostgreSQL, Prisma, Redis, and modern authentication architecture.
