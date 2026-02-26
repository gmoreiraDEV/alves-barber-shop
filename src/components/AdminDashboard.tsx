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
  onAddBarber: (barber: {
    name: string;
    specialties: string[];
  }) => Promise<void>;
  onDeleteBarber: (id: string) => Promise<void>;
  onAddAbsence: (absence: {
    barberId: string;
    startAt: string;
    endAt: string;
  }) => Promise<void>;
  onDeleteAbsence: (id: string) => Promise<void>;
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
  onAddBarber,
  onDeleteBarber,
  onAddAbsence,
  onDeleteAbsence,
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
  const [barberToDelete, setBarberToDelete] = useState<Barber | null>(null);
  const [absenceToDelete, setAbsenceToDelete] = useState<BarberAbsence | null>(
    null,
  );
  const [isSavingService, setIsSavingService] = useState(false);
  const [isSavingBarber, setIsSavingBarber] = useState(false);
  const [isSavingAbsence, setIsSavingAbsence] = useState(false);
  const [isDeletingService, setIsDeletingService] = useState(false);
  const [deletingBarberId, setDeletingBarberId] = useState<string | null>(null);
  const [deletingAbsenceId, setDeletingAbsenceId] = useState<string | null>(
    null,
  );
  const { toast } = useToast();

  const barbersById = useMemo(() => {
    return new Map(barbers.map((barber) => [barber.id, barber]));
  }, [barbers]);

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
    try {
      setDeletingBarberId(id);
      await onDeleteBarber(id);
      toast({
        title: "Barbeiro removido",
        description: "O barbeiro foi excluído com sucesso.",
        variant: "success",
      });
      setBarberToDelete(null);
    } catch (_error) {
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
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError("");
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
                <div>
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
            onClick={() => setBarberToDelete(null)}
          />
          <div className="relative w-full max-w-md rounded-3xl border border-stone-800 bg-stone-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h4 className="text-lg font-bold text-stone-100">
                Remover barbeiro
              </h4>
              <button
                type="button"
                onClick={() => setBarberToDelete(null)}
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
            {deleteError ? (
              <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {deleteError}
              </div>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setBarberToDelete(null)}
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
