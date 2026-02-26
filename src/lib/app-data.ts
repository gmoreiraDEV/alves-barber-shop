import type { Appointment, Barber, BarberAbsence, Service } from "@/types";

export type LoadResult = {
  services: Service[];
  barbers: Barber[];
  appointments: Appointment[];
  absences: BarberAbsence[];
};

async function ensureOk(response: Response) {
  if (!response.ok) {
    throw new Error("Falha ao carregar dados");
  }

  return response;
}

export async function loadHomeData(): Promise<LoadResult> {
  const [
    servicesResponse,
    barbersResponse,
    appointmentsResponse,
    absencesResponse,
  ] = await Promise.all([
    fetch("/api/services").then(ensureOk),
    fetch("/api/barbers").then(ensureOk),
    fetch("/api/appointments?minimal=true").then(ensureOk),
    fetch("/api/absences").then(ensureOk),
  ]);

  const [services, barbers, appointments, absences] = await Promise.all([
    servicesResponse.json(),
    barbersResponse.json(),
    appointmentsResponse.json(),
    absencesResponse.json(),
  ]);

  return {
    services,
    barbers,
    appointments,
    absences,
  };
}

export async function loadAdminData(): Promise<LoadResult> {
  const [
    servicesResponse,
    barbersResponse,
    appointmentsResponse,
    absencesResponse,
  ] = await Promise.all([
    fetch("/api/services?all=true").then(ensureOk),
    fetch("/api/barbers").then(ensureOk),
    fetch("/api/appointments").then(ensureOk),
    fetch("/api/absences").then(ensureOk),
  ]);

  const [services, barbers, appointments, absences] = await Promise.all([
    servicesResponse.json(),
    barbersResponse.json(),
    appointmentsResponse.json(),
    absencesResponse.json(),
  ]);

  return {
    services,
    barbers,
    appointments,
    absences,
  };
}
