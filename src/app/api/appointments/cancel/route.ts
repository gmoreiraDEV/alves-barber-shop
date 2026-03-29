import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  findAppointmentByPublicPhoneAndId,
  serializePublicAppointment,
} from "@/lib/public-appointments";

export async function POST(request: Request) {
  const body = await request.json();
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const appointmentId =
    typeof body.appointmentId === "string" ? body.appointmentId.trim() : "";

  if (!phone || !appointmentId) {
    return NextResponse.json(
      { error: "Informe o telefone e selecione o agendamento." },
      { status: 400 },
    );
  }

  const appointment = await findAppointmentByPublicPhoneAndId(
    phone,
    appointmentId,
  );

  if (!appointment) {
    return NextResponse.json(
      { error: "Agendamento não encontrado." },
      { status: 404 },
    );
  }

  if (!appointment.isActive || appointment.deletedAt) {
    return NextResponse.json(
      { error: "Esse agendamento já está cancelado." },
      { status: 409 },
    );
  }

  if (appointment.date < new Date()) {
    return NextResponse.json(
      { error: "Não é possível cancelar após o horário agendado." },
      { status: 409 },
    );
  }

  const canceledAppointment = await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
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

  return NextResponse.json(serializePublicAppointment(canceledAppointment));
}
