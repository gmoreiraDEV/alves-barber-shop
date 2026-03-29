import AppointmentLookupPage from "@/components/AppointmentLookupPage";
import AppShell from "@/components/AppShell";

export default function PublicAppointmentPage() {
  return (
    <AppShell actionHref="/" actionLabel="Agendar">
      <AppointmentLookupPage />
    </AppShell>
  );
}
