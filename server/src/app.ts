import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.routes.js';
import { readingRouter } from './routes/reading.routes.js';
import { reportRouter } from './routes/report.routes.js';
import { doctorRouter } from './routes/doctor.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Sweety API is healthy.' });
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.', errors: [] },
});
app.use('/api/auth', authLimiter);
app.use('/api/auth', authRouter);
app.use('/api/readings', readingRouter);
app.use('/api/reports', reportRouter);
app.use('/api/doctor', doctorRouter);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.', errors: [] });
});

app.use(errorHandler);
