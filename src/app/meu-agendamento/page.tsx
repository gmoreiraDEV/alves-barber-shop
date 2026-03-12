import AppointmentLookupPage from "@/components/AppointmentLookupPage";
import AppShell from "@/components/AppShell";

type PublicAppointmentPageProps = {
  searchParams: Promise<{ code?: string }>;
};

export default async function PublicAppointmentPage({
  searchParams,
}: PublicAppointmentPageProps) {
  const { code } = await searchParams;

  return (
    <AppShell actionHref="/" actionLabel="Agendar">
      <AppointmentLookupPage initialCode={code} />
    </AppShell>
  );
}
