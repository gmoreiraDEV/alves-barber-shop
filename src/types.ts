export type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  isActive: boolean;
};

export type Barber = {
  id: string;
  name: string;
  specialties: string[];
  serviceIds: string[];
};

export type BarberAbsence = {
  id: string;
  barberId: string;
  startAt: string;
  endAt: string;
};

export type Appointment = {
  id: string;
  clientName: string;
  phone: string;
  date: string;
  serviceId: string;
  barberId: string;
  isActive: boolean;
  deletedAt?: string | null;
};

export type AppointmentRequest = {
  clientName: string;
  phone: string;
  date: string;
  serviceId: string;
  barberId: string;
};

export type BookAppointmentResult = {
  id: string;
  publicCode: string;
  date: string;
};

export type PublicAppointmentStatus = "scheduled" | "completed" | "canceled";

export type PublicAppointmentDetails = {
  id: string;
  publicCode: string;
  clientName: string;
  phoneMasked: string;
  date: string;
  status: PublicAppointmentStatus;
  canceledAt: string | null;
  canCancel: boolean;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  barberName: string;
};
