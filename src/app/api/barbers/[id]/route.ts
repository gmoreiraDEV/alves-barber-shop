import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/stack/server";

type Params = { params: Promise<{ id: string }> };

function normalizeServiceIds(input: unknown) {
  if (!Array.isArray(input)) return [];

  return Array.from(
    new Set(
      input
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

async function allServicesExist(serviceIds: string[]) {
  if (serviceIds.length === 0) return true;

  const count = await prisma.service.count({
    where: { id: { in: serviceIds } },
  });

  return count === serviceIds.length;
}

function serializeBarber(barber: {
  id: string;
  name: string;
  specialties: string[];
  serviceLinks: { serviceId: string }[];
}) {
  return {
    id: barber.id,
    name: barber.name,
    specialties: barber.specialties,
    serviceIds: barber.serviceLinks.map((link) => link.serviceId),
  };
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const user = await stackServerApp.getUser({ or: "return-null" });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const hasName = Object.hasOwn(body, "name");
  const hasServiceIds = Object.hasOwn(body, "serviceIds");

  if (!hasName && !hasServiceIds) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const nextName = typeof body.name === "string" ? body.name.trim() : "";
  if (hasName && !nextName) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (hasServiceIds && !Array.isArray(body.serviceIds)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const serviceIds = normalizeServiceIds(body.serviceIds);
  if (hasServiceIds && !(await allServicesExist(serviceIds))) {
    return NextResponse.json({ error: "Invalid services" }, { status: 400 });
  }

  const barber = await prisma.$transaction(async (tx) => {
    await tx.barber.update({
      where: { id },
      data: hasName ? { name: nextName } : {},
    });

    if (hasServiceIds) {
      await tx.barberService.deleteMany({
        where: { barberId: id },
      });

      if (serviceIds.length > 0) {
        await tx.barberService.createMany({
          data: serviceIds.map((serviceId) => ({
            barberId: id,
            serviceId,
          })),
        });
      }
    }

    return tx.barber.findUniqueOrThrow({
      where: { id },
      include: {
        serviceLinks: {
          select: { serviceId: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  });

  return NextResponse.json(serializeBarber(barber));
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
