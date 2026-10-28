import { createFileRoute, Outlet } from "@tanstack/react-router";
import AppShell from "@/components/gridart/AppShell";
import { useAuth } from "@/lib/AuthContext";

export const Route = createFileRoute("/_authed")({
  ssr: false,
  component: AuthedLayout,
});

function AuthedLayout() {
  const { user } = useAuth();

  return (
    <AppShell user={user}>
      <Outlet />
    </AppShell>
  );
}