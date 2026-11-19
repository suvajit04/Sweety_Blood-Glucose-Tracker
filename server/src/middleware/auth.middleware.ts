import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; name: string; role: 'PATIENT' | 'DOCTOR' };
}

export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const cookieToken = req.cookies?.[env.COOKIE_NAME] as string | undefined;
  const authHeader = req.header('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const token = cookieToken || bearerToken;

  if (!token) return next(new AppError(401, 'Please log in to continue.'));

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string' || typeof payload.name !== 'string') {
      return next(new AppError(401, 'Your session is invalid. Please log in again.'));
    }
    req.user = { id: payload.sub, email: payload.email, name: payload.name, role: payload.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT' };
    next();
  } catch {
    next(new AppError(401, 'Your session has expired. Please log in again.'));
  }
}


export function requireRole(role: 'PATIENT' | 'DOCTOR') {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new AppError(401, 'Please log in to continue.'));
    if (req.user.role !== role) return next(new AppError(403, 'You do not have permission to access this resource.'));
    next();
  };
}
