import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createDefaultWorkingHours,
  isValidTimeLabel,
  normalizeWorkingHours,
  toMinutes,
} from "@/lib/working-hours";
import { stackServerApp } from "@/stack/server";
import type { WorkingHoursDay } from "@/types";

function isValidWorkingHoursPayload(
  input: unknown,
): input is WorkingHoursDay[] {
  if (!Array.isArray(input)) {
    return false;
  }

  const dayNumbers = new Set<number>();

  return input.every((item) => {
    if (
      !item ||
      typeof item !== "object" ||
      typeof item.dayOfWeek !== "number" ||
      typeof item.isOpen !== "boolean" ||
      typeof item.startTime !== "string" ||
      typeof item.endTime !== "string"
    ) {
      return false;
    }

    if (
      item.dayOfWeek < 0 ||
      item.dayOfWeek > 6 ||
      dayNumbers.has(item.dayOfWeek) ||
      !isValidTimeLabel(item.startTime) ||
      !isValidTimeLabel(item.endTime)
    ) {
      return false;
    }

    dayNumbers.add(item.dayOfWeek);

    if (item.isOpen && toMinutes(item.endTime) <= toMinutes(item.startTime)) {
      return false;
    }

    return true;
  });
}

export async function GET() {
  try {
    const workingHours = await prisma.workingHours.findMany({
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json(normalizeWorkingHours(workingHours));
  } catch (_error) {
    return NextResponse.json(createDefaultWorkingHours());
  }
}

export async function PUT(request: Request) {
  const user = await stackServerApp.getUser({ or: "return-null" });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!isValidWorkingHoursPayload(body)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const workingHours = normalizeWorkingHours(body);

  try {
    const savedWorkingHours = await prisma.$transaction(
      workingHours.map((day) =>
        prisma.workingHours.upsert({
          where: { dayOfWeek: day.dayOfWeek },
          update: {
            isOpen: day.isOpen,
            startTime: day.startTime,
            endTime: day.endTime,
          },
          create: day,
        }),
      ),
    );

    return NextResponse.json(normalizeWorkingHours(savedWorkingHours));
  } catch (_error) {
    return NextResponse.json(
      {
        error:
          "Não foi possível salvar os horários. Aplique a migration pendente.",
      },
      { status: 500 },
    );
  }
}
