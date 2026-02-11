import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/stack/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeAll = searchParams.get("all") === "true";

  const services = await prisma.service.findMany({
    where: includeAll ? undefined : { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(services);
}

export async function POST(request: Request) {
  const user = await stackServerApp.getUser({ or: "return-null" });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, price, duration } = body;

  if (!name || !description || typeof price !== "number" || typeof duration !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const service = await prisma.service.create({
    data: {
      name,
      description,
      price,
      duration,
      isActive: true,
    },
  });

  return NextResponse.json(service, { status: 201 });
}
