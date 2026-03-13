"use client";

import { useMemo, useState } from "react";
import type { Appointment, Barber, Service } from "@/types";

type FinanceRange = "day" | "week" | "month";
type FinanceStatus = "realized" | "forecast";

type FinanceAppointmentItem = {
  id: string;
  clientName: string;
  date: Date;
  barberId: string;
  barberName: string;
  serviceName: string;
  amount: number;
  status: FinanceStatus;
};

type FinancePeriodSummary = {
  key: FinanceRange;
  label: string;
  shortLabel: string;
  start: Date;
  end: Date;
  totalRevenue: number;
  realizedRevenue: number;
  forecastRevenue: number;
  appointmentsCount: number;
  realizedCount: number;
  forecastCount: number;
  averageTicket: number;
  missingServiceCount: number;
  items: FinanceAppointmentItem[];
};

type BarberRevenueRow = {
  barberId: string;
  barberName: string;
  totalRevenue: number;
  realizedRevenue: number;
  forecastRevenue: number;
  appointmentsCount: number;
};

type AdminFinancePanelProps = {
  appointments: Appointment[];
  services: Service[];
  barbers: Barber[];
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const financePeriods = [
  { key: "day", label: "Hoje", shortLabel: "Dia" },
  { key: "week", label: "Esta semana", shortLabel: "Semana" },
  { key: "month", label: "Este mês", shortLabel: "Mês" },
] as const;

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
  const end = new Date(startOfWeek(date));
  end.setDate(end.getDate() + 6);
  return endOfDay(end);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDateTime(date: Date) {
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRange(start: Date, end: Date) {
  const startLabel = start.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
  const endLabel = end.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });

  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
}

function isWithinRange(date: Date, start: Date, end: Date) {
  return date >= start && date <= end;
}

