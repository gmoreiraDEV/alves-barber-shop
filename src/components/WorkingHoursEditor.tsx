"use client";

import { useEffect, useState } from "react";
import {
  isValidTimeLabel,
  normalizeWorkingHours,
  toMinutes,
  WORKING_HOURS_DAYS,
} from "@/lib/working-hours";
import type { WorkingHoursDay } from "@/types";
import { useToast } from "./ui/toast";

type WorkingHoursEditorProps = {
  workingHours: WorkingHoursDay[];
  onSaveWorkingHours: (workingHours: WorkingHoursDay[]) => Promise<void>;
};

export default function WorkingHoursEditor({
  workingHours,
  onSaveWorkingHours,
}: WorkingHoursEditorProps) {
  const [draft, setDraft] = useState(() => normalizeWorkingHours(workingHours));
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setDraft(normalizeWorkingHours(workingHours));
  }, [workingHours]);

  const updateDay = (dayOfWeek: number, changes: Partial<WorkingHoursDay>) => {
    setDraft((current) =>
      current.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, ...changes } : day,
      ),
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    for (const day of draft) {
      if (!isValidTimeLabel(day.startTime) || !isValidTimeLabel(day.endTime)) {
        setError("Informe horários válidos no formato HH:mm.");
        return;
      }

      if (day.isOpen && toMinutes(day.endTime) <= toMinutes(day.startTime)) {
        setError("O horário final precisa ser maior que o inicial.");
        return;
      }
    }

    try {
      setIsSaving(true);
      setError("");
      await onSaveWorkingHours(draft);
      toast({
        title: "Horários atualizados",
        description: "O atendimento padrão foi salvo com sucesso.",
        variant: "success",
      });
    } catch (_error) {
      toast({
        title: "Erro ao salvar horários",
        description: "Não foi possível atualizar o horário padrão.",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="bg-stone-900/80 border border-stone-800 rounded-3xl p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-stone-100">
            Horário de atendimento
          </h3>
          <p className="text-xs text-stone-500">
            Define a agenda padrão do agendamento online e do quadro admin. O
            horário final é o último horário disponível para iniciar um
            atendimento.
          </p>
        </div>
        <button
          type="submit"
          form="working-hours-form"
          className="text-[10px] uppercase tracking-widest px-4 py-2 rounded-full border border-amber-600 text-amber-400 hover:bg-amber-600/20 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSaving}
        >
          {isSaving ? "Salvando..." : "Salvar horários"}
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <form
        id="working-hours-form"
        className="flex flex-col gap-3"
        onSubmit={(event) => void handleSubmit(event)}
      >
        {WORKING_HOURS_DAYS.map((weekDay) => {
          const day = draft.find(
            (item) => item.dayOfWeek === weekDay.dayOfWeek,
          );
          if (!day) {
            return null;
          }

          return (
            <div
              key={weekDay.dayOfWeek}
              className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-stone-100">
                    {weekDay.label}
                  </div>
                  <div className="text-xs text-stone-500">
                    {day.isOpen ? "Aberto para agendamento" : "Fechado"}
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 text-xs text-stone-300">
                  <input
                    type="checkbox"
                    checked={day.isOpen}
                    onChange={(event) =>
                      updateDay(weekDay.dayOfWeek, {
                        isOpen: event.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-stone-700 bg-stone-950 text-amber-500"
                    disabled={isSaving}
                  />
                  Dia ativo
                </label>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-xs uppercase tracking-widest text-stone-500">
                  Início
                  <input
                    type="time"
                    value={day.startTime}
                    onChange={(event) =>
                      updateDay(weekDay.dayOfWeek, {
                        startTime: event.target.value,
                      })
                    }
                    className="h-10 rounded-xl border border-stone-700 bg-stone-950 px-3 text-sm text-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!day.isOpen || isSaving}
                  />
                </label>

                <label className="flex flex-col gap-2 text-xs uppercase tracking-widest text-stone-500">
                  Último horário
                  <input
                    type="time"
                    value={day.endTime}
                    onChange={(event) =>
                      updateDay(weekDay.dayOfWeek, {
                        endTime: event.target.value,
                      })
                    }
                    className="h-10 rounded-xl border border-stone-700 bg-stone-950 px-3 text-sm text-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!day.isOpen || isSaving}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </form>
    </section>
  );
}
