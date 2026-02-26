"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import type { Service } from "@/types";
import { useToast } from "./ui/toast";

type ServicesTableProps = {
  services: Service[];
  onSetServiceActive: (id: string, isActive: boolean) => Promise<void>;
  onDeleteClick: (service: Service) => void;
  onAddClick: () => void;
};

export default function ServicesTable({
  services,
  onSetServiceActive,
  onDeleteClick,
  onAddClick,
}: ServicesTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  return (
    <section className="bg-stone-900/80 border border-stone-800 rounded-3xl p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-stone-100">Serviços</h3>
        <button
          type="button"
          onClick={onAddClick}
          className="text-[10px] uppercase tracking-widest px-4 py-2 rounded-full border border-amber-600 text-amber-400 hover:bg-amber-600/20"
        >
          Adicionar serviço
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-stone-800">
        <table className="w-full min-w-[760px]">
          <thead className="bg-stone-950/80">
            <tr className="text-left text-[10px] uppercase tracking-widest text-stone-500">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Duração</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr
                key={service.id}
                className="border-t border-stone-800 text-sm text-stone-200 hover:bg-stone-900/60"
              >
                <td className="px-4 py-3 font-semibold text-stone-100">
                  {service.name}
                </td>
                <td className="px-4 py-3 text-stone-400 max-w-[280px] truncate">
                  {service.description}
                </td>
                <td className="px-4 py-3 text-stone-300">R$ {service.price}</td>
                <td className="px-4 py-3 text-stone-300">
                  {service.duration} min
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[10px] uppercase tracking-widest ${
                      service.isActive ? "text-emerald-400" : "text-stone-500"
                    }`}
                  >
                    {service.isActive ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setUpdatingId(service.id);
                          await onSetServiceActive(
                            service.id,
                            !service.isActive,
                          );
                          toast({
                            title: service.isActive
                              ? "Serviço desativado"
                              : "Serviço ativado",
                            description: "Status do serviço atualizado.",
                            variant: "success",
                          });
                        } catch (_error) {
                          toast({
                            title: "Erro ao atualizar serviço",
                            description:
                              "Não foi possível alterar o status. Tente novamente.",
                            variant: "error",
                          });
                        } finally {
                          setUpdatingId(null);
                        }
                      }}
                      disabled={updatingId === service.id}
                      className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-amber-600 text-amber-400 hover:bg-amber-600/20 disabled:opacity-60"
                    >
                      {service.isActive ? "Desativar" : "Ativar"}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteClick(service)}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-red-500/60 text-red-400 hover:bg-red-500/20 transition"
                      aria-label={`Excluir ${service.name}`}
                      title="Excluir serviço"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
