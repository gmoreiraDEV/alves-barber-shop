import { NextResponse } from "next/server";
import {
  findAppointmentsByPublicPhone,
  serializePublicAppointments,
} from "@/lib/public-appointments";

export async function POST(request: Request) {
  const body = await request.json();
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!phone) {
    return NextResponse.json(
      { error: "Informe o telefone do agendamento." },
      { status: 400 },
    );
  }

  const appointments = await findAppointmentsByPublicPhone(phone);

  if (appointments.length === 0) {
    return NextResponse.json(
      { error: "Agendamento não encontrado." },
      { status: 404 },
    );
  }

  return NextResponse.json(serializePublicAppointments(appointments));
}
