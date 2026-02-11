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
  const { isActive } = body;

  if (typeof isActive !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const service = await prisma.service.update({
    where: { id },
    data: { isActive },
  });

  return NextResponse.json(service);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await stackServerApp.getUser({ or: "return-null" });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [, service] = await prisma.$transaction([
      prisma.appointment.deleteMany({
        where: { serviceId: id },
      }),
      prisma.service.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json(service);
  } catch (error) {
    console.error("Failed to delete service", { id, error });
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
  }
}
