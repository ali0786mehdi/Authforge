# 🛡️ AuthForge

A complete, production-ready Authentication and Authorization system built with Node.js, TypeScript, and PostgreSQL. 

AuthForge is designed to be a highly secure, scalable, and plug-and-play identity provider. It implements modern security standards including JWT token rotation, Role-Based Access Control (RBAC), OAuth2 integration, and real-time session management via Redis.

## ✨ Features

* **Core Authentication:** Email/Password registration with secure hashing (Argon2/Bcrypt).
* **Advanced Security:** JWT issuing with Refresh Token rotation and Redis-backed token blacklisting.
* **OAuth2 Integration:** Seamless social login via Google and GitHub.
* **Multi-Factor Authentication (2FA):** Time-based One-Time Passwords (TOTP) for enhanced account security.
* **Authorization:** Granular Role-Based Access Control (RBAC) for securing API endpoints.
* **Session Management:** Track, manage, and revoke active sessions across multiple devices.
* **Traffic Control:** Strict rate-limiting and IP blocking to prevent brute-force and DDoS attacks.
* **Data Integrity:** Complete input validation and type safety using Zod and TypeScript.
* **Developer Experience:** Fully versioned API (v1) with comprehensive error handling.

## 🛠️ Tech Stack

* **Runtime & Framework:** Node.js, Express.js (or Next.js API Routes), TypeScript
* **Database & ORM:** PostgreSQL, Prisma ORM
* **Caching & Sessions:** Redis
* **Security:** JSON Web Tokens (JWT), Passport.js (for OAuth), Express Rate Limit
* **Validation:** Zod

## 🚀 Getting Started

### Prerequisites
Ensure you have the following installed:
* Node.js (v18+)
* PostgreSQL
* Redis
* Docker (Optional, for easy database/Redis setup)

### Installation

1. **Clone the repository**
   ```bash
   git clone [https://github.com/ali0786mehdi/Authforge.git](https://github.com/ali0786mehdi/Authforge.git)
   cd Authforge
