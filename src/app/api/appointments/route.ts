import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/stack/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const minimal = searchParams.get("minimal") === "true";

  if (minimal) {
    return NextResponse.json([]);
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

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.isActive) {
    return NextResponse.json({ error: "Serviço indisponível" }, { status: 400 });
  }

  const barber = await prisma.barber.findUnique({ where: { id: barberId } });
  if (!barber) {
    return NextResponse.json({ error: "Barbeiro indisponível" }, { status: 400 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      clientName,
      phone,
      date: new Date(date),
      serviceId,
      barberId,
      isActive: true,
    },
  });

  return NextResponse.json(appointment, { status: 201 });
}
