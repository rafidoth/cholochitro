# Cholochitro - Movie Ticket Booking System

A production-ready, scalable movie ticket booking backend engineered to handle **20,000+ concurrent requests**. Built with modern software engineering best practices including clean architecture, comprehensive testing, and containerized deployment.

---

## Architecture Overview (Current)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│                   (Next.js 16 + React 19)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                              │
│              Express.js 5 + Helmet + CORS                       │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    Routes    │    │  Middleware  │    │  Validation  │
│    Layer     │    │    Chain     │    │    (Zod)     │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Controllers Layer                           │
│              Request/Response Handling                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Services Layer                             │
│                    Business Logic                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Data/Repository Layer                         │
│                  Database Operations                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL 16                              │
│                Connection Pooling (pg)                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend
| Category | Technology |
|----------|------------|
| Runtime | Node.js 22 (Alpine) |
| Language | TypeScript 5.9 |
| Framework | Express.js 5 |
| Database | PostgreSQL 16 |
| Authentication | JWT (jsonwebtoken) |
| Validation | Zod 4 |
| Logging | Pino |
| Security | Helmet |
| Testing | Jest + Supertest |

### Frontend
| Category | Technology |
|----------|------------|
| Framework | Next.js 16 |
| UI Library | React 19 |
| State Management | TanStack React Query |
| Styling | Tailwind CSS 4 |
| Components | Radix UI + shadcn/ui |

### DevOps
| Category | Technology |
|----------|------------|
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Package Manager | pnpm |

---

## API Reference

### Base URL
```
/api/v1
```

### Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | - | Returns server health status and database connectivity. Essential for load balancer health checks and monitoring systems. |

---

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | - | Creates a new user account with email, password, and display name. Implements secure password hashing using crypto.scrypt with unique salt per user. |
| `POST` | `/auth/login` | - | Authenticates user credentials and returns a signed JWT token. Token contains user ID and role for stateless authentication across requests. |
| `POST` | `/auth/logout` | JWT | Invalidates the current user session. Designed for token blacklisting implementation to prevent token reuse after logout. |
| `GET` | `/auth/me` | JWT | Returns the authenticated user's profile information including ID, email, display name, and role. Useful for session validation and UI personalization. |

---

### Movies (Public)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/movies` | - | Retrieves paginated list of movies with optional filtering by status (now_showing, coming_soon, ended). Supports cursor-based pagination for optimal performance with large datasets. |
| `GET` | `/movies/:id` | - | Fetches detailed information for a specific movie including title, description, duration, genre, and current screening status. |
| `GET` | `/movies/:movieId/showtimes` | - | Returns all scheduled showtimes for a given movie. Enables users to see available screening times before selecting seats. |

---

### Showtimes (Public)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/showtimes` | - | Lists all showtimes with filtering by movie ID and date. Pagination supported for handling high-volume screening schedules efficiently. |
| `GET` | `/showtimes/:id` | - | Retrieves complete details for a specific showtime including movie info, date/time, and ticket pricing. |
| `GET` | `/showtimes/:showtimeId/seats` | - | Returns real-time seat availability matrix (10x10 grid, 100 seats). Critical endpoint for the booking flow showing available vs booked seats. |

---

### Bookings (Authenticated)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/bookings` | JWT | Creates a new booking with selected seats for a showtime. Implements atomic seat reservation to prevent double-booking under concurrent load. |
| `GET` | `/bookings` | JWT | Lists all bookings for the authenticated user with status filtering (pending, confirmed, cancelled). Supports pagination for users with booking history. |
| `GET` | `/bookings/:id` | JWT | Retrieves detailed booking information including showtime, movie, selected seats, and payment status. Only accessible by the booking owner. |
| `DELETE` | `/bookings/:id` | JWT | Cancels an existing booking and releases the reserved seats back to availability. Implements soft-delete for audit trail compliance. |
| `POST` | `/bookings/:id/confirm` | JWT | Confirms a pending booking after successful payment processing. Transitions booking status from pending to confirmed atomically. |

---

### Admin - Movies

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/admin/movies` | Admin | Creates a new movie entry in the catalog. Requires admin role. Validates all movie metadata including duration, genre, and release information. |
| `PUT` | `/admin/movies/:id` | Admin | Updates existing movie information. Supports partial updates for modifying specific fields without affecting others. |
| `DELETE` | `/admin/movies/:id` | Admin | Removes a movie from the catalog. Implements cascading logic to handle associated showtimes and bookings appropriately. |

---

### Admin - Showtimes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/admin/showtimes` | Admin | Schedules a new movie showtime with date, time, and pricing. Validates against scheduling conflicts and theater capacity constraints. |
| `PUT` | `/admin/showtimes/:id` | Admin | Modifies showtime details including reschedule operations. Handles notification requirements for affected bookings. |
| `DELETE` | `/admin/showtimes/:id` | Admin | Removes a scheduled showtime. Enforces business rules around cancellation policies and existing bookings. |

---

### Admin - Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/admin/bookings` | Admin | Retrieves system-wide booking list with comprehensive filtering options. Enables operational oversight and reporting capabilities. |
| `PUT` | `/admin/bookings/:id/status` | Admin | Manually updates booking status for customer service operations. Supports status transitions with validation and audit logging. |

---

## Engineering Practices

### Clean Architecture
- **Layered separation**: Routes → Controllers → Services → Data Access
- **Dependency injection** ready structure
- **Single Responsibility Principle** across all modules

### Security
- JWT-based stateless authentication
- Role-based access control (RBAC)
- Password hashing with crypto.scrypt + unique salts
- Helmet.js security headers
- Input validation at API boundary with Zod

### Code Quality
- TypeScript strict mode
- Comprehensive Zod schemas for runtime validation
- Structured logging with Pino
- Custom error classes with error codes
- ESLint + Prettier configuration

### Testing
- Unit and integration tests with Jest
- API endpoint testing with Supertest
- CI pipeline with GitHub Actions

### Scalability Considerations
- Connection pooling with pg
- Stateless JWT authentication
- Pagination on all list endpoints
- Containerized deployment ready

---

## Quick Start

### Prerequisites
- Node.js 22+
- pnpm
- Docker & Docker Compose

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/cholochitro.git
cd cholochitro

# Install dependencies
pnpm install

# Start PostgreSQL
docker compose up -d db

# Run migrations
pnpm migrate up

# Start development server
pnpm dev
```

### Docker Deployment

```bash
# Build and run all services
docker compose up --build
```

---

## Project Structure

```
cholochitro/
├── src/
│   ├── config/          # Database & environment configuration
│   ├── controllers/     # Request handlers
│   ├── data/            # Repository/Data access layer
│   ├── middlewares/     # Auth, validation middlewares
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic layer
│   ├── types/           # TypeScript types & Zod schemas
│   ├── utils/           # Logging & utilities
│   └── tests/           # Test suites
├── migrations/          # Database migrations
├── web/                 # Next.js frontend
└── docker-compose.yaml  # Container orchestration
```

---

## License

MIT
