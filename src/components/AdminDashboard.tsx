"use client";

import { format } from "date-fns";
import { useMemo, useState } from "react";
import type { Appointment, Barber, BarberAbsence, Service } from "../types";
import AdminAppointmentsBoard from "./AdminAppointmentsBoard";
import ServicesTable from "./ServicesTable";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useToast } from "./ui/toast";

type AdminDashboardProps = {
  appointments: Appointment[];
  services: Service[];
  barbers: Barber[];
  absences: BarberAbsence[];
  onDeleteAppointment: (id: string) => Promise<void>;
  onMoveAppointment: (id: string, nextDateIso: string) => Promise<void>;
  onAddService: (service: Omit<Service, "id" | "isActive">) => Promise<void>;
  onSetServiceActive: (id: string, isActive: boolean) => Promise<void>;
  onDeleteService: (id: string) => Promise<void>;
  onUpdateService: (
    id: string,
    service: Omit<Service, "id" | "isActive">,
  ) => Promise<void>;
  onAddBarber: (barber: {
    name: string;
    specialties: string[];
  }) => Promise<void>;
  onDeleteBarber: (
    id: string,
    options?: { replacementBarberId?: string },
  ) => Promise<void>;
  onUpdateBarber: (id: string, barber: Omit<Barber, "id">) => Promise<void>;
  onAddAbsence: (absence: {
    barberId: string;
    startAt: string;
    endAt: string;
  }) => Promise<void>;
  onDeleteAbsence: (id: string) => Promise<void>;
  onUpdateAbsence: (
    id: string,
    absence: Omit<BarberAbsence, "id">,
  ) => Promise<void>;
  onLogout: () => void;
  adminName: string;
};

type ModalTab = "service" | "barber" | "absence";

function formatDate(date: Date) {
  return date.toLocaleString("pt-BR");
}

function _toIsoDate(date?: Date) {
  return date ? format(date, "yyyy-MM-dd") : "";
}

