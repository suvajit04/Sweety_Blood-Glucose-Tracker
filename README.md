# Sweety — Blood Glucose Tracker

Sweety is a responsive blood glucose journal for patients. Patients can securely record up to four readings per day, manage their entries, and review daily/monthly statistics. A doctor workspace is included as an optional bonus: doctor accounts can see reports only for patients explicitly assigned to them.

> Sweety is a record-keeping tool, not a diagnostic system. It does not classify readings or provide treatment advice.

## Technology

- **Frontend:** React 18, Vite, TypeScript, React Router, Axios, Recharts, Lucide React
- **Frontend tests:** Vitest, jsdom, React Testing Library, jest-dom
- **Backend:** Node.js 20+, Express, TypeScript, Zod, bcryptjs, JWT, Helmet, cookie-parser, express-rate-limit
- **Database:** PostgreSQL 16, Prisma ORM
- **Cache and background jobs:** Redis 7, ioredis, BullMQ
- **Containers:** Docker Compose, Nginx

## Features

### Required assignment features

- Patient registration and login; passwords are hashed with bcrypt.
- JWT session stored in an HttpOnly cookie.
- Protected API routes and per-user reading ownership checks.
- Create, list, view, update, and delete readings.
- Four time slots: morning fasting, after breakfast, after lunch, and after dinner.
- Server-side validation: integer values from 40–600 mg/dL, date not in the future, one reading per slot/day, maximum four readings/day.
- PostgreSQL unique constraint on `(user_id, date, time_slot)`.
- A transaction locks the user's row while enforcing the daily cap, preventing simultaneous inserts from creating a fifth reading.
- Daily, month-to-date, and full previous-calendar-month reports.
- Empty states, form errors, responsive layout, and loading states.

### Bonus features

1. **Pagination:** `GET /api/readings?page=1&limit=20`.
2. **Monthly chart:** Recharts line chart of per-day average values, with the exact daily readings grouped into points by date.
3. **Full Docker Compose:** PostgreSQL, Redis, Express API, and Nginx-served React frontend.
4. **Frontend tests:** React Testing Library checks for missing/invalid values, successful submission, and API validation errors.
5. **Redis report caching:** Report responses are cached for a configurable TTL. All report-cache keys for the affected user are invalidated after a reading is created, edited, or deleted. Redis failure is fail-open: reports still load from PostgreSQL.
6. **BullMQ daily reminder log:** A daily 19:00 job in `APP_TIME_ZONE` finds patient accounts with fewer than four readings for that day and logs reminder candidates. It does not send emails/SMS or medical recommendations.
7. **Doctor role:** Doctor accounts are provisioned through a seed command, not public registration. A doctor can assign a registered patient by email and view that patient's reports only while the assignment exists. Patient CRUD endpoints remain unavailable to doctors.

## Requirements

- Node.js 22.12 or newer
- npm 10 or newer
- Docker Desktop with Docker Compose

## Quick start — run everything with Docker

1. Extract the project and open PowerShell in the `sweety` folder.
2. Create the backend environment file:

```powershell
Copy-Item server/.env.example server/.env
```

3. Edit `server/.env`. Replace `JWT_SECRET` with a random secret of at least 32 characters. Change `DOCTOR_PASSWORD` to a strong password (at least 12 characters). The other local defaults match `docker-compose.yml`.
4. Build and start the full application:

```powershell
docker compose up --build -d
```

The API container waits for healthy PostgreSQL and Redis services, applies the Prisma migrations, and starts Express. Nginx serves the React app and proxies `/api` requests to Express.

- Web app: http://localhost:5173
- API health: http://localhost:4000/api/health
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

View logs:

```powershell
docker compose logs -f api
```

Stop services (data volumes are retained):

```powershell
docker compose down
```

Stop services and delete local database/cache data:

```powershell
docker compose down -v
```

**Warning:** `docker compose down -v` permanently deletes the local PostgreSQL and Redis volumes.

## Local development — run Vite and Express outside Docker

Start only PostgreSQL and Redis:

```powershell
docker compose up -d postgres redis
```

Install dependencies and configure the server:

```powershell
npm install
Copy-Item server/.env.example server/.env
```

In `server/.env`, use these local service addresses:

```env
DATABASE_URL="postgresql://sweety:sweety_local_password@localhost:5432/sweety?schema=public"
REDIS_URL="redis://localhost:6379"
CLIENT_ORIGIN="http://localhost:5173"
```

Generate Prisma Client and apply schema migrations:

```powershell
npm run db:generate
npm run db:migrate
```

Start frontend and backend:

