import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { authenticateUser, createAccessToken, registerUser } from '../services/auth.service.js';
import { AppError } from '../utils/app-error.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

function setSessionCookie(res: Response, token: string) {
  res.cookie(env.COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0]?.message ?? 'Please check the registration details.', parsed.error.issues);
  const user = await registerUser(parsed.data);
  setSessionCookie(res, createAccessToken(user));
  res.status(201).json({ success: true, message: 'Your account has been created.', data: { user } });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0]?.message ?? 'Please check your login details.', parsed.error.issues);
  const user = await authenticateUser(parsed.data);
  setSessionCookie(res, createAccessToken(user));
  res.status(200).json({ success: true, message: 'Welcome back.', data: { user } });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie(env.COOKIE_NAME, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
  });
  res.status(200).json({ success: true, message: 'You have been logged out.', data: null });
}

export async function me(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  if (!user) throw new AppError(401, 'Please log in to continue.');
  res.status(200).json({ success: true, data: { user } });
}
