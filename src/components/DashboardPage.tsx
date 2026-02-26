"use client";

import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { type LoadResult, loadAdminData } from "@/lib/app-data";
import type { Barber, BarberAbsence, Service } from "@/types";
import AdminDashboard from "./AdminDashboard";
import AdminLogin from "./AdminLogin";

type LoadState = "idle" | "loading" | "error";

const emptyLoadResult: LoadResult = {
  services: [],
  barbers: [],
  appointments: [],
  absences: [],
};

export default function DashboardPage() {
  const user = useUser();
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [data, setData] = useState<LoadResult>(emptyLoadResult);

  const loadData = useCallback(async () => {
    setLoadState("loading");

    try {
      const result = await loadAdminData();
      setData(result);
      setLoadState("idle");
    } catch (_error) {
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    void loadData();
  }, [user, loadData]);

  const handleMoveAppointment = async (id: string, nextDateIso: string) => {
    const response = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: nextDateIso }),
    });
    if (!response.ok) {
      throw new Error("Falha ao mover agendamento");
    }
    await loadData();
  };
  const handleDeleteAppointment = async (id: string) => {
    const response = await fetch(`/api/appointments/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Falha ao excluir agendamento");
    }
    await loadData();
  };

  const handleAddService = async (
    service: Omit<Service, "id" | "isActive">,
  ) => {
    const response = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(service),
    });
    if (!response.ok) {
      throw new Error("Falha ao criar serviço");
    }

    await loadData();
  };

  const handleSetServiceActive = async (id: string, isActive: boolean) => {
    const response = await fetch(`/api/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    if (!response.ok) {
      throw new Error("Falha ao atualizar serviço");
    }

    await loadData();
  };

  const handleUpdateService = async (
    id: string,
    service: Omit<Service, "id" | "isActive">,
  ) => {
    const response = await fetch(`/api/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(service),
    });
    if (!response.ok) {
      throw new Error("Falha ao editar serviço");
    }

    await loadData();
  };

  const handleDeleteService = async (id: string) => {
    const response = await fetch(`/api/services/${id}`, { method: "DELETE" });
    if (!response.ok) {
      throw new Error("Falha ao excluir serviço");
    }
    await loadData();
  };

  const handleAddBarber = async (barber: {
    name: string;
    specialties: string[];
  }) => {
    const response = await fetch("/api/barbers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(barber),
    });
    if (!response.ok) {
      throw new Error("Falha ao criar barbeiro");
    }

    await loadData();
  };

  const handleUpdateBarber = async (id: string, barber: Omit<Barber, "id">) => {
    const response = await fetch(`/api/barbers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(barber),
    });
    if (!response.ok) {
      throw new Error("Falha ao editar barbeiro");
    }

    await loadData();
  };

  const handleDeleteBarber = async (
    id: string,
    options?: { replacementBarberId?: string },
  ) => {
    const response = await fetch(`/api/barbers/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options ?? {}),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(payload?.error ?? "Falha ao excluir barbeiro");
    }

    await loadData();
  };

  const handleAddAbsence = async (absence: {
    barberId: string;
    startAt: string;
    endAt: string;
  }) => {
    const response = await fetch("/api/absences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(absence),
    });
    if (!response.ok) {
      throw new Error("Falha ao criar ausência");
    }

    await loadData();
  };

  const handleUpdateAbsence = async (
    id: string,
    absence: Omit<BarberAbsence, "id">,
  ) => {
    const response = await fetch(`/api/absences/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(absence),
    });
    if (!response.ok) {
      throw new Error("Falha ao editar ausência");
    }

    await loadData();
  };

  const handleDeleteAbsence = async (id: string) => {
    const response = await fetch(`/api/absences/${id}`, { method: "DELETE" });
    if (!response.ok) {
      throw new Error("Falha ao excluir ausência");
    }
    await loadData();
  };

  if (!user) {
    return (
      <div className="px-4 py-20">
        <AdminLogin onCancel={() => router.push("/")} />
      </div>
    );
  }

  return (
    <>
      {loadState === "error" ? (
        <div className="max-w-4xl mx-auto px-4 py-12 text-sm text-red-400">
          Não foi possível carregar os dados. Tente novamente.
        </div>
      ) : null}

      <AdminDashboard
        appointments={data.appointments}
        services={data.services}
        barbers={data.barbers}
        absences={data.absences}
        onDeleteAppointment={handleDeleteAppointment}
        onMoveAppointment={handleMoveAppointment}
        onAddService={handleAddService}
        onSetServiceActive={handleSetServiceActive}
        onDeleteService={handleDeleteService}
        onUpdateService={handleUpdateService}
        onAddBarber={handleAddBarber}
        onDeleteBarber={handleDeleteBarber}
        onUpdateBarber={handleUpdateBarber}
        onAddAbsence={handleAddAbsence}
        onDeleteAbsence={handleDeleteAbsence}
        onUpdateAbsence={handleUpdateAbsence}
        onLogout={() => user.signOut()}
        adminName={user.displayName || user.primaryEmail || "Admin"}
      />
    </>
  );
}
