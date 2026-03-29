import { NextResponse } from "next/server";
import {
  AppointmentAvailabilityError,
  appointmentTransactionOptions,
  assertAppointmentAvailability,
  lockBarberSchedule,
} from "@/lib/appointment-availability";
import { prisma } from "@/lib/prisma";
import { createAppointmentPublicCode } from "@/lib/public-appointments";

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
  const { clientName, phone, date, serviceId, barberId } = body;

  if (!clientName || !phone || !date || !serviceId || !barberId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const appointmentDate = new Date(date);
  if (Number.isNaN(appointmentDate.getTime())) {
    return NextResponse.json({ error: "Data inválida" }, { status: 400 });
  }

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      await lockBarberSchedule(tx, barberId);

      const service = await tx.service.findUnique({ where: { id: serviceId } });
      if (!service || !service.isActive) {
        throw new Error("Serviço indisponível");
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

      const canPerformService = barber.serviceLinks.some(
        (serviceLink) => serviceLink.serviceId === serviceId,
      );
      if (!canPerformService) {
        throw new Error("Barbeiro não atende esse serviço");
      }

      await assertAppointmentAvailability(tx, {
        barberId,
        startAt: appointmentDate,
        serviceDuration: service.duration,
      });

      return tx.appointment.create({
        data: {
          publicCode: await createAppointmentPublicCode(),
          clientName,
          phone,
          date: appointmentDate,
          serviceId,
          barberId,
          isActive: true,
        },
      });
    }, appointmentTransactionOptions);

    return NextResponse.json(
      {
        id: appointment.id,
        date: appointment.date.toISOString(),
      },
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
