# cholochitro - Project Skills & File Organization Guide

> A Node.js backend API server for a movie/cinema application (Bengali: চলচ্চিত্র = "movie/cinema")

---

## Project Overview

**Tech Stack:**
- Runtime: Node.js 22 (Alpine)
- Language: TypeScript 5.9+
- Framework: Express 5
- Database: PostgreSQL 16
- Package Manager: pnpm
- Containerization: Docker + Docker Compose

**Architecture:** Layered architecture with Controllers → Services → Data (Repository) → Database

---

## Directory Structure & File Placement

```
cholochitro/
├── .agents/                    # AI agent configuration & skills
│   ├── skills/                 # Skill documentation for AI assistants
│   │   ├── nodejs-best-practices/
│   │   └── nodejs-backend-patterns/
│   └── skills.md               # This file - project overview
│
├── kulala/                     # HTTP API test files (Kulala plugin format)
│   └── *.http                  # Format: resource.method.action.http
│
├── migrations/                 # Database migrations (node-pg-migrate)
│   └── {timestamp}_{description}.ts
│
├── src/
│   ├── config/                 # App configuration
│   │   ├── database.ts         # PostgreSQL connection pool
│   │   └── env.ts              # Environment validation (Zod)
│   │
│   ├── controllers/            # HTTP request handlers
│   │   └── {resource}.controller.ts
│   │
│   ├── data/                   # Data access layer (repositories)
│   │   └── {resource}.data.ts
│   │
│   ├── middlewares/            # Express middleware
│   │   └── {name}_middleware.ts or {purpose}.ts
│   │
│   ├── routes/                 # Route definitions
│   │   ├── index.ts            # Route aggregator (versioned API)
│   │   └── {resource}.route.ts
│   │
│   ├── services/               # Business logic layer
│   │   └── {resource}.service.ts
│   │
│   ├── types/                  # TypeScript types & Zod schemas
│   │   ├── {resource}.ts       # Interface definitions
│   │   └── {resource}.schema.ts # Zod validation schemas
│   │
│   ├── utils/                  # Utility functions
│   │   └── {name}.ts
│   │
│   ├── app.ts                  # Express app configuration
│   └── index.ts                # Application entry point
│
├── docker-compose.yaml         # Docker services (app + PostgreSQL)
├── Dockerfile                  # Multi-stage build with pnpm
├── package.json
├── pnpm-lock.yaml
└── tsconfig.json
```

---

## File Placement Rules

### Where to Put New Files

| File Type | Location | Naming Convention | Example |
|-----------|----------|-------------------|---------|
| **Controllers** | `src/controllers/` | `{resource}.controller.ts` | `movie.controller.ts` |
| **Services** | `src/services/` | `{resource}.service.ts` | `movie.service.ts` |
| **Data/Repositories** | `src/data/` | `{resource}.data.ts` | `movie.data.ts` |
| **Routes** | `src/routes/` | `{resource}.route.ts` | `movie.route.ts` |
| **Types/Interfaces** | `src/types/` | `{resource}.ts` | `movie.ts` |
| **Zod Schemas** | `src/types/` | `{resource}.schema.ts` | `movie.schema.ts` |
| **Middleware** | `src/middlewares/` | `{purpose}.ts` | `rate_limiter.ts` |
| **Config** | `src/config/` | `{name}.ts` | `redis.ts` |
| **Utilities** | `src/utils/` | `{name}.ts` | `hash.ts` |
| **Migrations** | `migrations/` | `{timestamp}_{description}.ts` | `1738972800000_create-movies-table.ts` |
| **HTTP Tests** | `kulala/` | `{resource}.{method}.{action}.http` | `movies.get.list.http` |

### Adding a New Feature (e.g., "Movies")

1. Create types: `src/types/movie.ts` and `src/types/movie.schema.ts`
2. Create data layer: `src/data/movie.data.ts`
3. Create service: `src/services/movie.service.ts`
4. Create controller: `src/controllers/movie.controller.ts`
5. Create routes: `src/routes/movie.route.ts`
6. Register routes in `src/routes/index.ts`
7. Create migration if needed: `migrations/{timestamp}_create-movies-table.ts`
8. Add HTTP test file: `kulala/movies.post.create.http`

---

## Current Conventions

### Naming
- **Files**: `kebab-case.ts` or `camelCase.ts` (inconsistent, prefer `kebab-case`)
- **Classes**: `PascalCase`
- **Functions/Variables**: `camelCase`
- **Database tables/columns**: `snake_case`

### API Structure
- Base path: `/api/v1/`
- Health check: `/api/v1/health`
- Auth routes: `/api/v1/auth/*`

