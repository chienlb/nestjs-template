# NestJS Template Project

A modern project template built on top of [NestJS](https://nestjs.com/) featuring the latest tools, libraries, and best-practice architectures to help you kickstart your feature development immediately.

## 🚀 Features

This template is pre-configured with the following modules and tools:

- **Database (PostgreSQL + Prisma):** Robust database management with full type-safety using Prisma ORM.
- **Caching (Redis):** Integrated `ioredis` (configured via a Global `RedisModule`) to boost application speed and manage queues/sessions.
- **Docker Ready:** A `docker-compose.yml` file is provided to spin up PostgreSQL and Redis with a single command.
- **Authorization (RBAC):** Built-in Role-Based Access Control scaffolding (`Role` enum, `@Roles()` decorator, `RolesGuard`).
- **Git Hooks (Husky + lint-staged):** Automatically formats code with Prettier and fixes linting errors with ESLint before every `git commit`.
- **Rich Utilities Library:** The `src/common/utils/` directory contains highly reusable helper functions:
  - `token.util.ts`: Generate/Verify JWT tokens, generate OTPs, hash OTPs/Refresh Tokens.
  - `password.util.ts`: Hash and compare passwords using `bcrypt`.
  - `string.util.ts`: Remove Vietnamese accents, capitalize letters, validate Emails/Phone numbers.
  - `date.util.ts`: Time manipulation (add/subtract dates and times).
  - `array.util.ts`: Group arrays, remove duplicate elements.
  - `file.util.ts`: Extract file extensions, generate random file names for secure uploads.
  - `crypto.util.ts`: AES-256-CBC symmetric encryption for storing API Keys or sensitive configurations.
  - `pagination.util.ts`: Standardized pagination response builder for clients.
  - `slug.util.ts`: Generate SEO-friendly URLs using `slugify`.

## ⚙️ System Requirements

- Node.js (v20+)
- pnpm (Recommended package manager)
- Docker & Docker Compose (for running local databases)

## 🛠️ Installation & Setup

### 1. Install dependencies
```bash
pnpm install
```

### 2. Environment Variables
Open the `.env` file and review the configuration. The template provides a standard `.env` file:
```env
PORT=3000

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_USER=postgres
POSTGRES_PASSWORD=123456
POSTGRES_DB=nestjs_template
DATABASE_URL=postgresql://postgres:123456@localhost:5433/nestjs_template?schema=public

# Redis
REDIS_PORT=6379

# JWT
JWT_SECRET="super-secret-jwt-key-change-me"
JWT_EXPIRES_IN="1d"
```

### 3. Start Database & Redis
Use Docker to start Postgres and Redis in the background:
```bash
docker-compose up -d
```

### 4. Sync Database Schema
```bash
pnpm exec prisma db push
# or pnpm exec prisma migrate dev
```

### 5. Start the NestJS Application
```bash
# Development environment (auto-reloads on file changes)
pnpm run start:dev
```

The application will be running at: `http://localhost:3000`.

## 📂 Folder Structure

```
src/
├── common/                  # Global shared components
│   ├── decorators/          # Custom decorators (e.g., @Roles)
│   ├── enums/               # Standard enums (e.g., Role)
│   ├── guards/              # Custom guards (e.g., RolesGuard)
│   └── utils/               # Utility functions (Token, String, Crypto, etc.)
├── config/                  # Environment variables configuration (env.config.ts)
├── database/                # Database connection modules
│   ├── postgre-sql/         # Prisma Module and Service
│   └── redis/               # Redis Module and Service (ioredis)
├── modules/                 # Domain feature modules (User, Product, etc.)
├── app.controller.ts
├── app.module.ts            # Root application module
└── main.ts                  # Application entry point
```

## 📝 Useful Scripts

- `pnpm run format`: Format the entire codebase using Prettier.
- `pnpm run lint`: Run ESLint to check and automatically fix code style issues.
- `pnpm run build`: Build the project into the `dist` directory for Production deployment.
- `pnpm g:module <name>`: Generate a new NestJS feature module complete with its own Module, Controller, Service, Repository, and Create/Update DTO files.
- `pnpm gen module new --name <name>`: Generate a new NestJS module using Hygen templates.

---
*This template is designed following Clean Architecture and maintainability principles. You can freely add or remove modules in the `src` directory according to your project's specific needs.*
