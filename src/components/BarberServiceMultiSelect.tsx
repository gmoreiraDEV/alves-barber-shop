"use client";

import { Check, ChevronDown, Scissors, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { Service } from "../types";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

type BarberServiceMultiSelectProps = {
  services: Service[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function BarberServiceMultiSelect({
  services,
  selectedIds,
  onChange,
  disabled = false,
}: BarberServiceMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedServices = useMemo(
    () => services.filter((service) => selectedIds.includes(service.id)),
    [services, selectedIds],
  );

  const filteredServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...services]
      .filter((service) => {
        if (!normalizedQuery) return true;

        return (
          service.name.toLowerCase().includes(normalizedQuery) ||
          service.description.toLowerCase().includes(normalizedQuery)
        );
      })
      .sort((a, b) => {
        const aSelected = selectedIds.includes(a.id) ? 1 : 0;
        const bSelected = selectedIds.includes(b.id) ? 1 : 0;

        if (aSelected !== bSelected) return bSelected - aSelected;
        if (a.isActive !== b.isActive)
          return Number(b.isActive) - Number(a.isActive);

        return a.name.localeCompare(b.name, "pt-BR");
      });
  }, [services, query, selectedIds]);

  const previewServices = selectedServices.slice(0, 3);
  const hiddenCount = Math.max(
    selectedServices.length - previewServices.length,
    0,
  );

  const toggleService = (serviceId: string) => {
    if (selectedIds.includes(serviceId)) {
      onChange(selectedIds.filter((id) => id !== serviceId));
      return;
    }

    onChange([...selectedIds, serviceId]);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled || services.length === 0}
          className={cn(
            "group w-full rounded-[1.4rem] border p-4 text-left transition-all",
            "border-[#4a3b22] bg-[linear-gradient(180deg,rgba(31,37,45,0.98),rgba(17,22,28,0.98))]",
            "shadow-[0_20px_60px_rgba(0,0,0,0.35)]",
            "hover:border-[#c9a227] hover:shadow-[0_24px_70px_rgba(0,0,0,0.45)]",
            "disabled:cursor-not-allowed disabled:border-slate-700 disabled:opacity-60",
          )}
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c9a227]">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#6d572b] bg-[#231c11] text-[#facc15]">
                  <Scissors className="h-3.5 w-3.5" />
                </span>
                Multi-select de serviços
              </div>

              {selectedServices.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700/80 bg-black/10 px-4 py-3 text-sm text-slate-400">
                  Escolha os serviços que este barbeiro executa.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {previewServices.map((service) => (
                    <span
                      key={service.id}
                      className="inline-flex items-center gap-2 rounded-full bg-[#facc15] px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-[0_10px_30px_rgba(250,204,21,0.24)]"
                    >
                      {service.name}
                    </span>
                  ))}
                  {hiddenCount > 0 ? (
                    <span className="inline-flex items-center rounded-full border border-[#705823] bg-[#2a2113] px-3 py-1.5 text-xs font-semibold text-[#f4d06f]">
                      +{hiddenCount}
                    </span>
                  ) : null}
                </div>
              )}

              <div className="mt-3 text-xs text-slate-500">
                {selectedServices.length > 0
                  ? `${selectedServices.length} serviço${selectedServices.length > 1 ? "s" : ""} vinculado${selectedServices.length > 1 ? "s" : ""}`
                  : "Opcional no cadastro. Você pode configurar agora ou depois."}
              </div>
            </div>

            <span
              className={cn(
                "mt-1 flex h-10 w-10 items-center justify-center rounded-full border transition-all",
                open
                  ? "rotate-180 border-[#c9a227] bg-[#2b220f] text-[#facc15]"
                  : "border-slate-700 bg-[#161b21] text-slate-400 group-hover:border-[#7b622d] group-hover:text-[#f4d06f]",
              )}
            >
              <ChevronDown className="h-4 w-4" />
            </span>
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] rounded-[1.6rem] border border-[#5a4827] bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.08),transparent_30%),linear-gradient(180deg,rgba(31,37,45,0.99),rgba(14,18,23,0.99))] p-4 text-slate-100 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-100">
              Serviços atendidos
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Selecione o que este barbeiro pode executar.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange(services.map((service) => service.id))}
              className="rounded-full border border-[#6d572b] bg-[#261f12] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f4d06f] transition hover:border-[#c9a227] hover:text-[#facc15]"
              disabled={disabled || services.length === 0}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              className="rounded-full border border-slate-700 bg-[#161b21] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
              disabled={disabled || selectedIds.length === 0}
            >
              Limpar
            </button>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar serviço"
            className="h-11 w-full rounded-2xl border border-slate-700 bg-[#0f1419] pl-11 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-[#c9a227]"
          />
        </div>

        {selectedServices.length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-[#40331f] bg-black/20 p-2.5">
            {selectedServices.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => toggleService(service.id)}
                className="inline-flex items-center gap-2 rounded-full bg-[#facc15] px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-[0_10px_30px_rgba(250,204,21,0.2)] transition hover:brightness-95"
              >
                {service.name}
                <X className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        ) : null}

        {filteredServices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-[#11161c] px-4 py-6 text-center text-sm text-slate-400">
            Nenhum serviço encontrado para essa busca.
          </div>
        ) : (
          <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {filteredServices.map((service) => {
              const isSelected = selectedIds.includes(service.id);

              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => toggleService(service.id)}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border px-3 py-3 text-left transition",
                    isSelected
                      ? "border-[#c9a227] bg-[linear-gradient(180deg,rgba(250,204,21,0.14),rgba(250,204,21,0.05))] shadow-[0_16px_40px_rgba(250,204,21,0.08)]"
                      : "border-slate-700 bg-[#11161c] hover:border-[#7b622d] hover:bg-[#151b22]",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
                      isSelected
                        ? "border-[#facc15] bg-[#facc15] text-slate-950"
                        : "border-slate-600 bg-transparent text-transparent",
                    )}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-100">
                        {service.name}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]",
                          service.isActive
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-slate-500/10 text-slate-400",
                        )}
                      >
                        {service.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs text-slate-400">
                      {formatCurrency(service.price)} • {service.duration} min
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
