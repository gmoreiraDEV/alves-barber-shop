import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { PublicAppointmentDetails } from "@/types";

const PUBLIC_CODE_BYTES = 6;

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function normalizePublicCode(code: string) {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function maskPhone(phone: string) {
  const digits = normalizePhone(phone);

  if (digits.length < 4) {
    return phone;
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) *****-${digits.slice(-4)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ****-${digits.slice(-4)}`;
  }

  return `Final ${digits.slice(-4)}`;
}

export async function createAppointmentPublicCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const publicCode = randomBytes(PUBLIC_CODE_BYTES)
      .toString("hex")
      .toUpperCase();

    const existingAppointment = await prisma.appointment.findUnique({
      where: { publicCode },
      select: { id: true },
    });

    if (!existingAppointment) {
      return publicCode;
    }
  }

  throw new Error("Unable to generate appointment public code");
}

export async function findAppointmentByPublicAccess(
  phone: string,
  publicCode: string,
) {
  const normalizedPhone = normalizePhone(phone);
  const normalizedCode = normalizePublicCode(publicCode);

  if (!normalizedPhone || !normalizedCode) {
    return null;
  }

  const appointment = await prisma.appointment.findUnique({
    where: { publicCode: normalizedCode },
    include: {
      service: {
        select: {
          name: true,
          price: true,
          duration: true,
        },
      },
      barber: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!appointment) {
    return null;
  }

  if (normalizePhone(appointment.phone) !== normalizedPhone) {
    return null;
  }

  return appointment;
}

export function serializePublicAppointment(
  appointment: NonNullable<
    Awaited<ReturnType<typeof findAppointmentByPublicAccess>>
  >,
): PublicAppointmentDetails {
  const now = new Date();
  const isCanceled = !appointment.isActive || appointment.deletedAt !== null;
  const isCompleted = appointment.date < now && !isCanceled;
  const status = isCanceled
    ? "canceled"
    : isCompleted
      ? "completed"
      : "scheduled";

  return {
    id: appointment.id,
    publicCode: appointment.publicCode,
    clientName: appointment.clientName,
    phoneMasked: maskPhone(appointment.phone),
    date: appointment.date.toISOString(),
    status,
    canceledAt: appointment.deletedAt?.toISOString() ?? null,
    canCancel: status === "scheduled",
    serviceName: appointment.service.name,
    servicePrice: appointment.service.price,
    serviceDuration: appointment.service.duration,
    barberName: appointment.barber.name,
  };
}
