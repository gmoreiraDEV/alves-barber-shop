"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type LoadResult, loadHomeData } from "@/lib/app-data";
import type { AppointmentRequest, BookAppointmentResult } from "@/types";
import BookingForm from "./BookingForm";

type LoadState = "idle" | "loading" | "error";

const emptyLoadResult: LoadResult = {
  services: [],
  barbers: [],
  appointments: [],
  absences: [],
  workingHours: [],
};

export default function HomePage() {
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [data, setData] = useState<LoadResult>(emptyLoadResult);

  const loadData = useCallback(async () => {
    setLoadState("loading");

    try {
      const result = await loadHomeData();
      setData(result);
      setLoadState("idle");
    } catch (_error) {
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleBook = async (
    payload: AppointmentRequest,
  ): Promise<BookAppointmentResult> => {
    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(result?.error ?? "Falha ao agendar");
    }

    const result = (await response.json()) as BookAppointmentResult;

    try {
      await loadData();
    } catch (_error) {
      // Preserve the booking confirmation even if the refresh fails.
    }

    return result;
  };

  const homeHeroText = useMemo(
    () => ({
      titlePrefix: "Onde a tradição encontra o ",
      titleHighlight: "estilo",
      subtitle:
        "Cortes de cabelo, barbas de mestre e um ambiente premium desenhado para o homem moderno.",
    }),
    [],
  );

  return (
    <>
      {loadState === "error" ? (
        <div className="max-w-4xl mx-auto px-4 py-12 text-sm text-red-400">
          Não foi possível carregar os dados. Tente novamente.
        </div>
      ) : null}

      <div className="relative isolate flex flex-col">
        <section className="relative h-100 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1600"
              className="w-full h-full object-cover opacity-20"
              alt="Background"
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-stone-950/0 via-stone-950/60 to-stone-950"></div>
          </div>
          <div className="relative z-10 text-center px-4">
            <h2 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight text-stone-100">
              {homeHeroText.titlePrefix}
              <span className="text-amber-500">
                {homeHeroText.titleHighlight}
              </span>
            </h2>
            <p className="text-stone-400 max-w-xl mx-auto text-lg">
              {homeHeroText.subtitle}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#booking"
                className="inline-flex h-11 items-center justify-center rounded-full bg-amber-500 px-6 text-xs font-bold uppercase tracking-[0.24em] text-stone-950 transition hover:bg-amber-400"
              >
                Agendar agora
              </a>
              <Link
                href="/meu-agendamento"
                className="inline-flex h-11 items-center justify-center rounded-full border border-stone-700 px-6 text-xs font-bold uppercase tracking-[0.24em] text-stone-100 transition hover:bg-stone-800"
              >
                Consultar agendamento
              </Link>
            </div>
          </div>
        </section>
        <section
          id="booking"
          className="relative z-20 -mt-8 px-4 pb-20 md:-mt-16"
        >
          <BookingForm
            services={data.services.filter((service) => service.isActive)}
            barbers={data.barbers}
            appointments={data.appointments}
            absences={data.absences}
            workingHours={data.workingHours}
            onBook={handleBook}
          />
        </section>
      </div>
    </>
  );
}
