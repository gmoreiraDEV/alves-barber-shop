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

function fetchFresh(input: string) {
  return fetch(input, { cache: "no-store" }).then(ensureOk);
}

export async function loadHomeData(): Promise<LoadResult> {
  const [
    servicesResponse,
    barbersResponse,
    appointmentsResponse,
    absencesResponse,
    workingHoursResponse,
  ] = await Promise.all([
    fetchFresh("/api/services"),
    fetchFresh("/api/barbers"),
    fetchFresh("/api/appointments?minimal=true"),
    fetchFresh("/api/absences"),
    fetchFresh("/api/working-hours"),
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
    fetchFresh("/api/services?all=true"),
    fetchFresh("/api/barbers"),
    fetchFresh("/api/appointments"),
    fetchFresh("/api/absences"),
    fetchFresh("/api/working-hours"),
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
