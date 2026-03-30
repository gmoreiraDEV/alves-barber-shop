import type { Prisma as PrismaNamespace } from "@/generated/prisma";
import { Prisma } from "@/generated/prisma";
import {
  getBusinessDayOfWeek,
  getBusinessDayRange,
  getBusinessMinutes,
} from "@/lib/business-time";
import {
  createDefaultWorkingHours,
  isRangeWithinWorkingHours,
  normalizeWorkingHours,
} from "@/lib/working-hours";

export class AppointmentAvailabilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppointmentAvailabilityError";
  }
}

type AvailabilityCheckInput = {
  barberId: string;
  startAt: Date;
  serviceDuration: number;
  excludeAppointmentId?: string;
};

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

async function loadWorkingHours(tx: PrismaNamespace.TransactionClient) {
  try {
    const workingHours = await tx.workingHours.findMany({
      orderBy: { dayOfWeek: "asc" },
    });

    return normalizeWorkingHours(workingHours);
  } catch (_error) {
    return createDefaultWorkingHours();
  }
}

export async function lockBarberSchedule(
  tx: PrismaNamespace.TransactionClient,
  barberId: string,
) {
  const [result] = await tx.$queryRaw<{ acquired: boolean }[]>`
    SELECT EXISTS (
      SELECT pg_advisory_xact_lock(hashtext(${barberId})::bigint)
    ) AS "acquired"
  `;

  if (!result?.acquired) {
    throw new AppointmentAvailabilityError(
      "Não foi possível bloquear a agenda do barbeiro.",
    );
  }
}

export async function assertAppointmentAvailability(
  tx: PrismaNamespace.TransactionClient,
  input: AvailabilityCheckInput,
) {
  const { barberId, startAt, serviceDuration, excludeAppointmentId } = input;
  const endAt = new Date(startAt);
  endAt.setMinutes(endAt.getMinutes() + serviceDuration);

  const startMinutes = getBusinessMinutes(startAt);
  const endMinutes = startMinutes + serviceDuration;
  const workingHours = await loadWorkingHours(tx);
  const workingDay = workingHours.find(
    (day) => day.dayOfWeek === getBusinessDayOfWeek(startAt),
  );
  const businessDayRange = getBusinessDayRange(startAt);

  if (!isRangeWithinWorkingHours(workingDay, startMinutes, endMinutes)) {
    throw new AppointmentAvailabilityError(
      "O horário está fora do período de atendimento.",
    );
  }

  const absenceCount = await tx.barberAbsence.count({
    where: {
      barberId,
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });

  if (absenceCount > 0) {
    throw new AppointmentAvailabilityError(
      "O barbeiro está indisponível nesse horário.",
    );
  }

  const appointments = await tx.appointment.findMany({
    where: {
      barberId,
      isActive: true,
      ...(excludeAppointmentId
        ? {
            id: {
              not: excludeAppointmentId,
            },
          }
        : {}),
      date: {
        gte: businessDayRange.start,
        lte: businessDayRange.end,
      },
    },
    include: {
      service: {
        select: {
          duration: true,
        },
      },
    },
  });

  for (const appointment of appointments) {
    const appointmentStart = new Date(appointment.date);
    const appointmentEnd = new Date(appointmentStart);
    appointmentEnd.setMinutes(
      appointmentEnd.getMinutes() + appointment.service.duration,
    );

    if (overlaps(startAt, endAt, appointmentStart, appointmentEnd)) {
      throw new AppointmentAvailabilityError(
        "Já existe outro agendamento nesse horário.",
      );
    }
  }
}

export const appointmentTransactionOptions = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
};
