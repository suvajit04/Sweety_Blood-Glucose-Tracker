import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { createInterface } from 'node:readline/promises';

const prisma = new PrismaClient();

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  const name = (await rl.question('Doctor name: ')).trim();
  const email = (await rl.question('Doctor email: ')).trim().toLowerCase();
  const password = await rl.question('Doctor password: ');

  if (!name || !email || password.length < 8) {
    throw new Error('Name/email required. Password must be at least 8 characters.');
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    throw new Error('This email already exists. No account was changed.');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const doctor = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: 'DOCTOR',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  console.log('\nDoctor account created successfully:');
  console.log(doctor);
}

main()
  .catch((error) => {
    console.error('\nDoctor creation failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
