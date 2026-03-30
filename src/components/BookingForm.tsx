"use client";

import { format } from "date-fns";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getWorkingHoursBounds,
  getWorkingHoursForDate,
  isRangeWithinWorkingHours,
  normalizeWorkingHours,
  toMinutes,
  toTimeLabel,
} from "@/lib/working-hours";
import type {
  Appointment,
  AppointmentRequest,
  Barber,
  BarberAbsence,
  BookAppointmentResult,
  Service,
  WorkingHoursDay,
} from "../types";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useToast } from "./ui/toast";

type BookingFormProps = {
  services: Service[];
  barbers: Barber[];
  appointments: Appointment[];
  absences: BarberAbsence[];
  workingHours: WorkingHoursDay[];
  onBook: (data: AppointmentRequest) => Promise<BookAppointmentResult>;
};

type BookingDraftItem = {
  id: string;
  clientName: string;
  serviceId: string;
};

const BOOKING_SLOT_STEP = 30;

let bookingItemCounter = 0;

function createBookingDraftItem(serviceId = ""): BookingDraftItem {
  bookingItemCounter += 1;
  return {
    id: `booking-item-${bookingItemCounter}`,
    clientName: "",
    serviceId,
  };
}

function startOfDate(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function endOfDate(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function setTimeFromMinutes(date: Date, minutes: number) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  nextDate.setMinutes(minutes);
  return nextDate;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

function formatDurationLabel(totalMinutes: number) {
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}min`;
}

function SelectArrow() {
  return (
    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-stone-500">
      <ChevronDown className="h-4 w-4" />
    </span>
  );
}

export default function BookingForm({
  services,
  barbers,
  appointments,
  absences,
  workingHours,
  onBook,
}: BookingFormProps) {
  const bookableServices = useMemo(
    () =>
      services.filter((service) =>
        barbers.some((barber) => barber.serviceIds.includes(service.id)),
      ),
    [services, barbers],
  );
  const isBookingDisabled = bookableServices.length === 0;
  const [phone, setPhone] = useState("");
  const [bookingItems, setBookingItems] = useState<BookingDraftItem[]>(() => [
    createBookingDraftItem(),
  ]);
  const [barberId, setBarberId] = useState(barbers[0]?.id ?? "");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastBookingCount, setLastBookingCount] = useState(0);
  const { toast } = useToast();
  const selectClassName =
    "h-11 w-full appearance-none rounded-xl border border-stone-700 bg-stone-950 px-4 pr-11 text-sm text-stone-100";

  const servicesById = useMemo(
    () => new Map(services.map((service) => [service.id, service])),
    [services],
  );
  const normalizedWorkingHours = useMemo(
    () => normalizeWorkingHours(workingHours),
    [workingHours],
  );
  const workingHoursBounds = useMemo(
    () => getWorkingHoursBounds(normalizedWorkingHours),
    [normalizedWorkingHours],
  );

  useEffect(() => {
    const defaultServiceId = bookableServices[0]?.id ?? "";

    setBookingItems((current) => {
      if (current.length === 0) {
        return [createBookingDraftItem(defaultServiceId)];
      }

      return current.map((item) => ({
        ...item,
        serviceId: bookableServices.some(
          (service) => service.id === item.serviceId,
        )
          ? item.serviceId
          : defaultServiceId,
      }));
    });
  }, [bookableServices]);

  const selectedServiceIds = useMemo(
    () => bookingItems.map((item) => item.serviceId).filter(Boolean),
    [bookingItems],
  );
  const availableBarbers = useMemo(() => {
    if (selectedServiceIds.length === 0) {
      return [];
    }

    return barbers.filter((barber) =>
      selectedServiceIds.every((serviceId) =>
        barber.serviceIds.includes(serviceId),
      ),
    );
  }, [barbers, selectedServiceIds]);
  const selectedBarber = useMemo(
    () => availableBarbers.find((barber) => barber.id === barberId),
    [availableBarbers, barberId],
  );
  const bookingItemDurations = useMemo(
    () =>
      bookingItems.map(
        (item) => servicesById.get(item.serviceId)?.duration ?? 0,
      ),
    [bookingItems, servicesById],
  );
  const totalDuration = useMemo(
    () => bookingItemDurations.reduce((total, duration) => total + duration, 0),
    [bookingItemDurations],
  );
  const barberAppointmentsByDate = useMemo(() => {
    const appointmentsByDate = new Map<string, Appointment[]>();

    for (const appointment of appointments) {
      if (appointment.barberId !== barberId) {
        continue;
      }

      const appointmentDate = new Date(appointment.date);
      const dateKey = getDateKey(appointmentDate);
      const list = appointmentsByDate.get(dateKey) ?? [];
      list.push(appointment);
      appointmentsByDate.set(dateKey, list);
    }

    return appointmentsByDate;
  }, [appointments, barberId]);
  const barberAbsences = useMemo(
    () => absences.filter((absence) => absence.barberId === barberId),
    [absences, barberId],
  );

  useEffect(() => {
    if (
      !barberId ||
      !availableBarbers.some((barber) => barber.id === barberId)
    ) {
      setBarberId(availableBarbers[0]?.id ?? "");
    }
  }, [barberId, availableBarbers]);

  const timeSlots = useMemo(() => {
    if (!workingHoursBounds) {
      return [];
    }

    const slots: string[] = [];
    for (
      let minutes = workingHoursBounds.openMinutes;
      minutes <= workingHoursBounds.closeMinutes;
      minutes += BOOKING_SLOT_STEP
    ) {
      slots.push(toTimeLabel(minutes));
    }
    return slots;
  }, [workingHoursBounds]);

  const getAvailableSlotsForDate = useMemo(
    () => (date: Date) => {
      if (!barberId || totalDuration <= 0 || bookingItemDurations.includes(0)) {
        return [];
      }

      const now = new Date();
      const normalizedDate = startOfDate(date);
      const dateStart = startOfDate(normalizedDate);
      const dateEnd = endOfDate(normalizedDate);
      const workingDay = getWorkingHoursForDate(
        normalizedWorkingHours,
        normalizedDate,
      );

      if (!workingDay?.isOpen) {
        return [];
      }

      const barberAppointments =
        barberAppointmentsByDate.get(getDateKey(normalizedDate)) ?? [];

      return timeSlots.filter((slot) => {
        const minutes = toMinutes(slot);
        const slotStart = setTimeFromMinutes(normalizedDate, minutes);
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotStart.getMinutes() + totalDuration);

        if (slotStart < now) {
          return false;
        }

        let durationOffset = 0;
        for (const duration of bookingItemDurations) {
          const itemStartMinutes = minutes + durationOffset;
          const itemEndMinutes = itemStartMinutes + duration;

          if (
            !isRangeWithinWorkingHours(
              workingDay,
              itemStartMinutes,
              itemEndMinutes,
            )
          ) {
            return false;
          }

          durationOffset += duration;
        }

        for (const appointment of barberAppointments) {
          const appointmentStart = new Date(appointment.date);
          const appointmentEnd = new Date(appointmentStart);
          const duration =
            servicesById.get(appointment.serviceId)?.duration ?? 30;
          appointmentEnd.setMinutes(appointmentEnd.getMinutes() + duration);

          if (overlaps(slotStart, slotEnd, appointmentStart, appointmentEnd)) {
            return false;
          }
        }

        for (const absence of barberAbsences) {
          const absenceStart = new Date(absence.startAt);
          const absenceEnd = new Date(absence.endAt);

          if (overlaps(slotStart, slotEnd, absenceStart, absenceEnd)) {
            return false;
          }
        }

        return slotStart >= dateStart && slotEnd <= dateEnd;
      });
    },
    [
      barberAppointmentsByDate,
      barberAbsences,
      barberId,
      bookingItemDurations,
      normalizedWorkingHours,
      servicesById,
      timeSlots,
      totalDuration,
    ],
  );

  const availableSlots = useMemo(() => {
    if (!selectedDate) {
      return barberId ? timeSlots : [];
    }

    return getAvailableSlotsForDate(selectedDate);
  }, [barberId, getAvailableSlotsForDate, selectedDate, timeSlots]);

  const isCalendarDateDisabled = (date: Date) => {
    if (isBookingDisabled || !barberId || totalDuration <= 0) {
      return true;
    }

    return getAvailableSlotsForDate(date).length === 0;
  };

  useEffect(() => {
    if (availableSlots.length > 0 && !availableSlots.includes(time)) {
      setTime(availableSlots[0]);
    }
  }, [time, availableSlots]);

  useEffect(() => {
    if (selectedDate && availableSlots.length === 0) {
      setSelectedDate(undefined);
      setTime("");
    }
  }, [selectedDate, availableSlots]);

  const isFormValid =
    !isBookingDisabled &&
    phone.trim().length > 0 &&
    bookingItems.length > 0 &&
    bookingItems.every((item) => item.clientName.trim().length > 0) &&
    bookingItems.every((item) => item.serviceId.length > 0) &&
    barberId.length > 0 &&
    !!selectedDate &&
    time.length > 0 &&
    availableSlots.length > 0;

  const updateBookingItem = (
    itemId: string,
    changes: Partial<BookingDraftItem>,
  ) => {
    setBookingItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, ...changes } : item,
      ),
    );
  };

  const handleAddBookingItem = () => {
    setBookingItems((current) => [
      ...current,
      createBookingDraftItem(bookableServices[0]?.id ?? ""),
    ]);
  };

  const handleRemoveBookingItem = (itemId: string) => {
    setBookingItems((current) =>
      current.length === 1
        ? current
        : current.filter((item) => item.id !== itemId),
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      if (isBookingDisabled) {
        setFormError(
          "Cadastre serviços ativos e vincule pelo menos um barbeiro para liberar os agendamentos.",
        );
      } else if (!phone.trim()) {
        setFormError("Informe um telefone para contato.");
      } else if (bookingItems.some((item) => !item.clientName.trim())) {
        setFormError("Informe o nome de todas as pessoas do agendamento.");
      } else if (bookingItems.some((item) => !item.serviceId)) {
        setFormError("Selecione um serviço para cada pessoa.");
      } else if (!barberId) {
        setFormError(
          "Selecione um barbeiro disponível para todos os serviços.",
        );
      } else if (!selectedDate) {
        setFormError("Selecione uma data.");
      } else if (!time || availableSlots.length === 0) {
        setFormError("Selecione um horário disponível.");
      } else {
        setFormError("Revise os dados do agendamento.");
      }
      return;
    }

    const [hours, minutes] = time.split(":").map((value) => Number(value));
    const dateTime = new Date(selectedDate);
    dateTime.setHours(hours, minutes, 0, 0);

    try {
      setIsSubmitting(true);
      setFormError("");
      const result = await onBook({
        phone,
        barberId,
        date: dateTime.toISOString(),
        items: bookingItems.map((item) => ({
          clientName: item.clientName.trim(),
          serviceId: item.serviceId,
        })),
      });
      setLastBookingCount(result.appointments.length);

      toast({
        title: "Agendamento confirmado",
        description:
          result.appointments.length > 1
            ? "As reservas foram criadas em sequência."
            : "Use seu telefone para consultar ou cancelar depois.",
        variant: "success",
      });

      setPhone("");
      setBookingItems([createBookingDraftItem(bookableServices[0]?.id ?? "")]);
      setSelectedDate(undefined);
      setTime("");
    } catch (error) {
      toast({
        title: "Falha ao agendar",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível concluir o agendamento. Tente novamente.",
        variant: "error",
      });
      setFormError(
        error instanceof Error
          ? error.message
          : "Não foi possível concluir o agendamento. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-stone-900/80 border border-stone-800 rounded-3xl p-6 md:p-10 shadow-2xl">
      <h3 className="text-2xl md:text-3xl font-bold text-stone-100 mb-2">
        Agende seu horário
      </h3>
      <p className="text-stone-400 mb-6">
        Monte o atendimento, escolha o barbeiro e reserve tudo em sequência.
      </p>

      <form
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        {isBookingDisabled ? (
          <div className="md:col-span-2 rounded-2xl border border-amber-600/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Cadastros em falta: adicione serviços ativos e vincule ao menos um
            barbeiro no painel admin para liberar os agendamentos.
          </div>
        ) : null}
        {formError ? (
          <div className="md:col-span-2 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {formError}
          </div>
        ) : null}
        {lastBookingCount > 0 ? (
          <div className="md:col-span-2 rounded-[1.75rem] border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-emerald-100">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300/90">
                  {lastBookingCount > 1
                    ? "Agendamentos confirmados"
                    : "Agendamento confirmado"}
                </p>
                <p className="mt-2 text-sm text-emerald-100">
                  {lastBookingCount > 1
                    ? `${lastBookingCount} reservas foram criadas com o mesmo telefone para consulta posterior.`
                    : "Use o mesmo telefone informado na reserva para consultar ou cancelar depois."}
                </p>
              </div>
              <Link
                href="/meu-agendamento"
                className="inline-flex h-11 items-center justify-center rounded-full border border-emerald-400/30 bg-stone-950/40 px-5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-100 transition hover:bg-stone-950/70"
              >
                Consultar reserva
              </Link>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <label
            htmlFor="booking-phone"
            className="text-xs font-semibold uppercase tracking-widest text-stone-400"
          >
            Telefone de contato
          </label>
          <input
            id="booking-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="h-11 rounded-xl border border-stone-700 bg-stone-950 px-4 text-sm text-stone-100"
            placeholder="(11) 99999-0000"
            disabled={isBookingDisabled || isSubmitting}
          />
        </div>

        <div className="rounded-2xl border border-stone-800 bg-stone-950/70 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
            Resumo
          </p>
          <p className="mt-2 text-sm text-stone-200">
            {bookingItems.length} pessoa(s) •{" "}
            {formatDurationLabel(totalDuration || 0)}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Os atendimentos são reservados em sequência com o mesmo barbeiro.
          </p>
        </div>

        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-stone-100">
                Atendimentos
              </h4>
              <p className="text-xs text-stone-500">
                Adicione uma pessoa por linha. Ex.: pai e filho no mesmo horário
                de reserva.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddBookingItem}
              className="inline-flex items-center gap-2 rounded-full border border-stone-700 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-stone-300 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isBookingDisabled || isSubmitting}
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar pessoa
            </button>
          </div>

          {bookingItems.map((item, index) => {
            const selectedService = servicesById.get(item.serviceId);

            return (
              <div
                key={item.id}
                className="grid gap-4 rounded-2xl border border-stone-800 bg-stone-950/70 p-4 md:grid-cols-[1fr_1fr_auto]"
              >
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor={`booking-client-name-${item.id}`}
                    className="text-xs font-semibold uppercase tracking-widest text-stone-400"
                  >
                    Pessoa {index + 1}
                  </label>
                  <input
                    id={`booking-client-name-${item.id}`}
                    value={item.clientName}
                    onChange={(event) =>
                      updateBookingItem(item.id, {
                        clientName: event.target.value,
                      })
                    }
                    className="h-11 rounded-xl border border-stone-700 bg-stone-950 px-4 text-sm text-stone-100"
                    placeholder="Nome da pessoa"
                    disabled={isBookingDisabled || isSubmitting}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor={`booking-service-${item.id}`}
                    className="text-xs font-semibold uppercase tracking-widest text-stone-400"
                  >
                    Serviço
                  </label>
                  <div className="relative">
                    <select
                      id={`booking-service-${item.id}`}
                      value={item.serviceId}
                      onChange={(event) =>
                        updateBookingItem(item.id, {
                          serviceId: event.target.value,
                        })
                      }
                      className={selectClassName}
                      disabled={isBookingDisabled || isSubmitting}
                    >
                      {bookableServices.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} • R$ {service.price}
                        </option>
                      ))}
                    </select>
                    <SelectArrow />
                  </div>
                  {selectedService ? (
                    <span className="text-xs text-stone-500">
                      {selectedService.description} •{" "}
                      {formatDurationLabel(selectedService.duration)}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveBookingItem(item.id)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-stone-700 text-stone-400 transition hover:bg-stone-800 hover:text-stone-200 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={bookingItems.length === 1 || isSubmitting}
                    aria-label={`Remover pessoa ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="booking-barber"
            className="text-xs font-semibold uppercase tracking-widest text-stone-400"
          >
            Barbeiro {selectedBarber ? `• ${selectedBarber.name}` : ""}
          </label>
          <div className="relative">
            <select
              id="booking-barber"
              value={barberId}
              onChange={(event) => setBarberId(event.target.value)}
              className={selectClassName}
              disabled={
                isBookingDisabled ||
                isSubmitting ||
                availableBarbers.length === 0
              }
            >
              {availableBarbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>
            <SelectArrow />
          </div>
          {availableBarbers.length === 0 ? (
            <span className="text-xs text-red-400">
              Nenhum barbeiro atende todos os serviços selecionados.
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="booking-date"
            className="text-xs font-semibold uppercase tracking-widest text-stone-400"
          >
            Data
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="booking-date"
                type="button"
                variant="outline"
                className="h-11 w-full justify-start rounded-xl border border-stone-700 bg-stone-950 px-4 text-left font-normal text-stone-100 hover:bg-stone-800/80 hover:text-stone-100"
                disabled={
                  isBookingDisabled ||
                  isSubmitting ||
                  !barberId ||
                  totalDuration <= 0
                }
              >
                {selectedDate
                  ? format(selectedDate, "dd/MM/yyyy")
                  : "Selecione uma data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={isCalendarDateDisabled}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="booking-time"
            className="text-xs font-semibold uppercase tracking-widest text-stone-400"
          >
            Horário inicial
          </label>
          <div className="relative">
            <select
              id="booking-time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className={selectClassName}
              disabled={
                isBookingDisabled || availableSlots.length === 0 || isSubmitting
              }
            >
              {availableSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
            <SelectArrow />
          </div>
          {selectedDate && availableSlots.length === 0 ? (
            <span className="text-xs text-red-400">
              Não há horários disponíveis para esse barbeiro/data.
            </span>
          ) : (
            <span className="text-xs text-stone-500">
              Reserve {formatDurationLabel(totalDuration || 0)} no total.
            </span>
          )}
        </div>

        <button
          type="submit"
          className="md:col-span-2 mt-4 h-12 rounded-full bg-amber-500 text-xs font-bold uppercase tracking-widest text-stone-950 transition hover:bg-amber-400"
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? "Agendando..." : "Confirmar agendamento"}
        </button>
      </form>
    </div>
  );
}
