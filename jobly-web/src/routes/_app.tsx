import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { AppNav } from "@/components/Nav";
import { useAuth } from "@/lib/auth";
import { isImmersiveInterviewRoute } from "@/lib/interview-route";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isInterviewRoom = isImmersiveInterviewRoute(pathname);

  useEffect(() => {
    if (ready && !user) navigate({ to: "/auth" });
  }, [ready, user, navigate]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-marquee bg-[#2A9D7B]" />
        </div>
      </div>
    );
  }

  if (!user) {
    // Still render Outlet so child routes can handle their own auth redirects
    // but show loading state for immersive routes
    return (
      <Outlet />
    );
  }

  if (isInterviewRoom) {
    return (
      <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-[#0A0A0A] text-white">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="grain min-h-screen bg-cream text-ink">
      <AppNav />
      <Outlet />
    </div>
  );
}
