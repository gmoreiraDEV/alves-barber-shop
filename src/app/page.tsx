import AppShell from "@/components/AppShell";
import HomePage from "@/components/HomePage";

export default function Home() {
  return (
    <AppShell actionHref="/dashboard" actionLabel="Admin">
      <HomePage />
    </AppShell>
  );
}
