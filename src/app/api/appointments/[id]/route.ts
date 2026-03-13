import { NextResponse } from "next/server";
import {
  AppointmentAvailabilityError,
  appointmentTransactionOptions,
  assertAppointmentAvailability,
  lockBarberSchedule,
} from "@/lib/appointment-availability";
import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/stack/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const user = await stackServerApp.getUser({ or: "return-null" });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { date } = body;

  if (!date) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const nextDate = new Date(date);
  if (Number.isNaN(nextDate.getTime())) {
    return NextResponse.json({ error: "Data inválida" }, { status: 400 });
  }

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      const existingAppointment = await tx.appointment.findUnique({
        where: { id },
        include: {
          service: {
            select: {
              duration: true,
            },
          },
        },
      });

      if (!existingAppointment || !existingAppointment.isActive) {
        throw new Error("Agendamento indisponível");
      }

      await lockBarberSchedule(tx, existingAppointment.barberId);
      await assertAppointmentAvailability(tx, {
        barberId: existingAppointment.barberId,
        startAt: nextDate,
        serviceDuration: existingAppointment.service.duration,
        excludeAppointmentId: existingAppointment.id,
      });

      return tx.appointment.update({
        where: { id },
        data: { date: nextDate },
      });
    }, appointmentTransactionOptions);

    return NextResponse.json(appointment);
  } catch (error) {
    if (error instanceof AppointmentAvailabilityError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (
      error instanceof Error &&
      error.message === "Agendamento indisponível"
    ) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Não foi possível mover o agendamento." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await stackServerApp.getUser({ or: "return-null" });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: { isActive: false, deletedAt: new Date() },
  });

  return NextResponse.json(appointment);
}