export default function AdminDashboard({
  appointments,
  services,
  barbers,
  absences,
  onDeleteAppointment,
  onMoveAppointment,
  onAddService,
  onSetServiceActive,
  onDeleteService,
  onUpdateService,
  onAddBarber,
  onDeleteBarber,
  onUpdateBarber,
  onAddAbsence,
  onDeleteAbsence,
  onUpdateAbsence,
  onLogout,
  adminName,
}: AdminDashboardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ModalTab>("service");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [barberName, setBarberName] = useState("");
  const [barberSpecialties, setBarberSpecialties] = useState("");

  const [absenceBarberId, setAbsenceBarberId] = useState("");
  const [absenceDate, setAbsenceDate] = useState<Date | undefined>(undefined);
  const [absenceAllDay, setAbsenceAllDay] = useState(true);
  const [absenceStartTime, setAbsenceStartTime] = useState("09:00");
  const [absenceEndTime, setAbsenceEndTime] = useState("18:00");
  const [modalError, setModalError] = useState("");
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [barberDeleteError, setBarberDeleteError] = useState("");
  const [barberToDelete, setBarberToDelete] = useState<Barber | null>(null);
  const [replacementBarberId, setReplacementBarberId] = useState("");
  const [absenceToDelete, setAbsenceToDelete] = useState<BarberAbsence | null>(
    null,
  );
  const [isSavingService, setIsSavingService] = useState(false);
  const [isSavingBarber, setIsSavingBarber] = useState(false);
  const [isSavingAbsence, setIsSavingAbsence] = useState(false);
  const [isDeletingService, setIsDeletingService] = useState(false);
  const [updatingBarberId, setUpdatingBarberId] = useState<string | null>(null);
  const [updatingAbsenceId, setUpdatingAbsenceId] = useState<string | null>(
    null,
  );
  const [deletingBarberId, setDeletingBarberId] = useState<string | null>(null);
  const [deletingAbsenceId, setDeletingAbsenceId] = useState<string | null>(
    null,
  );
  const { toast } = useToast();

  const barbersById = useMemo(() => {
    return new Map(barbers.map((barber) => [barber.id, barber]));
  }, [barbers]);

  const appointmentsCountByBarber = useMemo(() => {
    const countByBarber = new Map<string, number>();
    for (const appointment of appointments) {
      countByBarber.set(
        appointment.barberId,
        (countByBarber.get(appointment.barberId) ?? 0) + 1,
      );
    }

    return countByBarber;
  }, [appointments]);

  const replacementBarberOptions = useMemo(() => {
    if (!barberToDelete) {
      return [];
    }

    return barbers.filter((barber) => barber.id !== barberToDelete.id);
  }, [barberToDelete, barbers]);

  const handleAddService = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name || !description || !price || !duration) {
      setModalError("Preencha nome, descrição, preço e duração.");
      return;
    }

    try {
      setIsSavingService(true);
      setModalError("");
      await onAddService({
        name,
        description,
        price: Number(price),
        duration: Number(duration),
      });

      toast({
        title: "Serviço criado",
        description: "O novo serviço foi cadastrado com sucesso.",
        variant: "success",
      });

      setName("");
      setDescription("");
      setPrice("");
      setDuration("");
      setIsModalOpen(false);
    } catch (_error) {
      toast({
        title: "Erro ao criar serviço",
        description: "Não foi possível salvar o serviço. Tente novamente.",
        variant: "error",
      });
    } finally {
      setIsSavingService(false);
    }
  };

  const handleAddBarber = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!barberName || !barberSpecialties) {
      setModalError("Preencha nome e especialidades.");
      return;
    }

    try {
      setIsSavingBarber(true);
      setModalError("");
      await onAddBarber({
        name: barberName,
        specialties: barberSpecialties
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });

      toast({
        title: "Barbeiro cadastrado",
        description: "O barbeiro foi adicionado com sucesso.",
        variant: "success",
      });

      setBarberName("");
      setBarberSpecialties("");
      setIsModalOpen(false);
    } catch (_error) {
      toast({
        title: "Erro ao cadastrar barbeiro",
        description: "Não foi possível salvar o barbeiro. Tente novamente.",
        variant: "error",
      });
    } finally {
      setIsSavingBarber(false);
    }
  };

  const handleAddAbsence = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!absenceBarberId || !absenceDate) {
      setModalError("Selecione o barbeiro e a data da ausência.");
      return;
    }

    const date = new Date(absenceDate);
    const start = new Date(date);
    const end = new Date(date);

    if (absenceAllDay) {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else {
      const [startH, startM] = absenceStartTime.split(":").map(Number);
      const [endH, endM] = absenceEndTime.split(":").map(Number);
      start.setHours(startH, startM, 0, 0);
      end.setHours(endH, endM, 0, 0);
      if (end <= start) {
        setModalError("O horário final precisa ser maior que o inicial.");
        return;
      }
    }

    try {
      setIsSavingAbsence(true);
      setModalError("");
      await onAddAbsence({
        barberId: absenceBarberId,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });

      toast({
        title: "Ausência registrada",
        description: "A ausência foi salva com sucesso.",
        variant: "success",
      });

      setAbsenceBarberId("");
      setAbsenceDate(undefined);
      setAbsenceAllDay(true);
      setIsModalOpen(false);
    } catch (_error) {
      toast({
        title: "Erro ao registrar ausência",
        description: "Não foi possível salvar a ausência. Tente novamente.",
        variant: "error",
      });
    } finally {
      setIsSavingAbsence(false);
    }
  };

  const handleConfirmDeleteService = async () => {
    if (!serviceToDelete) return;
    try {
      setDeleteError("");
      setIsDeletingService(true);
      await onDeleteService(serviceToDelete.id);
      toast({
        title: "Serviço excluído",
        description: "O serviço foi removido com sucesso.",
        variant: "success",
      });
      setServiceToDelete(null);
    } catch (_error) {
      setDeleteError("Não foi possível excluir o serviço. Tente novamente.");
      toast({
        title: "Erro ao excluir serviço",
        description: "Não foi possível excluir o serviço. Tente novamente.",
        variant: "error",
      });
    } finally {
      setIsDeletingService(false);
    }
  };

  const handleDeleteBarber = async (id: string) => {
    const hasAppointments = (appointmentsCountByBarber.get(id) ?? 0) > 0;

    if (hasAppointments && !replacementBarberId) {
      setBarberDeleteError(
        "Selecione quem vai assumir os atendimentos antes de excluir.",
      );
      return;
    }

    try {
      setDeletingBarberId(id);
      setBarberDeleteError("");
      await onDeleteBarber(id, {
        replacementBarberId: hasAppointments ? replacementBarberId : undefined,
      });
      toast({
        title: "Barbeiro removido",
        description: hasAppointments
          ? "Os atendimentos foram transferidos e o barbeiro foi excluído."
          : "O barbeiro foi excluído com sucesso.",
        variant: "success",
      });
      setBarberToDelete(null);
      setReplacementBarberId("");
    } catch (_error) {
      setBarberDeleteError(
        "Não foi possível excluir o barbeiro. Tente novamente.",
      );
      toast({
        title: "Erro ao excluir barbeiro",
        description: "Não foi possível excluir o barbeiro. Tente novamente.",
        variant: "error",
      });
    } finally {
      setDeletingBarberId(null);
    }
  };

  const handleDeleteAbsence = async (id: string) => {
    try {
      setDeletingAbsenceId(id);
      await onDeleteAbsence(id);
      toast({
        title: "Ausência removida",
        description: "A ausência foi excluída com sucesso.",
        variant: "success",
      });
      setAbsenceToDelete(null);
    } catch (_error) {
      toast({
        title: "Erro ao excluir ausência",
        description: "Não foi possível excluir a ausência. Tente novamente.",
        variant: "error",
      });
    } finally {
      setDeletingAbsenceId(null);
    }
  };

  const handleEditService = async (service: Service) => {
    const name = window.prompt("Nome do serviço", service.name);
    if (name === null) return;
    const description = window.prompt(
      "Descrição do serviço",
      service.description,
    );
    if (description === null) return;
    const priceValue = window.prompt("Preço", String(service.price));
    if (priceValue === null) return;
    const durationValue = window.prompt(
      "Duração (min)",
      String(service.duration),
    );
    if (durationValue === null) return;

    const price = Number(priceValue);
    const duration = Number(durationValue);

    if (
      !name.trim() ||
      !description.trim() ||
      Number.isNaN(price) ||
      Number.isNaN(duration)
    ) {
      toast({
        title: "Dados inválidos",
        description: "Preencha os dados corretamente para editar o serviço.",
        variant: "error",
      });
      return;
    }

    try {
      await onUpdateService(service.id, {
        name: name.trim(),
        description: description.trim(),
        price,
        duration,
      });
      toast({
        title: "Serviço atualizado",
        description: "Dados do serviço atualizados.",
        variant: "success",
      });
    } catch (_error) {
      toast({
        title: "Erro ao editar serviço",
        description: "Não foi possível atualizar o serviço.",
        variant: "error",
      });
    }
  };

  const handleEditBarber = async (barber: Barber) => {
    const name = window.prompt("Nome do barbeiro", barber.name);
    if (name === null) return;
    const specialtiesValue = window.prompt(
      "Especialidades (separadas por vírgula)",
      barber.specialties.join(", "),
    );
    if (specialtiesValue === null) return;

    const specialties = specialtiesValue
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!name.trim() || specialties.length === 0) {
      toast({
        title: "Dados inválidos",
        description: "Informe nome e especialidades válidas.",
        variant: "error",
      });
      return;
    }

    try {
      setUpdatingBarberId(barber.id);
      await onUpdateBarber(barber.id, { name: name.trim(), specialties });
      toast({
        title: "Barbeiro atualizado",
        description: "Dados do barbeiro atualizados.",
        variant: "success",
      });
    } catch (_error) {
      toast({
        title: "Erro ao editar barbeiro",
        description: "Não foi possível atualizar o barbeiro.",
        variant: "error",
      });
    } finally {
      setUpdatingBarberId(null);
    }
  };

  const handleEditAbsence = async (absence: BarberAbsence) => {
    const barberId = window.prompt("ID do barbeiro", absence.barberId);
    if (barberId === null) return;
    const startAt = window.prompt("Início (ISO)", absence.startAt);
    if (startAt === null) return;
    const endAt = window.prompt("Fim (ISO)", absence.endAt);
    if (endAt === null) return;

    const start = new Date(startAt);
    const end = new Date(endAt);
    if (
      !barberId.trim() ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      toast({
        title: "Dados inválidos",
        description: "Informe barbeiro e intervalo válidos para ausência.",
        variant: "error",
      });
      return;
    }

    try {
      setUpdatingAbsenceId(absence.id);
      await onUpdateAbsence(absence.id, {
        barberId: barberId.trim(),
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });
      toast({
        title: "Ausência atualizada",
        description: "Ausência atualizada com sucesso.",
        variant: "success",
      });
    } catch (_error) {
      toast({
        title: "Erro ao editar ausência",
        description: "Não foi possível atualizar a ausência.",
        variant: "error",
      });
    } finally {
      setUpdatingAbsenceId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col gap-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500 font-semibold">
            Painel Administrativo
          </p>
          <h2 className="text-3xl font-bold text-stone-100">
            Bem-vindo, {adminName}
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="h-11 px-6 rounded-full bg-amber-500 text-stone-950 text-xs uppercase tracking-widest font-bold hover:bg-amber-400 transition"
          >
            Novo cadastro
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="h-11 px-6 rounded-full border border-stone-700 text-stone-100 text-xs uppercase tracking-widest hover:bg-stone-800 transition"
          >
            Sair
          </button>
        </div>
      </header>

      <AdminAppointmentsBoard
        appointments={appointments}
        services={services}
        barbers={barbers}
        absences={absences}
        onDeleteAppointment={onDeleteAppointment}
        onMoveAppointment={onMoveAppointment}
      />

      <ServicesTable
        services={services}
        onSetServiceActive={onSetServiceActive}
        onEditClick={handleEditService}
        onDeleteClick={(service) => {
          setDeleteError("");
          setServiceToDelete(service);
        }}
        onAddClick={() => {
          setActiveTab("service");
          setIsModalOpen(true);
        }}
      />

      <section className="bg-stone-900/80 border border-stone-800 rounded-3xl p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-stone-100">Barbeiros</h3>
          <button
            type="button"
            onClick={() => {
              setActiveTab("barber");
              setIsModalOpen(true);
            }}
            className="text-[10px] uppercase tracking-widest px-4 py-2 rounded-full border border-amber-600 text-amber-400 hover:bg-amber-600/20"
          >
            Adicionar barbeiro
          </button>
        </div>

        <div className="space-y-3">
          {barbers.map((barber) => (
            <div
              key={barber.id}
              className="border border-stone-800 rounded-2xl p-4 flex flex-col gap-2"
            >
              <div className="text-sm font-semibold text-stone-100">
                {barber.name}
              </div>
              <div className="text-xs text-stone-500">
                Especialidades: {barber.specialties.join(", ")}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleEditBarber(barber)}
                  className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-sky-500 text-sky-400 hover:bg-sky-500/20"
                  disabled={updatingBarberId === barber.id}
                >
                  {updatingBarberId === barber.id ? "Salvando..." : "Editar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError("");
                    setBarberDeleteError("");
                    setReplacementBarberId("");
                    setBarberToDelete(barber);
                  }}
                  className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-red-500 text-red-400 hover:bg-red-500/20"
                  disabled={deletingBarberId === barber.id}
                >
                  {deletingBarberId === barber.id ? "Removendo..." : "Remover"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-stone-900/80 border border-stone-800 rounded-3xl p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-stone-100">Ausências</h3>
          <button
            type="button"
            onClick={() => {
              setActiveTab("absence");
              setIsModalOpen(true);
            }}
            className="text-[10px] uppercase tracking-widest px-4 py-2 rounded-full border border-amber-600 text-amber-400 hover:bg-amber-600/20"
          >
            Adicionar ausência
          </button>
        </div>

        <div className="space-y-3">
          {absences.length === 0 ? (
            <p className="text-sm text-stone-500">
              Nenhuma ausência cadastrada.
            </p>
          ) : (
            absences.map((absence) => (
              <div
                key={absence.id}
                className="border border-stone-800 rounded-2xl p-4 flex flex-col gap-2"
              >
                <div className="text-sm font-semibold text-stone-100">
                  {barbersById.get(absence.barberId)?.name ?? "Barbeiro"}
                </div>
                <div className="text-xs text-stone-500">
                  {formatDate(new Date(absence.startAt))} —{" "}
                  {formatDate(new Date(absence.endAt))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleEditAbsence(absence)}
                    className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-sky-500 text-sky-400 hover:bg-sky-500/20"
                    disabled={updatingAbsenceId === absence.id}
                  >
                    {updatingAbsenceId === absence.id
                      ? "Salvando..."
                      : "Editar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError("");
                      setAbsenceToDelete(absence);
                    }}
                    className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-red-500 text-red-400 hover:bg-red-500/20"
                    disabled={deletingAbsenceId === absence.id}
                  >
                    {deletingAbsenceId === absence.id
                      ? "Removendo..."
                      : "Remover"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* biome-ignore lint/a11y/noStaticElementInteractions: modal backdrop click closes dialog. */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop is mouse-only affordance. */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-3xl border border-stone-800 bg-stone-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-stone-100">
                Novo cadastro
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs uppercase tracking-widest text-stone-400 hover:text-stone-200"
              >
                Fechar
              </button>
            </div>
            <div className="flex gap-2 mb-6">
              {(
                [
                  { id: "service", label: "Serviço" },
                  { id: "barber", label: "Barbeiro" },
                  { id: "absence", label: "Ausência" },
                ] as const
              ).map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 rounded-full px-4 py-2 text-[10px] uppercase tracking-widest border ${
                    activeTab === tab.id
                      ? "border-amber-500 text-amber-400"
                      : "border-stone-700 text-stone-400"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {modalError ? (
              <div className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {modalError}
              </div>
            ) : null}

            {activeTab === "service" ? (
              <form className="flex flex-col gap-3" onSubmit={handleAddService}>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-10 rounded-xl border border-stone-700 bg-stone-950 px-3 text-sm text-stone-100"
                  placeholder="Nome do serviço"
                  disabled={isSavingService}
                />
                <input
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="h-10 rounded-xl border border-stone-700 bg-stone-950 px-3 text-sm text-stone-100"
                  placeholder="Descrição"
                  disabled={isSavingService}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    className="h-10 rounded-xl border border-stone-700 bg-stone-950 px-3 text-sm text-stone-100"
                    placeholder="Preço"
                    disabled={isSavingService}
                  />
                  <input
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                    className="h-10 rounded-xl border border-stone-700 bg-stone-950 px-3 text-sm text-stone-100"
                    placeholder="Duração (min)"
                    disabled={isSavingService}
                  />
                </div>
                <button
                  type="submit"
                  className="h-11 rounded-full bg-amber-500 text-stone-950 font-bold uppercase tracking-widest text-xs hover:bg-amber-400 transition"
                  disabled={
                    !name ||
                    !description ||
                    !price ||
                    !duration ||
                    isSavingService
                  }
                >
                  {isSavingService ? "Salvando..." : "Salvar serviço"}
                </button>
              </form>
            ) : null}

            {activeTab === "barber" ? (
              <form className="flex flex-col gap-3" onSubmit={handleAddBarber}>
                <input
                  value={barberName}
                  onChange={(event) => setBarberName(event.target.value)}
                  className="h-10 rounded-xl border border-stone-700 bg-stone-950 px-3 text-sm text-stone-100"
                  placeholder="Nome do barbeiro"
                  disabled={isSavingBarber}
                />
                <input
                  value={barberSpecialties}
                  onChange={(event) => setBarberSpecialties(event.target.value)}
                  className="h-10 rounded-xl border border-stone-700 bg-stone-950 px-3 text-sm text-stone-100"
                  placeholder="Especialidades (separadas por vírgula)"
                  disabled={isSavingBarber}
                />
                <button
                  type="submit"
                  className="h-11 rounded-full bg-amber-500 text-stone-950 font-bold uppercase tracking-widest text-xs hover:bg-amber-400 transition"
                  disabled={!barberName || !barberSpecialties || isSavingBarber}
                >
                  {isSavingBarber ? "Salvando..." : "Salvar barbeiro"}
                </button>
              </form>
            ) : null}

            {activeTab === "absence" ? (
              <form className="flex flex-col gap-3" onSubmit={handleAddAbsence}>
                <select
                  value={absenceBarberId}
                  onChange={(event) => setAbsenceBarberId(event.target.value)}
                  className="h-10 rounded-xl border border-stone-700 bg-stone-950 px-3 text-sm text-stone-100"
                  disabled={isSavingAbsence}
                >
                  <option value="">Selecione o barbeiro</option>
                  {barbers.map((barber) => (
                    <option key={barber.id} value={barber.id}>
                      {barber.name}
                    </option>
                  ))}
                </select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 justify-start px-4 text-left font-normal text-stone-200"
                      disabled={isSavingAbsence}
                    >
                      {absenceDate
                        ? format(absenceDate, "dd/MM/yyyy")
                        : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start">
                    <Calendar
                      mode="single"
                      selected={absenceDate}
                      onSelect={setAbsenceDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <label className="flex items-center gap-2 text-xs text-stone-300">
                  <input
                    type="checkbox"
                    checked={absenceAllDay}
                    onChange={(event) => setAbsenceAllDay(event.target.checked)}
                    disabled={isSavingAbsence}
                  />
                  Ausência do dia inteiro
                </label>

                {!absenceAllDay ? (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="time"
                      value={absenceStartTime}
                      onChange={(event) =>
                        setAbsenceStartTime(event.target.value)
                      }
                      className="h-10 rounded-xl border border-stone-700 bg-stone-950 px-3 text-sm text-stone-100"
                      disabled={isSavingAbsence}
                    />
                    <input
                      type="time"
                      value={absenceEndTime}
                      onChange={(event) =>
                        setAbsenceEndTime(event.target.value)
                      }
                      className="h-10 rounded-xl border border-stone-700 bg-stone-950 px-3 text-sm text-stone-100"
                      disabled={isSavingAbsence}
                    />
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="h-11 rounded-full bg-amber-500 text-stone-950 font-bold uppercase tracking-widest text-xs hover:bg-amber-400 transition"
                  disabled={
                    !absenceBarberId ||
                    !absenceDate ||
                    (!absenceAllDay && !absenceStartTime) ||
                    isSavingAbsence
                  }
                >
                  {isSavingAbsence ? "Salvando..." : "Salvar ausência"}
                </button>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}

      {serviceToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* biome-ignore lint/a11y/noStaticElementInteractions: modal backdrop click closes dialog. */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop is mouse-only affordance. */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setServiceToDelete(null)}
          />
          <div className="relative w-full max-w-md rounded-3xl border border-stone-800 bg-stone-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h4 className="text-lg font-bold text-stone-100">
                Excluir serviço
              </h4>
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
                className="text-xs uppercase tracking-widest text-stone-400 hover:text-stone-200"
              >
                Fechar
              </button>
            </div>
            <p className="text-sm text-stone-400">
              Tem certeza que deseja excluir o serviço{" "}
              <span className="text-stone-100 font-semibold">
                {serviceToDelete.name}
              </span>
              ? Esta ação remove o serviço do banco de dados.
            </p>
            {deleteError ? (
              <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {deleteError}
              </div>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
                className="h-11 px-6 rounded-full border border-stone-700 text-stone-100 text-xs uppercase tracking-widest hover:bg-stone-800 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteService}
                className="h-11 px-6 rounded-full bg-red-500 text-stone-950 text-xs uppercase tracking-widest font-bold hover:bg-red-400 transition"
                disabled={isDeletingService}
              >
                {isDeletingService ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {barberToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* biome-ignore lint/a11y/noStaticElementInteractions: modal backdrop click closes dialog. */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop is mouse-only affordance. */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => {
              setBarberToDelete(null);
              setBarberDeleteError("");
              setReplacementBarberId("");
            }}
          />
          <div className="relative w-full max-w-md rounded-3xl border border-stone-800 bg-stone-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h4 className="text-lg font-bold text-stone-100">
                Remover barbeiro
              </h4>
              <button
                type="button"
                onClick={() => {
                  setBarberToDelete(null);
                  setBarberDeleteError("");
                  setReplacementBarberId("");
                }}
                className="text-xs uppercase tracking-widest text-stone-400 hover:text-stone-200"
              >
                Fechar
              </button>
            </div>
            <p className="text-sm text-stone-400">
              Tem certeza que deseja remover o barbeiro{" "}
              <span className="text-stone-100 font-semibold">
                {barberToDelete.name}
              </span>
              ? Esta ação remove o barbeiro do banco de dados.
            </p>
            {(appointmentsCountByBarber.get(barberToDelete.id) ?? 0) > 0 ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-amber-300">
                  Este barbeiro possui{" "}
                  {appointmentsCountByBarber.get(barberToDelete.id) ?? 0}{" "}
                  agendamento(s). Selecione quem vai assumir os atendimentos
                  antes da exclusão.
                </p>
                <select
                  value={replacementBarberId}
                  onChange={(event) =>
                    setReplacementBarberId(event.target.value)
                  }
                  className="w-full rounded-xl border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100"
                  disabled={deletingBarberId === barberToDelete.id}
                >
                  <option value="">Selecione o novo barbeiro</option>
                  {replacementBarberOptions.map((barber) => (
                    <option key={barber.id} value={barber.id}>
                      {barber.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {barberDeleteError ? (
              <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {barberDeleteError}
              </div>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setBarberToDelete(null);
                  setBarberDeleteError("");
                  setReplacementBarberId("");
                }}
                className="h-11 px-6 rounded-full border border-stone-700 text-stone-100 text-xs uppercase tracking-widest hover:bg-stone-800 transition"
                disabled={deletingBarberId === barberToDelete.id}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBarber(barberToDelete.id)}
                className="h-11 px-6 rounded-full bg-red-500 text-stone-950 text-xs uppercase tracking-widest font-bold hover:bg-red-400 transition"
                disabled={deletingBarberId === barberToDelete.id}
              >
                {deletingBarberId === barberToDelete.id
                  ? "Removendo..."
                  : "Remover"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {absenceToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* biome-ignore lint/a11y/noStaticElementInteractions: modal backdrop click closes dialog. */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop is mouse-only affordance. */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setAbsenceToDelete(null)}
          />
          <div className="relative w-full max-w-md rounded-3xl border border-stone-800 bg-stone-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h4 className="text-lg font-bold text-stone-100">
                Excluir ausência
              </h4>
              <button
                type="button"
                onClick={() => setAbsenceToDelete(null)}
                className="text-xs uppercase tracking-widest text-stone-400 hover:text-stone-200"
              >
                Fechar
              </button>
            </div>
            <p className="text-sm text-stone-400">
              Tem certeza que deseja excluir a ausência de{" "}
              <span className="text-stone-100 font-semibold">
                {barbersById.get(absenceToDelete.barberId)?.name ?? "Barbeiro"}
              </span>
              ? Esta ação remove a ausência do banco de dados.
            </p>
            {deleteError ? (
              <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {deleteError}
              </div>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setAbsenceToDelete(null)}
                className="h-11 px-6 rounded-full border border-stone-700 text-stone-100 text-xs uppercase tracking-widest hover:bg-stone-800 transition"
                disabled={deletingAbsenceId === absenceToDelete.id}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAbsence(absenceToDelete.id)}
                className="h-11 px-6 rounded-full bg-red-500 text-stone-950 text-xs uppercase tracking-widest font-bold hover:bg-red-400 transition"
                disabled={deletingAbsenceId === absenceToDelete.id}
              >
                {deletingAbsenceId === absenceToDelete.id
                  ? "Removendo..."
                  : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
