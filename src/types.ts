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

export type WorkingHoursDay = {
  dayOfWeek: number;
  isOpen: boolean;
  startTime: string;
  endTime: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  normalizedPhone: string;
  createdAt: string;
  updatedAt: string;
  appointmentsCount: number;
};

export type Appointment = {
  id: string;
  clientName: string;
  phone: string;
  date: string;
  serviceId: string;
  barberId: string;
  customerId?: string | null;
  customerIsNew?: boolean;
  isActive: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  customer?: Customer | null;
};

export type AppointmentBookingItem = {
  clientName: string;
  serviceId: string;
};

export type AppointmentRequest = {
  phone: string;
  date: string;
  barberId: string;
  items: AppointmentBookingItem[];
};

export type BookAppointmentEntry = {
  id: string;
  clientName: string;
  date: string;
  serviceId: string;
};

export type BookAppointmentResult = {
  appointments: BookAppointmentEntry[];
};

export type PublicAppointmentStatus = "scheduled" | "completed" | "canceled";

export type PublicAppointmentDetails = {
  id: string;
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
