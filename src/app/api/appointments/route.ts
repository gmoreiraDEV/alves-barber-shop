import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAppointmentPublicCode } from "@/lib/public-appointments";

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
    return NextResponse.json(
      { error: "Serviço indisponível" },
      { status: 400 },
    );
  }

  const barber = await prisma.barber.findUnique({
    where: { id: barberId },
    include: {
      serviceLinks: {
        select: { serviceId: true },
      },
    },
  });
  if (!barber) {
    return NextResponse.json(
      { error: "Barbeiro indisponível" },
      { status: 400 },
    );
  }

  const canPerformService = barber.serviceLinks.some(
    (serviceLink) => serviceLink.serviceId === serviceId,
  );
  if (!canPerformService) {
    return NextResponse.json(
      { error: "Barbeiro não atende esse serviço" },
      { status: 400 },
    );
  }

  const appointment = await prisma.appointment.create({
    data: {
      publicCode: await createAppointmentPublicCode(),
      clientName,
      phone,
      date: new Date(date),
      serviceId,
      barberId,
      isActive: true,
    },
  });

  return NextResponse.json(
    {
      id: appointment.id,
      publicCode: appointment.publicCode,
      date: appointment.date.toISOString(),
    },
    { status: 201 },
  );
}
