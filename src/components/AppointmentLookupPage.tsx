"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarClock,
  ClipboardCheck,
  Scissors,
  Search,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { PublicAppointmentDetails } from "@/types";
import { useToast } from "./ui/toast";

const inputClassName =
  "h-12 w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 text-sm text-stone-100 placeholder:text-stone-500";

function getStatusMeta(status: PublicAppointmentDetails["status"]) {
  switch (status) {
    case "scheduled":
      return {
        label: "Confirmado",
        className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
      };
    case "completed":
      return {
        label: "Concluído",
        className: "border-sky-500/30 bg-sky-500/10 text-sky-200",
      };
    default:
      return {
        label: "Cancelado",
        className: "border-red-500/30 bg-red-500/10 text-red-200",
      };
  }
}

function formatAppointmentDate(date: string) {
  return format(new Date(date), "EEEE, dd 'de' MMMM 'às' HH:mm", {
    locale: ptBR,
  });
}

export default function AppointmentLookupPage() {
  const [phone, setPhone] = useState("");
  const [confirmedPhone, setConfirmedPhone] = useState("");
  const [results, setResults] = useState<PublicAppointmentDetails[]>([]);
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { toast } = useToast();

  const resultCountLabel =
    results.length === 1
      ? "1 agendamento encontrado"
      : `${results.length} agendamentos encontrados`;

  const handleLookup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!phone.trim()) {
      setFormError("Informe o telefone usado no agendamento.");
      return;
    }

    try {
      setIsLoading(true);
      setFormError("");

      const response = await fetch("/api/appointments/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setResults([]);
        setConfirmedPhone("");
        setFormError(
          payload.error ?? "Não foi possível localizar o agendamento.",
        );
        return;
      }

      setConfirmedPhone(phone);
      setResults(payload as PublicAppointmentDetails[]);
    } catch (_error) {
      setResults([]);
      setConfirmedPhone("");
      setFormError("Não foi possível consultar agora. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    const appointment = results.find((item) => item.id === appointmentId);
    if (!appointment) {
      return;
    }

    if (
      !window.confirm(
        "Deseja cancelar este agendamento? Essa ação não pode ser desfeita.",
      )
    ) {
      return;
    }

    try {
      setCancellingId(appointmentId);

      const response = await fetch("/api/appointments/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: confirmedPhone,
          appointmentId,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        toast({
          title: "Falha ao cancelar",
          description:
            payload.error ?? "Não foi possível cancelar o agendamento.",
          variant: "error",
        });
        return;
      }

      setResults((current) =>
        current.map((item) =>
          item.id === appointmentId
            ? (payload as PublicAppointmentDetails)
            : item,
        ),
      );
      toast({
        title: "Agendamento cancelado",
        description: "Seu horário foi cancelado com sucesso.",
        variant: "success",
      });
    } catch (_error) {
      toast({
        title: "Falha ao cancelar",
        description: "Não foi possível cancelar o agendamento.",
        variant: "error",
      });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="relative overflow-hidden">
      <section className="relative overflow-hidden border-b border-stone-900 bg-stone-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_38%),linear-gradient(180deg,_rgba(28,25,23,0.15),_rgba(12,10,9,0.92))]" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 md:flex-row md:items-end md:justify-between md:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200">
              Consulta pública
            </span>
            <h2 className="mt-5 text-4xl font-black tracking-tight text-stone-100 md:text-6xl">
              Consulte ou cancele seu agendamento
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-stone-400 md:text-base">
              Digite apenas o telefone informado na reserva. A busca aceita
              formatos como <span className="text-stone-200">+55</span>,{" "}
              <span className="text-stone-200">55</span>,{" "}
              <span className="text-stone-200">011</span> ou só o número local.
            </p>
          </div>

          <div className="grid gap-3 rounded-[2rem] border border-stone-800/80 bg-stone-900/80 p-5 shadow-2xl md:min-w-[20rem]">
            <div className="flex items-center gap-3 text-stone-200">
              <ShieldCheck className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-semibold">
                Busca protegida pelo telefone informado
              </span>
            </div>
            <div className="flex items-center gap-3 text-stone-400">
              <ClipboardCheck className="h-5 w-5 text-stone-500" />
              <span className="text-sm">
                Encontramos os agendamentos mesmo com variações de DDI e
                prefixo.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <form
          className="rounded-[2rem] border border-stone-800 bg-stone-900/80 p-6 shadow-2xl"
          onSubmit={handleLookup}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-stone-100">
                Encontrar agendamento
              </h3>
              <p className="text-sm text-stone-400">
                Informe o telefone usado na reserva.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {formError ? (
              <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {formError}
              </div>
            ) : null}

            <div className="space-y-2">
              <label
                htmlFor="lookup-phone"
                className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500"
              >
                Telefone
              </label>
              <input
                id="lookup-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className={inputClassName}
                placeholder="+55 11 99999-0000"
                autoComplete="tel"
                disabled={isLoading || cancellingId !== null}
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-amber-500 px-6 text-xs font-bold uppercase tracking-[0.28em] text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading || cancellingId !== null}
          >
            {isLoading ? "Buscando..." : "Consultar agora"}
          </button>

          <p className="mt-4 text-xs leading-5 text-stone-500">
            Você pode digitar com ou sem{" "}
            <span className="text-stone-300">+</span>, com ou sem{" "}
            <span className="text-stone-300">55</span> e também com prefixo{" "}
            <span className="text-stone-300">0</span>. Se precisar, faça uma
            nova reserva em{" "}
            <Link href="/" className="text-amber-300 hover:text-amber-200">
              nossa página inicial
            </Link>
            .
          </p>
        </form>

        <div className="rounded-[2rem] border border-stone-800 bg-stone-900/60 p-6 shadow-2xl">
          {results.length > 0 ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 border-b border-stone-800 pb-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                    Resultado
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-stone-100">
                    {resultCountLabel}
                  </h3>
                  <p className="mt-1 text-sm text-stone-400">
                    Telefone confirmado: {results[0]?.phoneMasked}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {results.map((appointment) => {
                  const statusMeta = getStatusMeta(appointment.status);

                  return (
                    <div
                      key={appointment.id}
                      className="rounded-[1.75rem] border border-stone-800 bg-stone-950/60 p-5"
                    >
                      <div className="flex flex-col gap-4 border-b border-stone-800 pb-5 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                            Reserva localizada
                          </p>
                          <h3 className="mt-2 text-2xl font-bold text-stone-100">
                            {appointment.clientName}
                          </h3>
                        </div>

                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4">
                          <div className="flex items-center gap-2 text-stone-500">
                            <CalendarClock className="h-4 w-4 text-amber-400" />
                            <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                              Data e hora
                            </span>
                          </div>
                          <p className="mt-3 text-base font-semibold capitalize text-stone-100">
                            {formatAppointmentDate(appointment.date)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4">
                          <div className="flex items-center gap-2 text-stone-500">
                            <Scissors className="h-4 w-4 text-amber-400" />
                            <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                              Serviço
                            </span>
                          </div>
                          <p className="mt-3 text-base font-semibold text-stone-100">
                            {appointment.serviceName}
                          </p>
                          <p className="mt-1 text-sm text-stone-400">
                            {appointment.serviceDuration} min • R${" "}
                            {appointment.servicePrice}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4">
                          <div className="flex items-center gap-2 text-stone-500">
                            <UserRound className="h-4 w-4 text-amber-400" />
                            <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                              Barbeiro
                            </span>
                          </div>
                          <p className="mt-3 text-base font-semibold text-stone-100">
                            {appointment.barberName}
                          </p>
                        </div>
                      </div>

                      {appointment.status === "canceled" &&
                      appointment.canceledAt ? (
                        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                          Este agendamento foi cancelado em{" "}
                          {format(
                            new Date(appointment.canceledAt),
                            "dd/MM/yyyy 'às' HH:mm",
                          )}
                          .
                        </div>
                      ) : null}

                      <div className="mt-5 flex flex-col gap-3 border-t border-stone-800 pt-4 sm:flex-row">
                        {appointment.canCancel ? (
                          <button
                            type="button"
                            onClick={() => handleCancel(appointment.id)}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-5 text-xs font-bold uppercase tracking-[0.18em] text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={
                              cancellingId === appointment.id || isLoading
                            }
                          >
                            <XCircle className="h-4 w-4" />
                            {cancellingId === appointment.id
                              ? "Cancelando..."
                              : "Cancelar agendamento"}
                          </button>
                        ) : null}

                        <Link
                          href="/"
                          className="inline-flex h-11 items-center justify-center rounded-full border border-stone-700 px-5 text-xs font-bold uppercase tracking-[0.18em] text-stone-200 transition hover:bg-stone-800"
                        >
                          Fazer novo agendamento
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                  Resultado
                </p>
                <h3 className="mt-2 text-2xl font-bold text-stone-100">
                  Seus detalhes aparecerão aqui
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-6 text-stone-400">
                  Após informar o telefone da reserva, você verá os agendamentos
                  vinculados a esse número, com status, horário, serviço,
                  barbeiro responsável e a opção de cancelar quando ainda
                  estiver ativo.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    1. Reserve
                  </p>
                  <p className="mt-2 text-sm text-stone-300">
                    Conclua o agendamento normalmente na home.
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    2. Consulte pelo telefone
                  </p>
                  <p className="mt-2 text-sm text-stone-300">
                    O sistema aceita o número com ou sem DDI e prefixos.
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    3. Cancele se precisar
                  </p>
                  <p className="mt-2 text-sm text-stone-300">
                    Os horários ativos podem ser cancelados pela própria tela.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
