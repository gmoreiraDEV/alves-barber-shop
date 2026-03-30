import { NextResponse } from "next/server";
import {
  AppointmentAvailabilityError,
  appointmentTransactionOptions,
  assertAppointmentAvailability,
  lockBarberSchedule,
} from "@/lib/appointment-availability";
import { prisma } from "@/lib/prisma";
import { createAppointmentPublicCode } from "@/lib/public-appointments";
import type { AppointmentBookingItem } from "@/types";

function normalizeBookingItems(body: unknown): AppointmentBookingItem[] {
  if (!body || typeof body !== "object") {
    return [];
  }

  const payload = body as {
    clientName?: unknown;
    serviceId?: unknown;
    items?: unknown;
  };

  if (Array.isArray(payload.items)) {
    const normalizedItems = payload.items.map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const entry = item as {
        clientName?: unknown;
        serviceId?: unknown;
      };

      const clientName =
        typeof entry.clientName === "string" ? entry.clientName.trim() : "";
      const serviceId =
        typeof entry.serviceId === "string" ? entry.serviceId.trim() : "";

      if (!clientName || !serviceId) {
        return null;
      }

      return { clientName, serviceId };
    });

    if (normalizedItems.length === 0 || normalizedItems.includes(null)) {
      return [];
    }

    return normalizedItems.filter(
      (item): item is AppointmentBookingItem => item !== null,
    );
  }

  const clientName =
    typeof payload.clientName === "string" ? payload.clientName.trim() : "";
  const serviceId =
    typeof payload.serviceId === "string" ? payload.serviceId.trim() : "";

  if (!clientName || !serviceId) {
    return [];
  }

  return [{ clientName, serviceId }];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const minimal = searchParams.get("minimal") === "true";

  if (minimal) {
    const appointments = await prisma.appointment.findMany({
      where: {
        isActive: true,
        date: {
          gte: new Date(),
        },
      },
      orderBy: { date: "asc" },
      select: {
        id: true,
        date: true,
        serviceId: true,
        barberId: true,
      },
    });

    return NextResponse.json(
      appointments.map((appointment) => ({
        id: appointment.id,
        clientName: "",
        phone: "",
        date: appointment.date.toISOString(),
        serviceId: appointment.serviceId,
        barberId: appointment.barberId,
        isActive: true,
        deletedAt: null,
      })),
    );
  }

  const appointments = await prisma.appointment.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(appointments);
}

export async function POST(request: Request) {
  const body = await request.json();
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const date = typeof body.date === "string" ? body.date : "";
  const barberId =
    typeof body.barberId === "string" ? body.barberId.trim() : "";
  const items = normalizeBookingItems(body);

  if (!phone || !date || !barberId || items.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const appointmentDate = new Date(date);
  if (Number.isNaN(appointmentDate.getTime())) {
    return NextResponse.json({ error: "Data inválida" }, { status: 400 });
  }

  try {
    const createdAppointments = await prisma.$transaction(async (tx) => {
      await lockBarberSchedule(tx, barberId);

      const uniqueServiceIds = Array.from(
        new Set(items.map((item) => item.serviceId)),
      );
      const services = await tx.service.findMany({
        where: { id: { in: uniqueServiceIds } },
      });
      const servicesById = new Map(
        services.map((service) => [service.id, service]),
      );

      for (const item of items) {
        const service = servicesById.get(item.serviceId);
        if (!service || !service.isActive) {
          throw new Error("Serviço indisponível");
        }
      }

      const barber = await tx.barber.findUnique({
        where: { id: barberId },
        include: {
          serviceLinks: {
            select: { serviceId: true },
          },
        },
      });
      if (!barber) {
        throw new Error("Barbeiro indisponível");
      }

      const canPerformAllServices = items.every((item) =>
        barber.serviceLinks.some(
          (serviceLink) => serviceLink.serviceId === item.serviceId,
        ),
      );
      if (!canPerformAllServices) {
        throw new Error("Barbeiro não atende esse serviço");
      }

      const createdEntries = [];
      let offsetMinutes = 0;

      for (const item of items) {
        const service = servicesById.get(item.serviceId);
        if (!service) {
          throw new Error("Serviço indisponível");
        }

        const nextDate = new Date(appointmentDate);
        nextDate.setMinutes(nextDate.getMinutes() + offsetMinutes);

        await assertAppointmentAvailability(tx, {
          barberId,
          startAt: nextDate,
          serviceDuration: service.duration,
        });

        const appointment = await tx.appointment.create({
          data: {
            publicCode: await createAppointmentPublicCode(),
            clientName: item.clientName,
            phone,
            date: nextDate,
            serviceId: item.serviceId,
            barberId,
            isActive: true,
          },
        });

        createdEntries.push({
          id: appointment.id,
          clientName: appointment.clientName,
          date: appointment.date.toISOString(),
          serviceId: appointment.serviceId,
        });

        offsetMinutes += service.duration;
      }

      return createdEntries;
    }, appointmentTransactionOptions);

    return NextResponse.json(
      { appointments: createdAppointments },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AppointmentAvailabilityError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof Error) {
      if (
        error.message === "Serviço indisponível" ||
        error.message === "Barbeiro indisponível" ||
        error.message === "Barbeiro não atende esse serviço"
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Não foi possível concluir o agendamento." },
      { status: 500 },
    );
  }
}
