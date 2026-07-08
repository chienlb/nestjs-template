# CLAUDE.md

## Project Overview

This project is a TypeScript Express.js backend boilerplate.

Primary goals:

- Clean Architecture
- Modular design
- Strong typing
- Reusable components
- Easy testing
- Production ready

---

# Tech Stack

- TypeScript
- Express
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Docker
- Zod Validation
- Pino Logger

---

# Project Structure

src/
    configs/
    controllers/
    services/
    repositories/
    routes/
    middlewares/
    validators/
    schemas/
    interfaces/
    utils/
    constants/
    types/
    helpers/

Never create unnecessary folders.

---

# Coding Rules

Always:

- Use async/await.
- Prefer composition over inheritance.
- Keep functions small.
- Use descriptive variable names.
- Use arrow functions unless class methods are required.
- Export named functions whenever possible.
- Write strict TypeScript.
- Avoid any.
- Avoid non-null assertions (!).

---

# Error Handling

Never throw raw Error.

Always use:

```ts
throw new ApiError(...)
```

Global error middleware handles all responses.

---

# API Response Format

Success

```json
{
    "success": true,
    "message": "...",
    "data": {}
}
```

Error

```json
{
    "success": false,
    "message": "...",
    "errors": []
}
```

---

# Validation

Use Zod.

Never validate inside controllers.

Controllers only call services.

---

# Controllers

Controllers should:

- parse request
- call service
- return response

Business logic must not exist inside controllers.

---

# Services

Services contain business logic.

Services may call repositories.

Services never access Express Request or Response.

---

# Repository

Repositories only communicate with database.

No business logic.

---

# Authentication

Use JWT Bearer Token.

Authenticated user is stored in:

```ts
req.user
```

Never decode JWT manually inside controllers.

---

# Authorization

Authorization should be implemented using middleware.

Example:

```
authenticate
requireRole(...)
requirePermission(...)
```

---

# Environment Variables

Always read environment variables from

```
env.config.ts
```

Never access process.env directly outside configuration files.

---

# Logging

Use request logger middleware.

Never use console.log.

Use logger.info()

Use logger.error()

---

# Naming Convention

Variables

camelCase

Functions

camelCase

Classes

PascalCase

Interfaces

PascalCase

Enums

PascalCase

Constants

UPPER_SNAKE_CASE

Files

kebab-case.ts

---

# Imports

Use alias imports.

Example

```ts
import { env } from "@/configs/env.config";
```

Avoid relative imports like

```ts
../../../
```

---

# Database

Use Prisma.

Never write raw SQL unless necessary.

Database access belongs in repositories.

---

# Comments

Avoid unnecessary comments.

Only explain why, not what.

---

# Dependencies

Prefer built-in APIs.

Avoid adding dependencies without clear benefit.

---

# Testing

Use Vitest.

Test services.

Avoid testing Express routing.

---

# Performance

Avoid duplicate database queries.

Use pagination.

Select only required fields.

---

# Security

Never expose passwords.

Hash passwords with bcrypt.

Validate all inputs.

Sanitize user data.

Enable CORS.

Use Helmet.

Rate limit authentication endpoints.

---

# Docker

Application must support Docker.

Environment variables come from .env.

Never hardcode credentials.

---

# AI Instructions

When generating code:

- Follow existing project structure.
- Reuse utilities before creating new ones.
- Do not duplicate logic.
- Keep implementations simple.
- Prefer readability over clever code.
- Explain important architectural decisions briefly.
- Generate production-ready code.