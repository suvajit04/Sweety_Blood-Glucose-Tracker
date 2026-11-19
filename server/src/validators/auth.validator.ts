import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(100, 'Name must be 100 characters or fewer.'),
  email: z.string().trim().email('Please enter a valid email address.').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters long.').max(72, 'Password must be 72 characters or fewer.'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Please enter your password.'),
});
