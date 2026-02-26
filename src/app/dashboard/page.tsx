import AppShell from "@/components/AppShell";
import DashboardPage from "@/components/DashboardPage";

export default function Dashboard() {
  return (
    <AppShell actionHref="/" actionLabel="Voltar à Loja">
      <DashboardPage />
    </AppShell>
  );
}
