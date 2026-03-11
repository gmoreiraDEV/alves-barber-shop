import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/stack/server";

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

export async function GET() {
  const barbers = await prisma.barber.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      serviceLinks: {
        select: { serviceId: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json(barbers.map(serializeBarber));
}

export async function POST(request: Request) {
  const user = await stackServerApp.getUser({ or: "return-null" });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const serviceIds = normalizeServiceIds(body.serviceIds);

  if (
    !name ||
    (body.serviceIds !== undefined && !Array.isArray(body.serviceIds))
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!(await allServicesExist(serviceIds))) {
    return NextResponse.json({ error: "Invalid services" }, { status: 400 });
  }

  const barber = await prisma.barber.create({
    data: {
      name,
      specialties: [],
      serviceLinks:
        serviceIds.length > 0
          ? {
              create: serviceIds.map((serviceId) => ({ serviceId })),
            }
          : undefined,
    },
    include: {
      serviceLinks: {
        select: { serviceId: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json(serializeBarber(barber), { status: 201 });
}
