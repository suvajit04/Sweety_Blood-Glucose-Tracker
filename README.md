# Sweety – Blood Glucose Tracker

A full-stack blood glucose tracking application built with React, Node.js, Express, PostgreSQL, Prisma, Redis, and BullMQ.

Sweety allows patients to record daily blood glucose readings, view reports, and track their glucose history. Doctors can view reports for patients assigned to them.

## Demo Video

[![Watch the Sweety demo](https://jam.dev/v/d29aee1c-0ac0-4f92-b8f0-b71c8d4d03df)](https://jam.dev/v/d29aee1c-0ac0-4f92-b8f0-b71c8d4d03df)

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
git clone https://github.com/suvajit04/Sweety_Blood-Glucose-Tracker.git
cd sweety
```

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

## Future Improvements

With more development time, I would improve the application by:

 - Adding email and SMS notifications for missed readings.

 - proving dashboard charts and glucose trend visualizations.

 - Adding downloadable PDF and CSV reports.

 - Implementing stronger authentication with refresh-token rotation and account recovery.

 - Adding more comprehensive unit, integration, and end-to-end tests.

 - Improving mobile responsiveness and accessibility.

 - Adding production monitoring, structured logging, and automated backups.

 - Deploying the application using a production-ready cloud infrastructure.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
