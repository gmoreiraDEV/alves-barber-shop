import { NextResponse } from "next/server";
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
  const { name, specialties } = body;

  const updateData: {
    name?: string;
    specialties?: string[];
  } = {};

  if (typeof name === "string") {
    updateData.name = name;
  }

  if (
    Array.isArray(specialties) &&
    specialties.every((item) => typeof item === "string")
  ) {
    updateData.specialties = specialties;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const barber = await prisma.barber.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(barber);
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  const user = await stackServerApp.getUser({ or: "return-null" });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    replacementBarberId?: string;
  };
  const replacementBarberId = body.replacementBarberId?.trim();

  if (replacementBarberId === id) {
    return NextResponse.json(
      { error: "Selecione outro barbeiro para receber os atendimentos." },
      { status: 400 },
    );
  }

  if (replacementBarberId) {
    const replacementBarber = await prisma.barber.findUnique({
      where: { id: replacementBarberId },
      select: { id: true },
    });

    if (!replacementBarber) {
      return NextResponse.json(
        { error: "Barbeiro substituto não encontrado." },
        { status: 404 },
      );
    }
  }

  const appointmentsCount = await prisma.appointment.count({
    where: { barberId: id, isActive: true },
  });

  if (appointmentsCount > 0 && !replacementBarberId) {
    return NextResponse.json(
      {
        error:
          "Este barbeiro possui agendamentos. Selecione outro barbeiro para transferir os atendimentos.",
      },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    if (replacementBarberId) {
      await tx.appointment.updateMany({
        where: { barberId: id, isActive: true },
        data: { barberId: replacementBarberId },
      });
    }

    await tx.barberAbsence.deleteMany({
      where: { barberId: id },
    });

    await tx.barber.delete({
      where: { id },
    });
  });

  return NextResponse.json({
    success: true,
    transferredAppointments: replacementBarberId ? appointmentsCount : 0,
  });
}
