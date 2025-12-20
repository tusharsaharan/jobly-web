import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AppNav } from "@/components/Nav";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !user) navigate({ to: "/auth" });
  }, [ready, user, navigate]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-2 w-24 overflow-hidden rounded-full bg-ink/10">
          <div className="h-full w-1/2 animate-marquee bg-lime" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="grain min-h-screen bg-cream text-ink">
      <AppNav />
      <Outlet />
    </div>
  );
}
