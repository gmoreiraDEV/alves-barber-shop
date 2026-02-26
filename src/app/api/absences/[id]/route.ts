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
  const { barberId, startAt, endAt } = body;

  const updateData: {
    barberId?: string;
    startAt?: Date;
    endAt?: Date;
  } = {};

  if (typeof barberId === "string") {
    updateData.barberId = barberId;
  }

  if (typeof startAt === "string") {
    const parsedStart = new Date(startAt);
    if (!Number.isNaN(parsedStart.getTime())) {
      updateData.startAt = parsedStart;
    }
  }

  if (typeof endAt === "string") {
    const parsedEnd = new Date(endAt);
    if (!Number.isNaN(parsedEnd.getTime())) {
      updateData.endAt = parsedEnd;
    }
  }

  if (
    updateData.startAt &&
    updateData.endAt &&
    updateData.endAt <= updateData.startAt
  ) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const absence = await prisma.barberAbsence.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(absence);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await stackServerApp.getUser({ or: "return-null" });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.barberAbsence.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
