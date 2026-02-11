import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/stack/server";

export async function GET() {
  const absences = await prisma.barberAbsence.findMany({
    orderBy: { startAt: "asc" },
  });

  return NextResponse.json(absences);
}

export async function POST(request: Request) {
  const user = await stackServerApp.getUser({ or: "return-null" });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { barberId, startAt, endAt } = body;

  if (!barberId || !startAt || !endAt) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const absence = await prisma.barberAbsence.create({
    data: {
      barberId,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
    },
  });

  return NextResponse.json(absence, { status: 201 });
}
