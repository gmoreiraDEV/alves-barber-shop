"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { type LoadResult, loadHomeData } from "@/lib/app-data";
import type { Appointment } from "@/types";
import BookingForm from "./BookingForm";

type LoadState = "idle" | "loading" | "error";

const emptyLoadResult: LoadResult = {
  services: [],
  barbers: [],
  appointments: [],
  absences: [],
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
    payload: Omit<Appointment, "id" | "isActive" | "deletedAt">,
  ) => {
    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error("Falha ao agendar");
    }

    await loadData();
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

      <div className="flex flex-col">
        <section className="relative h-[400px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1600"
              className="w-full h-full object-cover opacity-20"
              alt="Background"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-stone-950/0 via-stone-950/60 to-stone-950"></div>
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
          </div>
        </section>
        <section className="px-4 -mt-20 pb-20">
          <BookingForm
            services={data.services.filter((service) => service.isActive)}
            barbers={data.barbers}
            appointments={data.appointments}
            absences={data.absences}
            onBook={handleBook}
          />
        </section>
      </div>
    </>
  );
}