### Environment Variables
- Validated at startup using Zod (`src/config/env.ts`)
- Required: `PORT`, `DATABASE_URL`, `ENV_TYPE`

---

## Issues & Technical Debt (Brutally Honest Assessment)

### Critical Issues

1. **Missing Global Error Handler**
   - Location: `src/app.ts:20` - commented out: `// app.use(GetErrorHandler(logger));`
   - Impact: Unhandled errors will crash the server
   - Fix: Implement and enable the error handler middleware

2. **Console.log with Secrets in Production Code**
   - `src/config/env.ts:18`: `console.log(envs)` - logs ALL environment variables including secrets
   - `src/index.ts:9`: `console.log(port, envType)` - debug statement left in
   - Fix: Remove these immediately - security risk

3. **Port Mismatch in HTTP Test Files**
   - `kulala/auth.post.register.http` uses port `4002`
   - App runs on port `4001` (defined in `env.ts` and `docker-compose.yaml`)
   - Fix: Update test file to use correct port

4. **Duplicate URL Path in HTTP Test**
   - Line 27: `POST {{baseUrl}}/auth/register` duplicates `auth` (baseUrl already includes it)
   - Should be: `POST {{baseUrl}}/register`

### Naming Inconsistencies

5. **Data Layer Naming Mismatch**
   - Folder: `src/data/` 
   - Skill docs reference: `repositories/`
   - File: `user.data.ts` exports `userRepository`
   - Recommendation: Pick one naming convention - either rename folder to `repositories/` or rename exports to match `data` naming

### Dependencies Issues

6. **@types Packages in Wrong Section**
   - `@types/express` and `@types/node` are in `dependencies` instead of `devDependencies`
   - Fix: Move to `devDependencies`

### Testing

7. **No Tests Exist**
   - `package.json` test script: `echo "Error: no test specified" && exit 1`
   - No test files in codebase
   - Recommendation: Add tests using `node:test` (built-in) or Vitest

### Security Considerations

8. **CORS Configured with Wildcard**
   - `src/app.ts`: `cors({ origin: "*" })`
   - Acceptable for development, but must be restricted in production
   - Recommendation: Use environment-based CORS configuration

9. **Password Hashing Using Native Crypto**
   - Uses `crypto.scrypt` instead of `bcrypt` or `argon2`
   - While secure, industry recommendation is `bcrypt` or `argon2`
   - Not critical but worth considering for standardization

### Build & Production Concerns

10. **TypeScript Path Aliases Won't Work in Production**
    - Path aliases (`@/*` → `src/*`) work with `tsx` in development
    - After `tsc` build, these won't resolve without `tsc-alias` or `module-alias`
    - Fix: Add `tsc-alias` to build process or use relative imports

11. **Validation Error Details Not Returned to Client**
    - `http_request_validator.ts` logs formatted errors but returns generic message
    - Client only sees "Validation Error" without specifics
    - Recommendation: Return field-level error details in response

### Redundant Files

12. **Duplicate .gitignore**
    - Root `.gitignore` and `src/.gitignore` have identical contents
    - Fix: Remove `src/.gitignore`

---

## Recommended Fixes Priority

### High Priority (Fix Now)
1. Remove `console.log(envs)` from `src/config/env.ts` - security risk
2. Implement and enable global error handler
3. Fix port mismatch in HTTP test files

### Medium Priority (Fix Soon)
4. Move `@types/*` to devDependencies
5. Fix validation middleware to return error details
6. Add `tsc-alias` or switch to relative imports

### Low Priority (Tech Debt)
7. Standardize data layer naming (data vs repository)
8. Remove duplicate `.gitignore`
9. Add tests
10. Consider switching to `bcrypt`/`argon2` for password hashing

---

## Quick Commands

```bash
# Development
pnpm dev                    # Start with hot reload (tsx watch)

# Database
pnpm run migrate:up         # Run migrations
pnpm run migrate:create     # Create new migration

# Docker
docker compose up -d        # Start services
docker compose down         # Stop services

# Build (Note: path aliases need fixing)
pnpm build                  # TypeScript compile
```

---

## Best Practices from Skill Files

See `.agents/skills/` for detailed patterns:
- `nodejs-best-practices/SKILL.md` - Decision-making principles
- `nodejs-backend-patterns/SKILL.md` - Implementation patterns

Key principles enforced:
- Layered architecture (Controller → Service → Repository)
- Zod validation at boundaries
- Structured logging with Pino
- Parameterized SQL queries (no SQL injection)
- Environment validation at startup
