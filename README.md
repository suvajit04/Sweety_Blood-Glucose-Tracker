# Sweety — Blood Glucose Tracker

A full-stack web application for patients to log and review their daily blood glucose readings and for doctors to monitor assigned patients' reports.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Running the App](#running-the-app)
  - [Option A — Local Development (Recommended)](#option-a--local-development-recommended)
  - [Option B — Docker Compose (All-in-one)](#option-b--docker-compose-all-in-one)
- [Creating a Doctor Account](#creating-a-doctor-account)
- [Running Tests](#running-tests)
- [API Reference](#api-reference)
- [Available Scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Recharts |
| **Backend** | Node.js 22, Express 4, TypeScript |
| **Database** | PostgreSQL 16 (via Prisma ORM) |
| **Cache / Queue** | Redis 7 (via BullMQ + ioredis) |
| **Auth** | JWT stored in HTTP-only cookies |
| **Testing** | Vitest, @testing-library/react, Supertest |
| **Container** | Docker + Docker Compose |

---

## Project Structure

```
sweety/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/      # Shared UI components
│   │   ├── context/         # Auth context
│   │   ├── layouts/         # AppLayout (sidebar + topbar)
│   │   ├── pages/           # Route-level page components
│   │   ├── services/        # Axios API client
│   │   ├── styles.css       # Global stylesheet
│   │   └── types/           # Shared TypeScript types
│   └── package.json
├── server/                  # Express API
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   ├── migrations/      # SQL migration history
│   │   ├── seed.ts          # Doctor seeder (env-based)
│   │   └── create-doctor.ts # Interactive doctor creation script
│   ├── src/
│   │   ├── config/          # env, prisma, redis config
│   │   ├── controllers/     # Route handlers
│   │   ├── jobs/            # BullMQ background workers
│   │   ├── middleware/      # Auth, error handling
│   │   ├── routes/          # Express routers
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helpers
│   │   ├── validators/      # Zod schemas
│   │   ├── app.ts           # Express app setup
│   │   └── server.ts        # HTTP server entry point
│   ├── tests/               # Server-side tests
│   └── package.json
├── docker-compose.yml       # Full-stack Docker setup
├── package.json             # Root workspace (npm workspaces)
└── .env.example             # Environment variable template
```

---

## Prerequisites

Make sure the following are installed before you begin:

| Tool | Minimum version | Check |
|---|---|---|
| **Node.js** | 22.12 or later | `node --version` |
| **npm** | 10 or later | `npm --version` |
| **PostgreSQL** | 15 or later *(local dev)* | `psql --version` |
| **Redis** | 7 or later *(local dev)* | `redis-cli --version` |
| **Docker** *(optional)* | 24 or later | `docker --version` |

> [!TIP]
> If you don't want to install PostgreSQL and Redis locally, use **Option B (Docker Compose)** — it starts everything automatically.

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/suvajit04/sweety.git
cd sweety

# 2. Install all dependencies for both workspaces (server + client)
npm install
```

This single `npm install` at the root installs dependencies for all npm workspaces (`server/` and `client/`) in one step.

---

## Environment Setup

The server reads configuration from `server/.env`. A template is provided:

```bash
# Copy the template
cp .env.example server/.env
```

Then open `server/.env` and fill in every value:

```env
# Server
PORT=4000
NODE_ENV=development

# Frontend origin (must match where the client runs)
CLIENT_ORIGIN=http://localhost:5173

# PostgreSQL — replace with your local credentials
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/sweety?schema=public

# JWT — generate a random secret of at least 32 characters
# Example (Linux/macOS):  openssl rand -base64 32
# Example (Windows):      node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
JWT_SECRET=replace_with_a_random_secret_of_at_least_32_characters
JWT_EXPIRES_IN=7d

# Cookie
COOKIE_NAME=sweety_token
COOKIE_SECURE=false           # Set to true in production (HTTPS only)

# Timezone used for daily report calculations
APP_TIME_ZONE=Asia/Kolkata

# Redis
REDIS_URL=redis://localhost:6379

# Report cache duration in seconds
REPORT_CACHE_TTL_SECONDS=60
```

> [!IMPORTANT]
> `server/.env` is listed in `.gitignore` and is **never committed**. Never put real credentials in `.env.example`.

---

## Database Setup

### Step 1 — Start PostgreSQL

**Local PostgreSQL:** Make sure your PostgreSQL server is running and that the database referenced in `DATABASE_URL` exists:

```bash
# Create the database (run once)
psql -U postgres -c "CREATE DATABASE sweety;"
```

**Using Docker (just the database):**

```bash
docker run -d \
  --name sweety-postgres \
  -e POSTGRES_USER=sweety \
  -e POSTGRES_PASSWORD=sweety_local_password \
  -e POSTGRES_DB=sweety \
  -p 127.0.0.1:5432:5432 \
  postgres:16-alpine
```

Then set your `DATABASE_URL` in `server/.env`:

```env
DATABASE_URL=postgresql://sweety:sweety_local_password@localhost:5432/sweety?schema=public
```

---

### Step 2 — Run Migrations

Migrations create all tables (`users`, `readings`, `doctor_patients`) from the schema:

```bash
# From the project root
npm run db:migrate
```

This runs `prisma migrate dev` which:
1. Applies any pending SQL migrations from `server/prisma/migrations/`
2. Regenerates the Prisma client

> [!NOTE]
> Run `npm run db:migrate` every time you pull new changes that include database migrations.

---

### Step 3 — Generate the Prisma Client (if needed)

If you only need to regenerate the client without running migrations (e.g. after a fresh `npm install`):

```bash
npm run db:generate
```

---

### Optional — Inspect the Database with Prisma Studio

```bash
npm run db:studio
```

Opens a visual browser-based GUI at `http://localhost:5555` to browse and edit database records.

---

## Running the App

### Option A — Local Development (Recommended)

You need PostgreSQL and Redis running locally (or via Docker) before starting.

**Start Redis (if not already running):**

```bash
# macOS (Homebrew)
brew services start redis

# Linux
sudo systemctl start redis

# Docker
docker run -d --name sweety-redis -p 127.0.0.1:6379:6379 redis:7-alpine
```

**Start both server and client together:**

```bash
# From the project root — starts both concurrently
npm run dev
```

| Service | URL |
|---|---|
| **Frontend** (Vite) | http://localhost:5173 |
| **Backend API** (Express) | http://localhost:4000 |
| **Health check** | http://localhost:4000/api/health |

The frontend Vite dev server proxies all `/api/*` requests to `http://localhost:4000`, so you only need to open `http://localhost:5173`.

---

**Start them separately (in two terminals):**

```bash
# Terminal 1 — API server (hot-reloads via tsx watch)
npm run dev -w server

# Terminal 2 — React client (hot-reloads via Vite HMR)
npm run dev -w client
```

---

### Option B — Docker Compose (All-in-one)

Docker Compose starts **everything** — PostgreSQL, Redis, the API server, and the Nginx-served client — in containers. No local PostgreSQL or Redis needed.

**Step 1:** Create `server/.env` for the Docker run. At minimum you need a real `JWT_SECRET`:

```bash
cp .env.example server/.env
# Edit server/.env — set a real JWT_SECRET (32+ chars)
```

**Step 2:** Build and start all services:

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| **Frontend** (Nginx) | http://localhost:5173 |
| **Backend API** | http://localhost:4000 |

Migrations are applied automatically on API container start.

**Stop everything:**

```bash
docker compose down
```

**Stop and wipe all data volumes:**

```bash
docker compose down -v
```

---

## Creating a Doctor Account

Normal users who register through the UI always get the `PATIENT` role. Doctor accounts must be created via one of these scripts.

### Interactive script (recommended for development)

```bash
# From the project root
npx tsx server/prisma/create-doctor.ts
```

You will be prompted:

```
Doctor name:  Dr. Priya Sharma
Doctor email: dr.priya@hospital.com
Doctor password: ••••••••••••
```

The password must be **at least 8 characters**.

---

### Environment-based seeder (CI / scripted setup)

Add these extra variables to `server/.env`:

```env
DOCTOR_NAME=Dr. Priya Sharma
DOCTOR_EMAIL=dr.priya@hospital.com
DOCTOR_PASSWORD=StrongPassword123   # min 12 characters for seeder
```

Then run:

```bash
npm run db:seed
```

This upserts the doctor account (safe to run multiple times — won't duplicate).

---

## Running Tests

### Run all tests (server + client)

```bash
npm test
```

### Server tests only

```bash
npm test -w server
```

The server test suite (`server/tests/`) contains unit tests for:
- `date.test.ts` — date utility helpers
- `reading-validator.test.ts` — Zod input validation
- `report.test.ts` — report calculation logic

> [!NOTE]
> Server tests use a separate test database. The `tests/setup.ts` file sets `DATABASE_URL` to `sweety_test` automatically if no env override is present. Make sure PostgreSQL is running before running server tests.

### Client tests only

```bash
npm test -w client
```

The client test suite (`client/src/components/ReadingForm.test.tsx`) uses React Testing Library and contains 6 tests:
- Empty-value rejection
- Out-of-range value rejection (< 40, > 600, non-integer)
- Successful submission and form close
- API error display without closing

### Watch mode (during development)

```bash
# Server — re-runs on file save
npx vitest --watch -w server

# Client — re-runs on file save
npx vitest --watch -w client
```

---

## API Reference

All API endpoints are prefixed with `/api`. Authentication uses HTTP-only cookies (no bearer tokens needed in headers).

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Create a new patient account |
| `POST` | `/api/auth/login` | Public | Sign in, receive session cookie |
| `POST` | `/api/auth/logout` | Public | Clear session cookie |
| `GET` | `/api/auth/me` | Required | Return the current user |

**Register / Login body:**

```json
{
  "name": "Riya Patel",
  "email": "riya@example.com",
  "password": "mypassword123"
}
```

---

### Readings — `/api/readings` *(PATIENT only)*

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/readings` | List readings (supports `?page`, `?limit`, `?date`, `?timeSlot`) |
| `POST` | `/api/readings` | Create a new reading |
| `GET` | `/api/readings/today-summary` | Today's reading count and reminder status |
| `GET` | `/api/readings/:id` | Get one reading |
| `PUT` | `/api/readings/:id` | Update a reading |
| `DELETE` | `/api/readings/:id` | Delete a reading |

**Create / Update body:**

```json
{
  "date": "2026-11-19",
  "timeSlot": "MORNING_FASTING",
  "value": 112
}
```

Valid `timeSlot` values: `MORNING_FASTING`, `AFTER_BREAKFAST`, `AFTER_LUNCH`, `AFTER_DINNER`  
Valid `value` range: **40 – 600** mg/dL (integer)  
Limit: **4 readings per day** (one per time slot)

---

### Reports — `/api/reports` *(authenticated)*

| Method | Path | Query params | Description |
|---|---|---|---|
| `GET` | `/api/reports/daily` | `date=YYYY-MM-DD` | Stats + readings for one day |
| `GET` | `/api/reports/month-to-date` | `date=YYYY-MM-DD` | Stats from 1st of month to date |
| `GET` | `/api/reports/monthly` | `date=YYYY-MM-DD` | Stats for the full previous month |
| `GET` | `/api/reports/monthly-chart` | `date=YYYY-MM-DD` | Daily averages for chart rendering |

---

### Doctor — `/api/doctor` *(DOCTOR only)*

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/doctor/patients` | List assigned patients |
| `POST` | `/api/doctor/patients` | Assign a patient by email |
| `DELETE` | `/api/doctor/patients/:patientId` | Unassign a patient |
| `GET` | `/api/doctor/patients/:patientId/reports/daily` | Patient daily report |
| `GET` | `/api/doctor/patients/:patientId/reports/month-to-date` | Patient MTD report |
| `GET` | `/api/doctor/patients/:patientId/reports/monthly` | Patient monthly report |
| `GET` | `/api/doctor/patients/:patientId/reports/monthly-chart` | Patient chart data |

---

### Health Check

```bash
GET /api/health
# → { "success": true, "message": "Sweety API is healthy." }
```

---

## Available Scripts

All scripts can be run from the **project root**:

| Script | Description |
|---|---|
| `npm run dev` | Start server + client in development mode (concurrent) |
| `npm run build` | Build server (TypeScript → JS) + client (Vite bundle) |
| `npm test` | Run all tests (server + client) |
| `npm run db:migrate` | Apply pending migrations and regenerate Prisma client |
| `npm run db:generate` | Regenerate Prisma client only (no migration) |
| `npm run db:migrate:deploy` | Apply migrations in production (no prompt) |
| `npm run db:seed` | Create a doctor account from env variables |
| `npm run db:push` | Push schema changes directly (skips migration, dev only) |
| `npm run db:studio` | Open Prisma Studio at http://localhost:5555 |

Workspace-specific scripts:

```bash
npm run dev -w server       # API server only
npm run dev -w client       # Frontend only
npm run build -w server     # Compile server TypeScript
npm run build -w client     # Bundle React app
npm test -w server          # Server tests only
npm test -w client          # Client tests only
```

---

## Troubleshooting

### `Cannot connect to database`

- Confirm PostgreSQL is running: `pg_isready -U sweety`
- Check `DATABASE_URL` in `server/.env` matches your credentials exactly
- Make sure the database exists: `psql -U postgres -c "\l"`

### `Redis connection refused`

- Start Redis: `redis-cli ping` should return `PONG`
- The server will start without Redis but the daily reminder worker will be disabled
- Use Docker: `docker run -d -p 6379:6379 redis:7-alpine`

### `JWT_SECRET must contain at least 32 characters`

- Generate a secure secret:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- Paste the output as `JWT_SECRET` in `server/.env`

### `Port 5173 already in use`

- Another Vite server is already running. Find and stop it:
  ```bash
  # Windows
  netstat -ano | findstr :5173
  taskkill /PID <PID> /F
  ```

### Migrations fail with `migration already applied`

```bash
# Reset development database (destructive — wipes all data)
npx prisma migrate reset -w server
```

### TypeScript errors after `npm install`

```bash
# Regenerate the Prisma client
npm run db:generate
```

---

## License

MIT © Suvajit Sahoo











# Sweety – Blood Glucose Tracker

A full-stack blood glucose tracking application built with React, Node.js, Express, PostgreSQL, Prisma, Redis, and BullMQ.

Sweety allows patients to record daily blood glucose readings, view reports, and track their glucose history. Doctors can view reports for patients assigned to them.

## Features

- Patient registration and login
- Secure password hashing with bcrypt
- Role-based access control (Patient and Doctor)
- Record blood glucose readings (40–600 mg/dL)
- Four daily reading slots:
  - Morning Fasting
  - After Breakfast
  - After Lunch
  - After Dinner
- Maximum four readings per day
- Prevent duplicate readings for the same slot and date
- Daily, monthly, and previous-month reports
- Highest, lowest, average, and total reading statistics
- Reading history with pagination
- Doctor–patient assignment
- Redis-based report caching
- BullMQ daily reminder job
- Docker support
- Automated tests

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT, bcrypt |
| Cache | Redis |
| Background Jobs | BullMQ |
| Testing | Vitest |
| Containerization | Docker, Docker Compose |

## Prerequisites

Install the following before starting:

- Node.js (LTS recommended)
- npm
- Docker Desktop
- Git

Verify installation:

```powershell
node --version
npm --version
docker --version
docker compose version
```

## 1. Clone the Repository

```powershell
git clone YOUR_GITHUB_REPOSITORY_URL
cd sweety
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your public GitHub repository URL.

## 2. Install Dependencies

From the project root:

```powershell
npm install
```

## 3. Environment Configuration

Create your server environment file:

```powershell
Copy-Item server/.env.example server/.env
```

If `.env.example` does not exist yet, create `server/.env` manually.

Example configuration:

```env
PORT=4000
NODE_ENV=development

CLIENT_ORIGIN=http://localhost:5173

DATABASE_URL="postgresql://POSTGRES_USER:POSTGRES_PASSWORD@localhost:5432/POSTGRES_DB?schema=public"

JWT_SECRET="REPLACE_WITH_A_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS"
JWT_EXPIRES_IN=7d

COOKIE_NAME=sweety_token
COOKIE_SECURE=false

APP_TIME_ZONE=Asia/Kolkata

REDIS_URL=redis://localhost:6379

REPORT_CACHE_TTL_SECONDS=60

DEMO_USER_NAME="Sweety Demo Patient"
DEMO_USER_EMAIL=demo.patient@example.com
DEMO_USER_PASSWORD=CHANGE_THIS_PASSWORD

DOCTOR_NAME="Sweety Demo Doctor"
DOCTOR_EMAIL=demo.doctor@example.com
DOCTOR_PASSWORD=CHANGE_THIS_PASSWORD
```

Update the PostgreSQL username, password, and database name to match your Docker configuration.

**Security:** Never commit `server/.env` or real credentials to GitHub. Use strong passwords and a secure JWT secret.

## 4. Set Up PostgreSQL and Redis

Start Docker Desktop, then run:

```powershell
docker compose up -d
```

This starts the services configured in `docker-compose.yml`.

Check container status:

```powershell
docker compose ps
```

The PostgreSQL and Redis services should be healthy or running.

Expected local service ports:

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## 5. Set Up the Database

Generate the Prisma Client:

```powershell
npm run db:generate --workspace=server
```

Apply database migrations:

```powershell
npm run db:migrate --workspace=server
```

These commands generate the Prisma Client and create the database tables.

### Optional: Seed Demo Data

Configure the demo credentials in `server/.env`, then run:

```powershell
npm run db:seed --workspace=server
```

The seed script creates a demo Patient, sample glucose readings, and an optional Doctor assigned to that Patient.

The demo account credentials are taken from `server/.env`.

## 6. Run the Backend Server

From the project root:

```powershell
npm run dev --workspace=server
```

The backend API should be available at:

http://localhost:4000

## 7. Run the Frontend Client

Open another PowerShell terminal in the project root:

```powershell
npm run dev --workspace=client
```

The frontend should be available at:

http://localhost:5173

## 8. Run the Complete System

For local development, keep these services running:

1. PostgreSQL
2. Redis
3. Backend server
4. Frontend client

Start PostgreSQL and Redis:

```powershell
docker compose up -d
```

Start the backend in one terminal:

```powershell
npm run dev --workspace=server
```

Start the frontend in another terminal:

```powershell
npm run dev --workspace=client
```

Open the application:

http://localhost:5173

## 9. Run Tests

Run the test scripts configured in the project workspaces:

```powershell
npm test --workspace=server
```

```powershell
npm test --workspace=client
```

If the test script is named differently in either workspace, check its `package.json` under `scripts` and use the configured test command.

## 10. Build the Application

Build the backend:

```powershell
npm run build --workspace=server
```

Build the frontend:

```powershell
npm run build --workspace=client
```

A successful build confirms that the respective workspace compiles without build errors.

## 11. Stop the Application

Stop locally running frontend and backend processes using `Ctrl + C` in their terminals.

Stop Docker services:

```powershell
docker compose down
```

This stops and removes the containers but normally preserves named Docker volumes.

**Do not use `docker compose down -v` unless you intentionally want to delete the persistent database and Redis volumes.**

## Application URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:4000 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

## Project Structure

```text
sweety/
├── client/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── test/
│
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── seed.ts
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── services/
│       ├── jobs/
│       ├── middleware/
│       └── utils/
│
├── docker-compose.yml
├── package.json
└── README.md
```

## Important Notes

- Patients can register through the application.
- Patients can only access their own glucose readings.
- Doctors can access data for patients assigned to them.
- The application uses the configured `APP_TIME_ZONE` for date-based operations.
- BullMQ runs scheduled background reminder jobs using Redis.
- Demo seed data is optional and is intended for development and demonstration.
- This application is intended for tracking and reporting. It does not replace professional medical advice.

## License

Add your chosen open-source license here.