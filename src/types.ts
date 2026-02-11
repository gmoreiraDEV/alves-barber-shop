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
