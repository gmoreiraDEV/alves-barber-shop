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
import { useMemo, useState } from "react";
import type { PublicAppointmentDetails } from "@/types";
import { useToast } from "./ui/toast";

const inputClassName =
  "h-12 w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 text-sm text-stone-100 placeholder:text-stone-500";

function formatPublicCode(code: string) {
  return (
    code
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .match(/.{1,4}/g)
      ?.join(" ")
      .trim() ?? code
  );
}

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

type AppointmentLookupPageProps = {
  initialCode?: string;
};

export default function AppointmentLookupPage({
  initialCode = "",
}: AppointmentLookupPageProps) {
  const [phone, setPhone] = useState("");
  const [publicCode, setPublicCode] = useState(initialCode.toUpperCase());
  const [confirmedPhone, setConfirmedPhone] = useState("");
  const [result, setResult] = useState<PublicAppointmentDetails | null>(null);
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();

  const statusMeta = useMemo(
    () => (result ? getStatusMeta(result.status) : null),
    [result],
  );

  const formattedDate = useMemo(() => {
    if (!result) {
      return "";
    }

    return format(new Date(result.date), "EEEE, dd 'de' MMMM 'às' HH:mm", {
      locale: ptBR,
    });
  }, [result]);

  const handleLookup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!phone.trim() || !publicCode.trim()) {
      setFormError("Informe o telefone e o código do agendamento.");
      return;
    }

    try {
      setIsLoading(true);
      setFormError("");

      const response = await fetch("/api/appointments/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, publicCode }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setResult(null);
        setConfirmedPhone("");
        setFormError(
          payload.error ?? "Não foi possível localizar o agendamento.",
        );
        return;
      }

      setConfirmedPhone(phone);
      setResult(payload);
    } catch (_error) {
      setResult(null);
      setConfirmedPhone("");
      setFormError("Não foi possível consultar agora. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!result) {
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
      setIsCancelling(true);

      const response = await fetch("/api/appointments/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: confirmedPhone,
          publicCode: result.publicCode,
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

      setResult(payload);
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
      setIsCancelling(false);
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
              Use o telefone informado na reserva e o código do agendamento para
              acompanhar o horário com segurança.
            </p>
          </div>

          <div className="grid gap-3 rounded-[2rem] border border-stone-800/80 bg-stone-900/80 p-5 shadow-2xl md:min-w-[20rem]">
            <div className="flex items-center gap-3 text-stone-200">
              <ShieldCheck className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-semibold">
                Busca protegida por telefone e código
              </span>
            </div>
            <div className="flex items-center gap-3 text-stone-400">
              <ClipboardCheck className="h-5 w-5 text-stone-500" />
              <span className="text-sm">
                O código é exibido ao concluir o agendamento.
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
                Preencha os dados usados na reserva.
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
                placeholder="(11) 99999-0000"
                autoComplete="tel"
                disabled={isLoading || isCancelling}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="lookup-code"
                className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500"
              >
                Código do agendamento
              </label>
              <input
                id="lookup-code"
                value={publicCode}
                onChange={(event) =>
                  setPublicCode(event.target.value.toUpperCase())
                }
                className={`${inputClassName} font-mono tracking-[0.22em] uppercase`}
                placeholder="AB12 CD34 EF56"
                autoCapitalize="characters"
                disabled={isLoading || isCancelling}
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-amber-500 px-6 text-xs font-bold uppercase tracking-[0.28em] text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading || isCancelling}
          >
            {isLoading ? "Buscando..." : "Consultar agora"}
          </button>

          <p className="mt-4 text-xs leading-5 text-stone-500">
            Ainda não tem o código? Ele aparece na confirmação do agendamento.
            Se precisar, faça uma nova reserva em{" "}
            <Link href="/" className="text-amber-300 hover:text-amber-200">
              nossa página inicial
            </Link>
            .
          </p>
        </form>

        <div className="rounded-[2rem] border border-stone-800 bg-stone-900/60 p-6 shadow-2xl">
          {result ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 border-b border-stone-800 pb-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                    Reserva localizada
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-stone-100">
                    {result.clientName}
                  </h3>
                  <p className="mt-1 text-sm text-stone-400">
                    Telefone confirmado: {result.phoneMasked}
                  </p>
                </div>

                {statusMeta ? (
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusMeta.className}`}
                  >
                    {statusMeta.label}
                  </span>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4">
                  <div className="flex items-center gap-2 text-stone-500">
                    <CalendarClock className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                      Data e hora
                    </span>
                  </div>
                  <p className="mt-3 text-base font-semibold capitalize text-stone-100">
                    {formattedDate}
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4">
                  <div className="flex items-center gap-2 text-stone-500">
                    <ClipboardCheck className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                      Código
                    </span>
                  </div>
                  <p className="mt-3 font-mono text-base font-semibold tracking-[0.22em] text-stone-100">
                    {formatPublicCode(result.publicCode)}
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
                    {result.serviceName}
                  </p>
                  <p className="mt-1 text-sm text-stone-400">
                    {result.serviceDuration} min • R$ {result.servicePrice}
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
                    {result.barberName}
                  </p>
                </div>
              </div>

              {result.status === "canceled" && result.canceledAt ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  Este agendamento foi cancelado em{" "}
                  {format(new Date(result.canceledAt), "dd/MM/yyyy 'às' HH:mm")}
                  .
                </div>
              ) : null}

              <div className="flex flex-col gap-3 border-t border-stone-800 pt-4 sm:flex-row">
                {result.canCancel ? (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-5 text-xs font-bold uppercase tracking-[0.18em] text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isCancelling || isLoading}
                  >
                    <XCircle className="h-4 w-4" />
                    {isCancelling ? "Cancelando..." : "Cancelar agendamento"}
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
                  Após informar o telefone e o código da reserva, você verá o
                  horário, o serviço, o barbeiro responsável e poderá cancelar o
                  agendamento se ele ainda estiver ativo.
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
                    2. Guarde o código
                  </p>
                  <p className="mt-2 text-sm text-stone-300">
                    O sistema gera um código exclusivo para sua reserva.
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    3. Consulte quando quiser
                  </p>
                  <p className="mt-2 text-sm text-stone-300">
                    Use telefone e código para verificar ou cancelar.
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
