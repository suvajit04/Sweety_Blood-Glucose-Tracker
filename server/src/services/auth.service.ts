import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR';
}

function publicUser(user: { id: string; name: string; email: string; role: 'PATIENT' | 'DOCTOR' }): PublicUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export function createAccessToken(user: PublicUser): string {
  return jwt.sign({ email: user.email, name: user.name, role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export async function registerUser(input: { name: string; email: string; password: string }) {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(409, 'An account with this email already exists.');

  const passwordHash = await bcrypt.hash(input.password, 12);
  try {
    const user = await prisma.user.create({
      data: { name: input.name, email, passwordHash },
      select: { id: true, name: true, email: true, role: true },
    });
    return publicUser(user);
  } catch (error) {
    // Covers a registration race where two requests use the same email.
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      throw new AppError(409, 'An account with this email already exists.');
    }
    throw error;
  }
}

export async function authenticateUser(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new AppError(401, 'Email or password is incorrect.');
  }
  return publicUser(user);
}
