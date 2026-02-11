import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/stack/server";

export async function GET() {
  const barbers = await prisma.barber.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(barbers);
}

export async function POST(request: Request) {
  const user = await stackServerApp.getUser({ or: "return-null" });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, specialties } = body;

  if (!name || !Array.isArray(specialties)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const barber = await prisma.barber.create({
    data: {
      name,
      specialties: specialties.filter((item: unknown) => typeof item === "string"),
    },
  });

  return NextResponse.json(barber, { status: 201 });
}