export default function AdminFinancePanel({
  appointments,
  services,
  barbers,
}: AdminFinancePanelProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<FinanceRange>("week");
  const now = new Date();

  const servicesById = useMemo(
    () => new Map(services.map((service) => [service.id, service])),
    [services],
  );
  const barbersById = useMemo(
    () => new Map(barbers.map((barber) => [barber.id, barber])),
    [barbers],
  );

  const summaries = useMemo<FinancePeriodSummary[]>(() => {
    return financePeriods.map((period) => {
      const start =
        period.key === "day"
          ? startOfDay(now)
          : period.key === "week"
            ? startOfWeek(now)
            : startOfMonth(now);
      const end =
        period.key === "day"
          ? endOfDay(now)
          : period.key === "week"
            ? endOfWeek(now)
            : endOfMonth(now);

      let totalRevenue = 0;
      let realizedRevenue = 0;
      let forecastRevenue = 0;
      let missingServiceCount = 0;
      let realizedCount = 0;
      let forecastCount = 0;

      const items = appointments
        .filter((appointment) => appointment.isActive)
        .map((appointment) => {
          const appointmentDate = new Date(appointment.date);

          if (!isWithinRange(appointmentDate, start, end)) {
            return null;
          }

          const service = servicesById.get(appointment.serviceId);
          const amount = service?.price ?? 0;
          const status: FinanceStatus =
            appointmentDate <= now ? "realized" : "forecast";

          totalRevenue += amount;
          if (status === "realized") {
            realizedRevenue += amount;
            realizedCount += 1;
          } else {
            forecastRevenue += amount;
            forecastCount += 1;
          }

          if (!service) {
            missingServiceCount += 1;
          }

          return {
            id: appointment.id,
            clientName: appointment.clientName,
            date: appointmentDate,
            barberId: appointment.barberId,
            barberName:
              barbersById.get(appointment.barberId)?.name ?? "Barbeiro",
            serviceName: service?.name ?? "Serviço indisponível",
            amount,
            status,
          };
        })
        .filter((item): item is FinanceAppointmentItem => item !== null)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      return {
        key: period.key,
        label: period.label,
        shortLabel: period.shortLabel,
        start,
        end,
        totalRevenue,
        realizedRevenue,
        forecastRevenue,
        appointmentsCount: items.length,
        realizedCount,
        forecastCount,
        averageTicket: items.length > 0 ? totalRevenue / items.length : 0,
        missingServiceCount,
        items,
      };
    });
  }, [appointments, barbersById, now, servicesById]);

  const selectedSummary =
    summaries.find((summary) => summary.key === selectedPeriod) ?? summaries[1];

  const barberRevenue = useMemo<BarberRevenueRow[]>(() => {
    const rowsByBarber = new Map<string, BarberRevenueRow>();

    for (const item of selectedSummary.items) {
      const row =
        rowsByBarber.get(item.barberId) ??
        ({
          barberId: item.barberId,
          barberName: item.barberName,
          totalRevenue: 0,
          realizedRevenue: 0,
          forecastRevenue: 0,
          appointmentsCount: 0,
        } satisfies BarberRevenueRow);

      row.totalRevenue += item.amount;
      row.appointmentsCount += 1;

      if (item.status === "realized") {
        row.realizedRevenue += item.amount;
      } else {
        row.forecastRevenue += item.amount;
      }

      rowsByBarber.set(item.barberId, row);
    }

    return Array.from(rowsByBarber.values()).sort(
      (left, right) => right.totalRevenue - left.totalRevenue,
    );
  }, [selectedSummary.items]);

  return (
    <section className="bg-stone-900/80 border border-stone-800 rounded-3xl p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-xl font-bold text-stone-100">Financeiro</h3>
          <p className="text-sm text-stone-500">
            Estimativa baseada nos agendamentos ativos e nos preços atuais dos
            serviços cadastrados.
          </p>
        </div>
        <div className="rounded-2xl border border-stone-800 bg-stone-950/70 px-4 py-3 text-sm text-stone-300">
          <span className="block text-[10px] uppercase tracking-[0.3em] text-stone-500">
            Base de cálculo
          </span>
          Cancelamentos ficam fora do total. Atendimentos futuros entram como
          previsto.
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {summaries.map((summary) => {
          const isActive = summary.key === selectedPeriod;

          return (
            <button
              type="button"
              key={summary.key}
              onClick={() => setSelectedPeriod(summary.key)}
              className={`rounded-3xl border p-5 text-left transition ${
                isActive
                  ? "border-amber-500 bg-amber-500/10 shadow-[0_0_0_1px_rgba(245,158,11,0.25)]"
                  : "border-stone-800 bg-stone-950/60 hover:border-stone-700"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">
                    {summary.shortLabel}
                  </p>
                  <h4 className="mt-2 text-2xl font-bold text-stone-100">
                    {formatCurrency(summary.totalRevenue)}
                  </h4>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${
                    isActive
                      ? "bg-amber-500 text-stone-950"
                      : "border border-stone-700 text-stone-300"
                  }`}
                >
                  {summary.appointmentsCount} ag.
                </span>
              </div>
              <p className="mt-3 text-xs text-stone-400">
                {formatRange(summary.start, summary.end)}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
                  <span className="block text-stone-400">Realizado</span>
                  <strong className="text-sm text-emerald-300">
                    {formatCurrency(summary.realizedRevenue)}
                  </strong>
                </div>
                <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-3 py-2">
                  <span className="block text-stone-400">Previsto</span>
                  <strong className="text-sm text-sky-300">
                    {formatCurrency(summary.forecastRevenue)}
                  </strong>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-stone-800 bg-stone-950/60 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">
                Resumo do período
              </p>
              <h4 className="mt-2 text-lg font-bold text-stone-100">
                {selectedSummary.label}
              </h4>
            </div>
            <span className="text-xs text-stone-500">
              {formatRange(selectedSummary.start, selectedSummary.end)}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-4">
              <span className="text-xs text-stone-500">Receita total</span>
              <strong className="mt-2 block text-2xl text-stone-100">
                {formatCurrency(selectedSummary.totalRevenue)}
              </strong>
            </div>
            <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-4">
              <span className="text-xs text-stone-500">Ticket médio</span>
              <strong className="mt-2 block text-2xl text-stone-100">
                {formatCurrency(selectedSummary.averageTicket)}
              </strong>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <span className="text-xs text-emerald-200">
                Realizado até agora
              </span>
              <strong className="mt-2 block text-2xl text-emerald-300">
                {formatCurrency(selectedSummary.realizedRevenue)}
              </strong>
              <p className="mt-1 text-xs text-emerald-100/80">
                {selectedSummary.realizedCount} atendimento(s)
              </p>
            </div>
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4">
              <span className="text-xs text-sky-200">Ainda previsto</span>
              <strong className="mt-2 block text-2xl text-sky-300">
                {formatCurrency(selectedSummary.forecastRevenue)}
              </strong>
              <p className="mt-1 text-xs text-sky-100/80">
                {selectedSummary.forecastCount} atendimento(s)
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-stone-800 bg-stone-950/60 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">
                Por barbeiro
              </p>
              <h4 className="mt-2 text-lg font-bold text-stone-100">
                Quem mais faturou no período
              </h4>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {barberRevenue.length === 0 ? (
              <p className="text-sm text-stone-500">
                Nenhum agendamento encontrado para este período.
              </p>
            ) : (
              barberRevenue.map((row) => (
                <div
                  key={row.barberId}
                  className="rounded-2xl border border-stone-800 bg-stone-900/80 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-100">
                        {row.barberName}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        {row.appointmentsCount} atendimento(s)
                      </p>
                    </div>
                    <strong className="text-base text-stone-100">
                      {formatCurrency(row.totalRevenue)}
                    </strong>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-2xl border border-stone-800 px-3 py-2 text-stone-300">
                      <span className="block text-stone-500">Realizado</span>
                      {formatCurrency(row.realizedRevenue)}
                    </div>
                    <div className="rounded-2xl border border-stone-800 px-3 py-2 text-stone-300">
                      <span className="block text-stone-500">Previsto</span>
                      {formatCurrency(row.forecastRevenue)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-stone-800 bg-stone-950/60 p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">
              Movimentação
            </p>
            <h4 className="mt-2 text-lg font-bold text-stone-100">
              Atendimentos que compõem o total
            </h4>
          </div>
          <span className="text-xs text-stone-500">
            {selectedSummary.items.length} registro(s) em{" "}
            {selectedSummary.label.toLowerCase()}
          </span>
        </div>

        {selectedSummary.items.length === 0 ? (
          <p className="mt-5 text-sm text-stone-500">
            Nenhum agendamento encontrado no período selecionado.
          </p>
        ) : (
          <div className="mt-5 max-h-[420px] space-y-3 overflow-y-auto pr-1 scrollbar-premium">
            {selectedSummary.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-stone-800 bg-stone-900/80 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-stone-100">
                      {item.clientName}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${
                        item.status === "realized"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-sky-500/15 text-sky-300"
                      }`}
                    >
                      {item.status === "realized" ? "Realizado" : "Previsto"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-400">
                    {item.serviceName} com {item.barberName}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {formatDateTime(item.date)}
                  </p>
                </div>
                <strong className="text-lg text-stone-100">
                  {formatCurrency(item.amount)}
                </strong>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedSummary.missingServiceCount > 0 ? (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {selectedSummary.missingServiceCount} agendamento(s) do período estão
          sem serviço vinculado na tabela atual e foram contabilizados com valor
          zero.
        </div>
      ) : null}
    </section>
  );
}
