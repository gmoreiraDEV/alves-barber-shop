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
  const { barberId, startAt, endAt, month } = body;

  if (typeof month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    const [year, monthNumber] = month.split("-").map(Number);
    const start = new Date(`${month}-01T00:00:00-03:00`);
    const nextYear = year + (monthNumber === 12 ? 1 : 0);
    const nextMonth = monthNumber === 12 ? 1 : monthNumber + 1;
    const end = new Date(
      `${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00-03:00`,
    );
    if (barberId && typeof barberId !== "string") {
      return NextResponse.json({ error: "Invalid barber" }, { status: 400 });
    }
    const absence = await prisma.barberAbsence.create({
      data: { barberId: barberId || null, startAt: start, endAt: end },
    });
    return NextResponse.json(absence, { status: 201 });
  }

  if (typeof barberId !== "string" || !barberId || !startAt || !endAt) {
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