```powershell
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:4000

### Existing local database from an earlier Sweety ZIP

The earlier ZIP did not include a committed migration history. If you already created the original `users` and `readings` tables and want Prisma to add the doctor-role schema without deleting readings, first back up the database, then run:

```powershell
npm run db:push
npm run db:generate
```

This synchronizes the current Prisma schema with the existing database. Do not run `docker compose down -v` or drop the database if you need to keep your data.

## Database browser

Run Prisma Studio from the project root:

```powershell
npm run db:studio
```

Open http://localhost:5555. The primary tables are:

- `users` — patient and doctor accounts; password hashes are never returned by the API.
- `readings` — date-only glucose values and time slots, linked to one user.
- `doctor_patients` — doctor/patient assignment records.

## Create a doctor account

Doctor access is not exposed through public registration. First set these values in `server/.env`:

```env
DOCTOR_NAME="Sweety Doctor"
DOCTOR_EMAIL="doctor@example.com"
DOCTOR_PASSWORD="Use-A-Strong-Unique-Password-123!"
```

With the database running and Prisma schema applied, run from the project root:

```powershell
npm run db:seed
```

When running the full Docker stack, you can seed from inside the API container instead:

```powershell
docker compose exec api npm run db:seed -w server
```

Log in through the normal login page using the doctor email and password. Create a patient account through the registration page, then from the doctor's **My patients** screen assign that patient using their registered email. The doctor can now open that patient's reports. Removing the assignment immediately blocks future report requests.

The seed command creates/updates a doctor role. Do not use it with a shared production database unless you intend to grant doctor access to that account.

## Environment variables

| Variable | Purpose | Local default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://sweety:sweety_local_password@localhost:5432/sweety?schema=public` |
| `PORT` | Express port | `4000` |
| `NODE_ENV` | Runtime mode | `development` |
| `CLIENT_ORIGIN` | Allowed browser origin | `http://localhost:5173` |
| `JWT_SECRET` | JWT signing secret, at least 32 characters | Must be changed |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `COOKIE_NAME` | Session cookie name | `sweety_token` |
| `COOKIE_SECURE` | Secure cookie flag; enable behind HTTPS | `false` locally |
| `APP_TIME_ZONE` | Date-only rules and reminder schedule timezone | `Asia/Kolkata` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379` |
| `REPORT_CACHE_TTL_SECONDS` | Report cache TTL | `60` |
| `DOCTOR_NAME` | Seed doctor display name | `Sweety Doctor` |
| `DOCTOR_EMAIL` | Seed doctor email | `doctor@example.com` |
| `DOCTOR_PASSWORD` | Seed doctor password (12+ chars) | Must be changed |

## API overview

All successful responses use `{ success: true, data: ... }`. Errors use `{ success: false, message: ..., errors: ... }`.

### Authentication

- `POST /api/auth/register` — `{ name, email, password }` (creates a PATIENT account)
- `POST /api/auth/login` — `{ email, password }`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Readings (patient authentication required)

- `POST /api/readings` — `{ date: "YYYY-MM-DD", timeSlot, value }`
- `GET /api/readings?page=1&limit=20`
- `GET /api/readings/:id`
- `PUT /api/readings/:id` — `{ date, timeSlot, value }`
- `DELETE /api/readings/:id`

Optional list filters: `date=YYYY-MM-DD` and `timeSlot=MORNING_FASTING|AFTER_BREAKFAST|AFTER_LUNCH|AFTER_DINNER`.

### Patient reports

- `GET /api/reports/daily?date=YYYY-MM-DD`
- `GET /api/reports/month-to-date?date=YYYY-MM-DD`
- `GET /api/reports/monthly?date=YYYY-MM-DD` — full previous month
- `GET /api/reports/monthly-chart?date=YYYY-MM-DD` — per-day averages for the selected month

### Doctor workspace (doctor authentication required)

- `GET /api/doctor/patients` — assigned patients
- `POST /api/doctor/patients` — assign patient by `{ "email": "patient@example.com" }`
- `DELETE /api/doctor/patients/:patientId` — remove assignment
- `GET /api/doctor/patients/:patientId/reports/daily?date=YYYY-MM-DD`
- `GET /api/doctor/patients/:patientId/reports/month-to-date?date=YYYY-MM-DD`
- `GET /api/doctor/patients/:patientId/reports/monthly?date=YYYY-MM-DD`
- `GET /api/doctor/patients/:patientId/reports/monthly-chart?date=YYYY-MM-DD`

The server checks the doctor/patient assignment for every doctor report request; knowing a patient UUID alone does not grant access.

## Useful commands

```powershell
npm run dev
npm run build
npm test
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:seed
npm run db:studio
docker compose up --build -d
docker compose logs -f api
```

## Testing

Run backend and frontend suites:

```powershell
npm test
```

Frontend form tests cover blank values, out-of-range values, decimals, successful submission, and a backend validation error. Backend Vitest tests cover date handling, validation, and report summarization.

Build the complete application:

```powershell
npm run build
```

## Assumptions and design decisions

1. A reading's date is a calendar date, not a timestamp. PostgreSQL `DATE` prevents browser timezone conversion from shifting a reading to a different day.
2. Future-date validation uses `APP_TIME_ZONE`, defaulting to `Asia/Kolkata`.
3. Registration creates a PATIENT account. Doctor role is assigned only through the explicit seed operation.
4. A doctor can review reports only after assigning an existing PATIENT account. All report endpoints verify that assignment before querying the patient's records.
5. The previous-month report is based on the selected/reference date. For example, reference date `2026-10-15` returns `2026-09-01` through `2026-09-30`.
6. Empty periods return `highest`, `lowest`, and `average` as `null`, with `count: 0`.
7. Redis is an optimization, not a source of truth. When Redis is unavailable, the API calculates reports directly from PostgreSQL.
8. The daily BullMQ task logs users who have fewer than four readings at 19:00 in the configured timezone. No third-party messaging service is configured.
9. Chart points are daily averages for dates with at least one reading; dates with no readings are omitted rather than plotted as zero.
10. The UI displays stored values and trends without classifying them as medically safe/unsafe.

## Production notes

- Use HTTPS and set `COOKIE_SECURE=true`.
- Use strong secrets from a secret manager; do not commit `server/.env`.
- Configure exact allowed origins and add CSRF protection for cookie-authenticated write endpoints before public deployment.
- Use a managed PostgreSQL database with backups, and authenticated/private Redis for cache and jobs.
- Configure Redis persistence and monitor BullMQ failed jobs.
- Treat doctor-patient assignment as sensitive access control; add a formal patient-consent workflow and audit logging before real clinical use.
- Do not use this sample application to make diagnosis or treatment decisions.
