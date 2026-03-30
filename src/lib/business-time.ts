export const BUSINESS_TIME_ZONE = "America/Sao_Paulo";

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: BUSINESS_TIME_ZONE,
  weekday: "short",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const weekdayMap = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
} as const;

type DateTimeParts = {
  weekday: keyof typeof weekdayMap;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getDateTimeParts(date: Date): DateTimeParts {
  const values = {
    weekday: "Sun",
    year: "0",
    month: "0",
    day: "0",
    hour: "0",
    minute: "0",
    second: "0",
  };

  for (const part of dateTimeFormatter.formatToParts(date)) {
    if (part.type in values) {
      values[part.type as keyof typeof values] = part.value;
    }
  }

  return {
    weekday: values.weekday as keyof typeof weekdayMap,
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function getTimeZoneOffset(date: Date) {
  const parts = getDateTimeParts(date);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return asUtc - Math.trunc(date.getTime() / 1000) * 1000;
}

export function getBusinessDayOfWeek(date: Date) {
  return weekdayMap[getDateTimeParts(date).weekday];
}

export function getBusinessMinutes(date: Date) {
  const parts = getDateTimeParts(date);
  return parts.hour * 60 + parts.minute;
}

export function getBusinessDayRange(date: Date) {
  const parts = getDateTimeParts(date);
  const start = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0),
  );
  const end = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, 23, 59, 59, 999),
  );

  return {
    start: new Date(start.getTime() - getTimeZoneOffset(start)),
    end: new Date(end.getTime() - getTimeZoneOffset(end)),
  };
}
