import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, TimeSlot } from '@prisma/client';
import { parseDateOnly, todayInAppTimeZone } from '../src/utils/date.js';

declare const process: {
  env: Record<string, string | undefined>;
};

const prisma = new PrismaClient();

async function getOrCreateUser(
  name: string,
  email: string,
  password: string,
  role: 'PATIENT' | 'DOCTOR',
) {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role !== role) {
      throw new Error(`${email} already belongs to a ${existing.role} account.`);
    }

    // Do not reset an existing account's password when running the seed again.
    return existing;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  return prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
    },
  });
}

async function main() {
  const patientName = process.env.DEMO_USER_NAME?.trim() || 'Sweety Demo Patient';
  const patientEmail = process.env.DEMO_USER_EMAIL?.trim().toLowerCase();
  const patientPassword = process.env.DEMO_USER_PASSWORD;

  if (!patientEmail || !patientPassword || patientPassword.length < 8) {
    throw new Error(
      'Set DEMO_USER_EMAIL and DEMO_USER_PASSWORD (at least 8 characters) in server/.env.',
    );
  }

  const patient = await getOrCreateUser(
    patientName,
    patientEmail,
    patientPassword,
    'PATIENT',
  );

  // Add three readings per day for the last seven days.
  // Today's fourth slot remains empty so the in-app reminder can be demonstrated.
  const today = parseDateOnly(todayInAppTimeZone());
  const sampleSlots = [
    { timeSlot: TimeSlot.MORNING_FASTING, value: 105 },
    { timeSlot: TimeSlot.AFTER_BREAKFAST, value: 140 },
    { timeSlot: TimeSlot.AFTER_LUNCH, value: 128 },
  ];

  let seededReadings = 0;

  for (let daysAgo = 6; daysAgo >= 0; daysAgo -= 1) {
    const date = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const dayVariation = 6 - daysAgo;

    for (const reading of sampleSlots) {
      await prisma.reading.upsert({
        where: {
          user_date_slot_unique: {
            userId: patient.id,
            date,
            timeSlot: reading.timeSlot,
          },
        },
        update: {},
        create: {
          userId: patient.id,
          date,
          timeSlot: reading.timeSlot,
          value: reading.value + dayVariation,
        },
      });

      seededReadings += 1;
    }
  }

  console.info('Demo patient ready:', patient.email);
  console.info('Sample reading records checked:', seededReadings);

  // Optional: create a demo Doctor and assign the demo Patient.
  const doctorEmail = process.env.DOCTOR_EMAIL?.trim().toLowerCase();
  const doctorPassword = process.env.DOCTOR_PASSWORD;
  const doctorName = process.env.DOCTOR_NAME?.trim() || 'Sweety Demo Doctor';

  if (Boolean(doctorEmail) !== Boolean(doctorPassword)) {
    throw new Error('Set both DOCTOR_EMAIL and DOCTOR_PASSWORD, or leave both empty.');
  }

  if (doctorEmail && doctorPassword) {
    if (doctorPassword.length < 8) {
      throw new Error('DOCTOR_PASSWORD must contain at least 8 characters.');
    }

    const doctor = await getOrCreateUser(
      doctorName,
      doctorEmail,
      doctorPassword,
      'DOCTOR',
    );

    await prisma.doctorPatient.upsert({
      where: {
        doctorId_patientId: {
          doctorId: doctor.id,
          patientId: patient.id,
        },
      },
      update: {},
      create: {
        doctorId: doctor.id,
        patientId: patient.id,
      },
    });

    console.info('Demo doctor ready and assigned to the demo patient:', doctor.email);
  }

  console.info('Seed completed successfully.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
