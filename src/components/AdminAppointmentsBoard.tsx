"use client";

import { format } from "date-fns";
import { useMemo, useState } from "react";
import type { Appointment, Barber, BarberAbsence, Service } from "@/types";
import { useToast } from "./ui/toast";

type FilterRange = "today" | "week" | "month";

type AdminAppointmentsBoardProps = {
  appointments: Appointment[];
  services: Service[];
  barbers: Barber[];
  absences: BarberAbsence[];
  onDeleteAppointment: (id: string) => Promise<void>;
  onMoveAppointment: (id: string, nextDateIso: string) => Promise<void>;
};

const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const OPEN_MINUTES = 8 * 60;
const CLOSE_MINUTES = 21 * 60;
const SLOT_STEP = 30;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

function startOfWeek(date: Date) {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setDate(date.getDate() + diff);
  return startOfDay(start);
}

function endOfWeek(date: Date) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return endOfDay(end);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toMinutes(label: string) {
  const [hours, minutes] = label.split(":").map(Number);
  return hours * 60 + minutes;
}

function toTimeLabel(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

function formatDateShort(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatDateFull(date: Date) {
  return date.toLocaleString("pt-BR");
}

function getSlotKey(date: Date) {
  return `${format(date, "yyyy-MM-dd")}|${format(date, "HH:mm")}`;
}

export default function AdminAppointmentsBoard({
  appointments,
  services,
  barbers,
  absences,
  onDeleteAppointment,
  onMoveAppointment,
}: AdminAppointmentsBoardProps) {
  const [range, setRange] = useState<FilterRange>("today");
  const [draggedAppointmentId, setDraggedAppointmentId] = useState<
    string | null
  >(null);
  const [hoverTarget, setHoverTarget] = useState<string | null>(null);
  const [deletingAppointmentId, setDeletingAppointmentId] = useState<
    string | null
  >(null);
  const [movingAppointmentId, setMovingAppointmentId] = useState<string | null>(
    null,
  );
  const { toast } = useToast();

  const now = new Date();
  const servicesById = useMemo(
    () => new Map(services.map((service) => [service.id, service])),
    [services],
  );
  const barbersById = useMemo(
    () => new Map(barbers.map((barber) => [barber.id, barber])),
    [barbers],
  );

  const rangeStart = useMemo(() => {
    if (range === "today") return startOfDay(now);
    if (range === "week") return startOfWeek(now);
    return startOfMonth(now);
  }, [range, now]);

  const rangeEnd = useMemo(() => {
    if (range === "today") return endOfDay(now);
    if (range === "week") return endOfWeek(now);
    return endOfMonth(now);
  }, [range, now]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const date = new Date(appointment.date);
      return date >= rangeStart && date <= rangeEnd;
    });
  }, [appointments, rangeStart, rangeEnd]);

  const monthDays = useMemo(() => {
    const firstDay = startOfMonth(now);
    const lastDay = endOfMonth(now);
    const daysInMonth = lastDay.getDate();
    const offset = (firstDay.getDay() + 6) % 7;
    const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const dayIndex = index - offset + 1;
      if (dayIndex < 1 || dayIndex > daysInMonth) {
        return {
          key: `empty-${format(now, "yyyy-MM")}-${index}`,
          date: null as Date | null,
        };
      }

      const date = new Date(now.getFullYear(), now.getMonth(), dayIndex);
      return {
        key: format(date, "yyyy-MM-dd"),
        date,
      };
    });
  }, [now]);

  const weekDays = useMemo(() => {
    const start = range === "today" ? startOfDay(now) : startOfWeek(now);
    const length = range === "today" ? 1 : 7;
    return Array.from({ length }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [now, range]);

  const slots = useMemo(() => {
    const list: string[] = [];
    for (
      let minutes = OPEN_MINUTES;
      minutes < CLOSE_MINUTES;
      minutes += SLOT_STEP
    ) {
      list.push(toTimeLabel(minutes));
    }
    return list;
  }, []);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const appointment of filteredAppointments) {
      const key = format(new Date(appointment.date), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(appointment);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => +new Date(a.date) - +new Date(b.date));
    }
    return map;
  }, [filteredAppointments]);

  const appointmentsBySlot = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const appointment of filteredAppointments) {
      const start = new Date(appointment.date);
      const key = getSlotKey(start);
      const list = map.get(key) ?? [];
      list.push(appointment);
      map.set(key, list);
    }
    return map;
  }, [filteredAppointments]);

  const getDurationMinutes = (appointment: Appointment) => {
    return servicesById.get(appointment.serviceId)?.duration ?? 30;
  };

  const canMoveAppointment = (appointment: Appointment, nextDate: Date) => {
    const duration = getDurationMinutes(appointment);
    const nextEnd = new Date(nextDate);
    nextEnd.setMinutes(nextDate.getMinutes() + duration);

    const barberAbsences = absences.filter(
      (absence) => absence.barberId === appointment.barberId,
    );
    for (const absence of barberAbsences) {
      const absenceStart = new Date(absence.startAt);
      const absenceEnd = new Date(absence.endAt);
      if (overlaps(nextDate, nextEnd, absenceStart, absenceEnd)) {
        return false;
      }
    }

    const barberAppointments = appointments.filter(
      (other) =>
        other.id !== appointment.id && other.barberId === appointment.barberId,
    );

    for (const other of barberAppointments) {
      const otherStart = new Date(other.date);
      const otherDuration = getDurationMinutes(other);
      const otherEnd = new Date(otherStart);
      otherEnd.setMinutes(otherEnd.getMinutes() + otherDuration);

      if (overlaps(nextDate, nextEnd, otherStart, otherEnd)) {
        return false;
      }
    }

    return true;
  };

  const moveAppointment = async (appointmentId: string, nextDate: Date) => {
    const appointment = appointments.find((item) => item.id === appointmentId);
    if (!appointment) {
      return;
    }

    if (!canMoveAppointment(appointment, nextDate)) {
      toast({
        title: "Conflito de horário",
        description: "O barbeiro já possui agendamento/ausência nesse horário.",
        variant: "error",
      });
      return;
    }

    try {
      setMovingAppointmentId(appointmentId);
      await onMoveAppointment(appointmentId, nextDate.toISOString());
      toast({
        title: "Agendamento atualizado",
        description: "Data e horário atualizados com sucesso.",
        variant: "success",
      });
    } catch (_error) {
      toast({
        title: "Erro ao mover agendamento",
        description: "Não foi possível salvar a alteração. Tente novamente.",
        variant: "error",
      });
    } finally {
      setMovingAppointmentId(null);
    }
  };

  const handleDropInDay = async (day: Date) => {
    if (!draggedAppointmentId) {
      return;
    }

    const appointment = appointments.find(
      (item) => item.id === draggedAppointmentId,
    );
    if (!appointment) {
      return;
    }

    const original = new Date(appointment.date);
    const nextDate = new Date(day);
    nextDate.setHours(original.getHours(), original.getMinutes(), 0, 0);

    await moveAppointment(appointment.id, nextDate);
  };

  const handleDropInSlot = async (day: Date, time: string) => {
    if (!draggedAppointmentId) {
      return;
    }

    const minutes = toMinutes(time);
    const nextDate = new Date(day);
    nextDate.setHours(0, 0, 0, 0);
    nextDate.setMinutes(minutes);

    await moveAppointment(draggedAppointmentId, nextDate);
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingAppointmentId(id);
      await onDeleteAppointment(id);
      toast({
        title: "Agendamento removido",
        description: "O agendamento foi excluído com sucesso.",
        variant: "success",
      });
    } catch (_error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o agendamento.",
        variant: "error",
      });
    } finally {
      setDeletingAppointmentId(null);
    }
  };

  const appointmentChip = (appointment: Appointment) => {
    const date = new Date(appointment.date);
    const time = format(date, "HH:mm");

    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: drag interaction handled by HTML drag API.
      <div
        key={appointment.id}
        draggable={movingAppointmentId !== appointment.id}
        onDragStart={() => setDraggedAppointmentId(appointment.id)}
        onDragEnd={() => {
          setDraggedAppointmentId(null);
          setHoverTarget(null);
        }}
        className="cursor-grab rounded-xl border border-stone-700 bg-stone-900 px-2 py-1.5 active:cursor-grabbing"
      >
        <div className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
          {time}
        </div>
        <p className="mt-1 text-xs font-medium text-stone-200">
          {appointment.clientName}
        </p>
      </div>
    );
  };

  return (
    <section className="bg-stone-900/80 border border-stone-800 rounded-3xl p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-bold text-stone-100">Agendamentos</h3>
          <p className="text-xs text-stone-500">
            Arraste e solte para reagendar dia/horário.
          </p>
        </div>
        <div className="flex gap-2">
          {(["today", "week", "month"] as FilterRange[]).map((option) => (
            <button
              type="button"
              key={option}
              onClick={() => setRange(option)}
              className={`px-4 py-2 rounded-full border text-[10px] uppercase tracking-widest transition ${
                range === option
                  ? "border-amber-500 text-amber-400"
                  : "border-stone-700 text-stone-400 hover:bg-stone-800"
              }`}
            >
              {option === "today"
                ? "Hoje"
                : option === "week"
                  ? "Semana"
                  : "Mês"}
            </button>
          ))}
        </div>
      </div>

      {range === "month" ? (
        <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-4">
          <div className="grid grid-cols-7 gap-2">
            {weekdays.map((label) => (
              <div
                key={label}
                className="text-[10px] uppercase tracking-widest text-stone-500"
              >
                {label}
              </div>
            ))}
            {monthDays.map((cell) => {
              if (!cell.date) {
                return <div key={cell.key} className="min-h-[90px]" />;
              }

              const day = cell.date;
              const dayKey = format(day, "yyyy-MM-dd");
              const list = appointmentsByDay.get(dayKey) ?? [];
              const isToday = isSameDay(day, now);
              const isOver = hoverTarget === `day:${dayKey}`;

              return (
                // biome-ignore lint/a11y/noStaticElementInteractions: drop interaction handled by HTML drag API.
                <div
                  key={dayKey}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setHoverTarget(`day:${dayKey}`);
                  }}
                  onDragLeave={() => setHoverTarget(null)}
                  onDrop={async () => {
                    await handleDropInDay(day);
                    setHoverTarget(null);
                    setDraggedAppointmentId(null);
                  }}
                  className={`min-h-[120px] rounded-xl border p-3 flex flex-col gap-2 transition ${
                    isOver
                      ? "border-amber-500 shadow-[0_0_0_1px_rgba(245,158,11,0.6)]"
                      : isToday
                        ? "border-amber-500/70 bg-amber-500/10"
                        : "border-stone-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-300 font-semibold">
                      {day.getDate()}
                    </span>
                    {list.length > 0 ? (
                      <span className="text-[10px] uppercase tracking-widest text-amber-400">
                        {list.length} ag.
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    {list
                      .slice(0, 3)
                      .map((appointment) => appointmentChip(appointment))}
                    {list.length > 3 ? (
                      <span className="text-[10px] text-stone-500">
                        + {list.length - 3}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");

            return (
              <div
                key={dayKey}
                className="rounded-2xl border border-stone-800 bg-stone-950/60 p-3"
              >
                <div className="mb-3 text-xs font-semibold text-stone-300">
                  {formatDateShort(day)}
                </div>
                <div className="max-h-[480px] overflow-auto space-y-1">
                  {slots.map((slot) => {
                    const slotDate = new Date(day);
                    slotDate.setHours(0, 0, 0, 0);
                    slotDate.setMinutes(toMinutes(slot));
                    const slotKey = getSlotKey(slotDate);
                    const isOver = hoverTarget === `slot:${slotKey}`;
                    const slotAppointments =
                      appointmentsBySlot.get(slotKey) ?? [];

                    return (
                      // biome-ignore lint/a11y/noStaticElementInteractions: drop interaction handled by HTML drag API.
                      <div
                        key={slotKey}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setHoverTarget(`slot:${slotKey}`);
                        }}
                        onDragLeave={() => setHoverTarget(null)}
                        onDrop={async () => {
                          await handleDropInSlot(day, slot);
                          setHoverTarget(null);
                          setDraggedAppointmentId(null);
                        }}
                        className={`rounded-lg border px-2 py-2 min-h-11 transition ${
                          isOver
                            ? "border-amber-500 bg-amber-500/10"
                            : "border-stone-800"
                        }`}
                      >
                        <div className="text-[10px] text-stone-500 mb-1">
                          {slot}
                        </div>
                        <div className="space-y-1">
                          {slotAppointments.map((appointment) =>
                            appointmentChip(appointment),
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-3">
        {filteredAppointments.length === 0 ? (
          <p className="text-sm text-stone-500">
            Nenhum agendamento no período.
          </p>
        ) : (
          filteredAppointments.map((appointment) => {
            const service = servicesById.get(appointment.serviceId);
            const barber = barbersById.get(appointment.barberId);

            return (
              <div
                key={appointment.id}
                className="border border-stone-800 rounded-2xl p-4 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                    {format(new Date(appointment.date), "HH:mm")}
                  </span>
                  <span className="text-sm font-semibold text-stone-100">
                    {appointment.clientName}
                  </span>
                </div>
                <div className="text-xs text-stone-500">
                  Serviço: {service?.name ?? "Serviço"}
                </div>
                <div className="text-xs text-stone-500">
                  Barbeiro: {barber?.name ?? "Barbeiro"}
                </div>
                <div className="text-xs text-stone-500">
                  Data: {formatDateFull(new Date(appointment.date))}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => handleDelete(appointment.id)}
                    className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-red-500 text-red-400 hover:bg-red-500/20"
                    disabled={
                      deletingAppointmentId === appointment.id ||
                      movingAppointmentId !== null
                    }
                  >
                    {deletingAppointmentId === appointment.id
                      ? "Excluindo..."
                      : "Excluir"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
