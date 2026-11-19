import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const name = process.env.DOCTOR_NAME ?? 'Sweety Doctor';
  const email = process.env.DOCTOR_EMAIL?.toLowerCase();
  const password = process.env.DOCTOR_PASSWORD;
  if (!email || !password || password.length < 12) {
    throw new Error('Set DOCTOR_EMAIL and DOCTOR_PASSWORD (at least 12 characters) in server/.env before seeding.');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const doctor = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: 'DOCTOR' },
    create: { name, email, passwordHash, role: 'DOCTOR' },
    select: { id: true, name: true, email: true, role: true },
  });
  console.info('Doctor account ready:', doctor.email, doctor.role);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
