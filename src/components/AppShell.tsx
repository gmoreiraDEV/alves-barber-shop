"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@stackframe/stack";
import AdminDashboard from "./AdminDashboard";
import AdminLogin from "./AdminLogin";
import BookingForm from "./BookingForm";
import type { Appointment, Barber, BarberAbsence, Service } from "../types";
import { ToastProvider } from "./ui/toast";

type LoadState = "idle" | "loading" | "error";

type LoadResult = {
  services: Service[];
  barbers: Barber[];
  appointments: Appointment[];
  absences: BarberAbsence[];
};

const emptyLoadResult: LoadResult = {
  services: [],
  barbers: [],
  appointments: [],
  absences: [],
};

export default function AppShell() {
  const [view, setView] = useState<"home" | "admin">("home");
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [data, setData] = useState<LoadResult>(emptyLoadResult);
  const user = useUser();

  const loadData = async () => {
    setLoadState("loading");

    try {
      const [servicesResponse, barbersResponse, appointmentsResponse, absencesResponse] = await Promise.all([
        fetch(`/api/services${view === "admin" && user ? "?all=true" : ""}`),
        fetch("/api/barbers"),
        fetch(view === "admin" && user ? "/api/appointments" : "/api/appointments?minimal=true"),
        fetch(view === "admin" && user ? "/api/absences" : "/api/absences"),
      ]);

      if (
        !servicesResponse.ok ||
        !barbersResponse.ok ||
        !appointmentsResponse.ok ||
        !absencesResponse.ok
      ) {
        throw new Error("Falha ao carregar dados");
      }

      const [services, barbers, appointments, absences] = await Promise.all([
        servicesResponse.json(),
        barbersResponse.json(),
        appointmentsResponse.json(),
        absencesResponse.json(),
      ]);

      setData({
        services,
        barbers,
        appointments,
        absences,
      });
      setLoadState("idle");
    } catch (error) {
      setLoadState("error");
    }
  };

  useEffect(() => {
    void loadData();
  }, [view, user]);

  const handleBook = async (payload: Omit<Appointment, "id" | "isActive" | "deletedAt">) => {
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

  const handleDeleteAppointment = async (id: string) => {
    const response = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    if (!response.ok) {
      throw new Error("Falha ao excluir agendamento");
    }
    await loadData();
  };

  const handleAddService = async (service: Omit<Service, "id" | "isActive">) => {
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

  const handleDeleteService = async (id: string) => {
    const response = await fetch(`/api/services/${id}`, { method: "DELETE" });
    if (!response.ok) {
      throw new Error("Falha ao excluir serviço");
    }
    await loadData();
  };

  const handleAddBarber = async (barber: { name: string; specialties: string[] }) => {
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

  const handleDeleteBarber = async (id: string) => {
    const response = await fetch(`/api/barbers/${id}`, { method: "DELETE" });
    if (!response.ok) {
      throw new Error("Falha ao excluir barbeiro");
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

  const handleDeleteAbsence = async (id: string) => {
    const response = await fetch(`/api/absences/${id}`, { method: "DELETE" });
    if (!response.ok) {
      throw new Error("Falha ao excluir ausência");
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

  const services = data.services;
  const barbers = data.barbers;
  const appointments = data.appointments;
  const absences = data.absences;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-stone-950 flex flex-col">
      <nav className="sticky top-0 z-50 bg-stone-950/90 backdrop-blur-lg border-b border-stone-800 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button
            type="button"
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setView("home")}
          >
            <div className="w-12 h-12 rounded-full overflow-hidden border border-stone-700 bg-white transition group-hover:scale-105">
              <img
                src="/images/logo.png"
                alt="Alves Barbershop Logo"
                className="w-full h-full object-cover"
                onError={(event) => {
                  (event.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-black tracking-tighter uppercase leading-none text-stone-100">
                Alves Barber
              </h1>
              <span className="text-[10px] tracking-[0.3em] uppercase text-stone-500 font-bold">
                Shop & Style
              </span>
            </div>
          </button>
          <div className="flex gap-4 items-center">
            {user ? (
              <div className="hidden md:flex items-center gap-3 mr-4 border-r border-stone-800 pr-4">
                <div className="w-8 h-8 rounded-full border border-amber-600 bg-stone-800" />
                <span className="text-xs font-bold text-stone-300">
                  {user.displayName || user.primaryEmail || "Admin"}
                </span>
              </div>
            ) : null}
            <button
              onClick={() => {
                if (view === "home") {
                  setView("admin");
                  return;
                }

                setView("home");
              }}
              className="px-4 py-2 border border-stone-700 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition text-stone-100"
            >
              {view === "home" ? "Admin" : "Voltar à Loja"}
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {loadState === "error" ? (
          <div className="max-w-4xl mx-auto px-4 py-12 text-sm text-red-400">
            Não foi possível carregar os dados. Tente novamente.
          </div>
        ) : null}

        {view === "home" ? (
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
                  <span className="text-amber-500">{homeHeroText.titleHighlight}</span>
                </h2>
                <p className="text-stone-400 max-w-xl mx-auto text-lg">
                  {homeHeroText.subtitle}
                </p>
              </div>
            </section>
            <section className="px-4 -mt-20 pb-20">
              <BookingForm
                services={services.filter((service) => service.isActive)}
                barbers={barbers}
                appointments={appointments}
                absences={absences}
                onBook={handleBook}
              />
            </section>
          </div>
        ) : user ? (
          <AdminDashboard
            appointments={appointments}
            services={services}
            barbers={barbers}
            absences={absences}
            onDeleteAppointment={handleDeleteAppointment}
            onAddService={handleAddService}
            onSetServiceActive={handleSetServiceActive}
            onDeleteService={handleDeleteService}
            onAddBarber={handleAddBarber}
            onDeleteBarber={handleDeleteBarber}
            onAddAbsence={handleAddAbsence}
            onDeleteAbsence={handleDeleteAbsence}
            onLogout={() => user.signOut()}
            adminName={user.displayName || user.primaryEmail || "Admin"}
          />
        ) : (
          <div className="px-4 py-20">
            <AdminLogin onCancel={() => setView("home")} />
          </div>
        )}
      </main>

      <footer className="bg-stone-950 border-t border-stone-900 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          <div>
            <h4 className="text-xl font-bold mb-4 uppercase text-amber-500">Localização</h4>
            <p className="text-stone-400">
              Rua Nelson Lomanto, 3
              <br />
              São Paulo, SP
            </p>
          </div>
          <div>
            <h4 className="text-xl font-bold mb-4 uppercase text-amber-500">Horários</h4>
            <p className="text-stone-400">Segunda a Sábado: 08h às 21h</p>
          </div>
          <div className="flex flex-col items-center md:items-end">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="text-2xl font-black tracking-tighter uppercase text-stone-100">
                Alves Barber
              </h4>
            </div>
            <p className="text-[10px] text-stone-600 uppercase mt-4">
              © {new Date().getFullYear()} Alves Barber Shop. Todos os direitos
              reservados.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </ToastProvider>
  );
}
