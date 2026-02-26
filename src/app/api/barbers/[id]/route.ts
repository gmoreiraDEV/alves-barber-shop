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

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await stackServerApp.getUser({ or: "return-null" });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.barber.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
