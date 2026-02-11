import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/stack/server";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await stackServerApp.getUser({ or: "return-null" });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: { isActive: false, deletedAt: new Date() },
  });

  return NextResponse.json(appointment);
}
