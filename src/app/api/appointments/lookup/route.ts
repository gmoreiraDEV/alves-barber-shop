import { NextResponse } from "next/server";
import {
  findAppointmentByPublicAccess,
  serializePublicAppointment,
} from "@/lib/public-appointments";

export async function POST(request: Request) {
  const body = await request.json();
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const publicCode =
    typeof body.publicCode === "string" ? body.publicCode.trim() : "";

  if (!phone || !publicCode) {
    return NextResponse.json(
      { error: "Informe telefone e código do agendamento." },
      { status: 400 },
    );
  }

  const appointment = await findAppointmentByPublicAccess(phone, publicCode);

  if (!appointment) {
    return NextResponse.json(
      { error: "Agendamento não encontrado." },
      { status: 404 },
    );
  }

  return NextResponse.json(serializePublicAppointment(appointment));
}
