import { randomBytes } from "node:crypto";
import { getPhoneLookupVariants, maskPhone, phonesMatch } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import type {
  PublicAppointmentDetails,
  PublicAppointmentStatus,
} from "@/types";

const PUBLIC_CODE_BYTES = 6;

const publicAppointmentInclude = {
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
} as const;

type PublicAppointmentRecord = {
  id: string;
  clientName: string;
  phone: string;
  date: Date;
  isActive: boolean;
  deletedAt: Date | null;
  service: {
    name: string;
    price: number;
    duration: number;
  };
  barber: {
    name: string;
  };
};

function getAppointmentStatus(
  appointment: Pick<PublicAppointmentRecord, "date" | "deletedAt" | "isActive">,
): PublicAppointmentStatus {
  const now = new Date();
  const isCanceled = !appointment.isActive || appointment.deletedAt !== null;
  const isCompleted = appointment.date < now && !isCanceled;

  if (isCanceled) {
    return "canceled";
  }

  if (isCompleted) {
    return "completed";
  }

  return "scheduled";
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

export async function findAppointmentsByPublicPhone(phone: string) {
  if (getPhoneLookupVariants(phone).length === 0) {
    return [];
  }

  const appointments = await prisma.appointment.findMany({
    include: publicAppointmentInclude,
    orderBy: [{ date: "asc" }, { createdAt: "desc" }],
  });

  return appointments.filter((appointment) =>
    phonesMatch(appointment.phone, phone),
  );
}

export async function findAppointmentByPublicPhoneAndId(
  phone: string,
  appointmentId: string,
) {
  if (!appointmentId.trim() || getPhoneLookupVariants(phone).length === 0) {
    return null;
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: publicAppointmentInclude,
  });

  if (!appointment || !phonesMatch(appointment.phone, phone)) {
    return null;
  }

  return appointment;
}

export function serializePublicAppointment(
  appointment: PublicAppointmentRecord,
): PublicAppointmentDetails {
  const status = getAppointmentStatus(appointment);

  return {
    id: appointment.id,
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

export function serializePublicAppointments(
  appointments: PublicAppointmentRecord[],
) {
  return appointments.map(serializePublicAppointment).sort((left, right) => {
    const getStatusRank = (status: PublicAppointmentStatus) => {
      if (status === "scheduled") {
        return 0;
      }

      if (status === "canceled") {
        return 1;
      }

      return 2;
    };

    const rankDifference =
      getStatusRank(left.status) - getStatusRank(right.status);

    if (rankDifference !== 0) {
      return rankDifference;
    }

    const leftTime = +new Date(left.date);
    const rightTime = +new Date(right.date);

    if (left.status === "scheduled") {
      return leftTime - rightTime;
    }

    return rightTime - leftTime;
  });
}
