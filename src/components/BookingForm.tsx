"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import type { Appointment, Barber, BarberAbsence, Service } from "../types";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { useToast } from "./ui/toast";

type BookingFormProps = {
  services: Service[];
  barbers: Barber[];
  appointments: Appointment[];
  absences: BarberAbsence[];
  onBook: (data: Omit<Appointment, "id" | "isActive" | "deletedAt">) => Promise<void>;
};

const OPEN_MINUTES = 8 * 60;
const CLOSE_MINUTES = 21 * 60;

function toTimeLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function toMinutes(label: string) {
  const [h, m] = label.split(":").map((value) => Number(value));
  return h * 60 + m;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export default function BookingForm({
  services,
  barbers,
  appointments,
  absences,
  onBook,
}: BookingFormProps) {
  const isBookingDisabled = services.length === 0 || barbers.length === 0;
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [barberId, setBarberId] = useState(barbers[0]?.id ?? "");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId),
    [services, serviceId]
  );

  const serviceDuration = selectedService?.duration ?? 30;

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let minutes = OPEN_MINUTES; minutes + serviceDuration <= CLOSE_MINUTES; minutes += serviceDuration) {
      slots.push(toTimeLabel(minutes));
    }
    return slots;
  }, [serviceDuration]);

  useEffect(() => {
    if (!serviceId && services[0]?.id) {
      setServiceId(services[0].id);
    }
  }, [serviceId, services]);

  useEffect(() => {
    if (!barberId && barbers[0]?.id) {
      setBarberId(barbers[0].id);
    }
  }, [barberId, barbers]);

  const availableSlots = useMemo(() => {
    if (!selectedDate || !barberId) {
      return timeSlots;
    }

    const now = new Date();
    const dateStart = new Date(selectedDate);
    dateStart.setHours(0, 0, 0, 0);

    const dateEnd = new Date(selectedDate);
    dateEnd.setHours(23, 59, 59, 999);

    const barberAppointments = appointments.filter(
      (appointment) => appointment.barberId === barberId
    );

    const barberAbsences = absences.filter((absence) => absence.barberId === barberId);

    return timeSlots.filter((slot) => {
      const slotStart = new Date(selectedDate);
      const minutes = toMinutes(slot);
      slotStart.setHours(0, minutes, 0, 0);
      slotStart.setMinutes(minutes);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotStart.getMinutes() + serviceDuration);

      if (slotStart < now) {
        return false;
      }

      for (const appointment of barberAppointments) {
        const appointmentStart = new Date(appointment.date);
        const appointmentEnd = new Date(appointmentStart);
        const appointmentService = services.find((service) => service.id === appointment.serviceId);
        const duration = appointmentService?.duration ?? serviceDuration;
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
  }, [appointments, absences, barberId, selectedDate, serviceDuration, services, timeSlots]);

  useEffect(() => {
    if (availableSlots.length > 0 && !availableSlots.includes(time)) {
      setTime(availableSlots[0]);
    }
  }, [time, availableSlots]);

  const isFormValid =
    !isBookingDisabled &&
    clientName.trim().length > 0 &&
    phone.trim().length > 0 &&
    serviceId.length > 0 &&
    barberId.length > 0 &&
    !!selectedDate &&
    time.length > 0 &&
    availableSlots.length > 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      if (isBookingDisabled) {
        setFormError("Cadastre serviços e barbeiros antes de agendar.");
      } else if (!clientName.trim()) {
        setFormError("Informe seu nome.");
      } else if (!phone.trim()) {
        setFormError("Informe seu telefone.");
      } else if (!serviceId) {
        setFormError("Selecione um serviço.");
      } else if (!barberId) {
        setFormError("Selecione um barbeiro.");
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
      await onBook({
        clientName,
        phone,
        serviceId,
        barberId,
        date: dateTime.toISOString(),
      });

      toast({
        title: "Agendamento confirmado",
        description: "Seu horário foi reservado com sucesso.",
        variant: "success",
      });

      setClientName("");
      setPhone("");
      setSelectedDate(undefined);
      setTime("");
    } catch (error) {
      toast({
        title: "Falha ao agendar",
        description: "Não foi possível concluir o agendamento. Tente novamente.",
        variant: "error",
      });
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
        Escolha o serviço, o barbeiro e o horário ideal.
      </p>

      <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
        {isBookingDisabled ? (
          <div className="md:col-span-2 rounded-2xl border border-amber-600/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Cadastros em falta: adicione serviços e barbeiros no painel admin para liberar os
            agendamentos.
          </div>
        ) : null}
        {formError ? (
          <div className="md:col-span-2 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {formError}
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-widest text-stone-400 font-semibold">
            Nome
          </label>
          <input
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            className="h-11 rounded-xl border border-stone-700 bg-stone-950 px-4 text-sm text-stone-100"
            placeholder="Seu nome"
            disabled={isBookingDisabled || isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-widest text-stone-400 font-semibold">
            Telefone
          </label>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="h-11 rounded-xl border border-stone-700 bg-stone-950 px-4 text-sm text-stone-100"
            placeholder="(11) 99999-0000"
            disabled={isBookingDisabled || isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-widest text-stone-400 font-semibold">
            Serviço
          </label>
          <select
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
            className="h-11 rounded-xl border border-stone-700 bg-stone-950 px-4 text-sm text-stone-100"
            disabled={isBookingDisabled || isSubmitting}
          >
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} • R$ {service.price}
              </option>
            ))}
          </select>
          {selectedService ? (
            <span className="text-xs text-stone-500">{selectedService.description}</span>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-widest text-stone-400 font-semibold">
            Barbeiro
          </label>
          <select
            value={barberId}
            onChange={(event) => setBarberId(event.target.value)}
            className="h-11 rounded-xl border border-stone-700 bg-stone-950 px-4 text-sm text-stone-100"
            disabled={isBookingDisabled || isSubmitting}
          >
            {barbers.map((barber) => (
              <option key={barber.id} value={barber.id}>
                {barber.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-widest text-stone-400 font-semibold">
            Data
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-11 justify-start px-4 text-left font-normal text-stone-200"
                disabled={isBookingDisabled || isSubmitting}
              >
                {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Selecione uma data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-widest text-stone-400 font-semibold">
            Horário
          </label>
          <select
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="h-11 rounded-xl border border-stone-700 bg-stone-950 px-4 text-sm text-stone-100"
            disabled={isBookingDisabled || availableSlots.length === 0 || isSubmitting}
          >
            {availableSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
          {selectedDate && availableSlots.length === 0 ? (
            <span className="text-xs text-red-400">
              Não há horários disponíveis para esse barbeiro/data.
            </span>
          ) : null}
        </div>

        <button
          type="submit"
          className="md:col-span-2 mt-4 h-12 rounded-full bg-amber-500 text-stone-950 font-bold uppercase tracking-widest text-xs hover:bg-amber-400 transition"
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? "Agendando..." : "Confirmar agendamento"}
        </button>
      </form>
    </div>
  );
}
