import type { WorkingHoursDay } from "@/types";

export const DEFAULT_OPEN_TIME = "08:00";
export const DEFAULT_CLOSE_TIME = "21:00";

export const WORKING_HOURS_DAYS = [
  { dayOfWeek: 1, shortLabel: "Seg", label: "Segunda-feira" },
  { dayOfWeek: 2, shortLabel: "Ter", label: "Terça-feira" },
  { dayOfWeek: 3, shortLabel: "Qua", label: "Quarta-feira" },
  { dayOfWeek: 4, shortLabel: "Qui", label: "Quinta-feira" },
  { dayOfWeek: 5, shortLabel: "Sex", label: "Sexta-feira" },
  { dayOfWeek: 6, shortLabel: "Sáb", label: "Sábado" },
  { dayOfWeek: 0, shortLabel: "Dom", label: "Domingo" },
] as const;

const timeLabelPattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function toMinutes(label: string) {
  const [hours, minutes] = label.split(":").map(Number);
  return hours * 60 + minutes;
}

export function toTimeLabel(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function isValidTimeLabel(value: string) {
  return timeLabelPattern.test(value);
}

export function createDefaultWorkingHours(): WorkingHoursDay[] {
  return WORKING_HOURS_DAYS.map(({ dayOfWeek }) => ({
    dayOfWeek,
    isOpen: true,
    startTime: DEFAULT_OPEN_TIME,
    endTime: DEFAULT_CLOSE_TIME,
  }));
}

export function normalizeWorkingHours(
  workingHours: WorkingHoursDay[],
): WorkingHoursDay[] {
  const hoursByDay = new Map(
    workingHours.map((day) => [
      day.dayOfWeek,
      {
        ...day,
        startTime: isValidTimeLabel(day.startTime)
          ? day.startTime
          : DEFAULT_OPEN_TIME,
        endTime: isValidTimeLabel(day.endTime)
          ? day.endTime
          : DEFAULT_CLOSE_TIME,
      },
    ]),
  );

  return WORKING_HOURS_DAYS.map(({ dayOfWeek }) => {
    const hours = hoursByDay.get(dayOfWeek);
    return {
      dayOfWeek,
      isOpen: hours?.isOpen ?? true,
      startTime: hours?.startTime ?? DEFAULT_OPEN_TIME,
      endTime: hours?.endTime ?? DEFAULT_CLOSE_TIME,
    };
  });
}

export function getWorkingHoursForDate(
  workingHours: WorkingHoursDay[],
  date: Date,
) {
  return normalizeWorkingHours(workingHours).find(
    (day) => day.dayOfWeek === date.getDay(),
  );
}

export function getWorkingHoursBounds(workingHours: WorkingHoursDay[]) {
  const activeDays = normalizeWorkingHours(workingHours).filter(
    (day) => day.isOpen,
  );

  if (activeDays.length === 0) {
    return null;
  }

  return {
    openMinutes: Math.min(...activeDays.map((day) => toMinutes(day.startTime))),
    closeMinutes: Math.max(...activeDays.map((day) => toMinutes(day.endTime))),
  };
}

export function isRangeWithinWorkingHours(
  workingDay: WorkingHoursDay | undefined,
  startMinutes: number,
  endMinutes: number,
) {
  if (!workingDay?.isOpen || endMinutes <= startMinutes) {
    return false;
  }

  return (
    startMinutes >= toMinutes(workingDay.startTime) &&
    endMinutes <= toMinutes(workingDay.endTime)
  );
}
