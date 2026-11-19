import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';

export async function listAssignedPatients(doctorId: string) {
  const assignments = await prisma.doctorPatient.findMany({
    where: { doctorId },
    include: { patient: { select: { id: true, name: true, email: true, createdAt: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return assignments.map((assignment) => ({ ...assignment.patient, assignedAt: assignment.createdAt }));
}

export async function assignPatientByEmail(doctorId: string, emailInput: string) {
  const email = emailInput.trim().toLowerCase();
  const patient = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true, role: true } });
  if (!patient) throw new AppError(404, 'No account was found with that email address.');
  if (patient.role !== 'PATIENT') throw new AppError(400, 'Only patient accounts can be assigned.');
  const existing = await prisma.doctorPatient.findUnique({ where: { doctorId_patientId: { doctorId, patientId: patient.id } } });
  if (existing) throw new AppError(409, 'This patient is already assigned to you.');
  const assignment = await prisma.doctorPatient.create({
    data: { doctorId, patientId: patient.id },
    include: { patient: { select: { id: true, name: true, email: true, createdAt: true } } },
  });
  return { ...assignment.patient, assignedAt: assignment.createdAt };
}

export async function unassignPatient(doctorId: string, patientId: string) {
  const result = await prisma.doctorPatient.deleteMany({ where: { doctorId, patientId } });
  if (!result.count) throw new AppError(404, 'Assigned patient not found.');
}

export async function assertAssignedPatient(doctorId: string, patientId: string): Promise<void> {
  const assignment = await prisma.doctorPatient.findUnique({
    where: { doctorId_patientId: { doctorId, patientId } },
    select: { id: true },
  });
  if (!assignment) throw new AppError(404, 'Patient not found in your assigned list.');
}
