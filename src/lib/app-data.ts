import type {
  Appointment,
  Barber,
  BarberAbsence,
  Service,
  WorkingHoursDay,
} from "@/types";

export type LoadResult = {
  services: Service[];
  barbers: Barber[];
  appointments: Appointment[];
  absences: BarberAbsence[];
  workingHours: WorkingHoursDay[];
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
    workingHoursResponse,
  ] = await Promise.all([
    fetch("/api/services").then(ensureOk),
    fetch("/api/barbers").then(ensureOk),
    fetch("/api/appointments?minimal=true").then(ensureOk),
    fetch("/api/absences").then(ensureOk),
    fetch("/api/working-hours").then(ensureOk),
  ]);

  const [services, barbers, appointments, absences, workingHours] =
    await Promise.all([
      servicesResponse.json(),
      barbersResponse.json(),
      appointmentsResponse.json(),
      absencesResponse.json(),
      workingHoursResponse.json(),
    ]);

  return {
    services,
    barbers,
    appointments,
    absences,
    workingHours,
  };
}

export async function loadAdminData(): Promise<LoadResult> {
  const [
    servicesResponse,
    barbersResponse,
    appointmentsResponse,
    absencesResponse,
    workingHoursResponse,
  ] = await Promise.all([
    fetch("/api/services?all=true").then(ensureOk),
    fetch("/api/barbers").then(ensureOk),
    fetch("/api/appointments").then(ensureOk),
    fetch("/api/absences").then(ensureOk),
    fetch("/api/working-hours").then(ensureOk),
  ]);

  const [services, barbers, appointments, absences, workingHours] =
    await Promise.all([
      servicesResponse.json(),
      barbersResponse.json(),
      appointmentsResponse.json(),
      absencesResponse.json(),
      workingHoursResponse.json(),
    ]);

  return {
    services,
    barbers,
    appointments,
    absences,
    workingHours,
  };
}
