import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportError } from "../lib/error-reporting";
import { AuthProvider } from "@/lib/auth";
import { Cursor } from "@/components/cursor/Cursor";
import { Footer } from "@/components/Footer";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="max-w-md text-center">
        <p className="marker-num">404 · lost</p>
        <h1 className="mt-3 font-display text-7xl text-ink">Off the map</h1>
        <p className="mt-4 text-sm text-ink/70">
          This page slipped through the cracks. Let's get you back.
        </p>
        <Link to="/" className="pill-mint mt-8">Take me home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="max-w-md text-center">
        <p className="marker-num">error · 500</p>
        <h1 className="mt-3 font-display text-5xl text-ink">Something snapped</h1>
        <p className="mt-4 text-sm text-ink/70">
          Refresh the page or head home — we'll log the rest.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="pill-mint"
          >
            Try again
          </button>
          <a href="/" className="rounded-full border border-border px-5 py-2.5 text-sm text-ink">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Jobly — Find roles your resume already wins" },
      {
        name: "description",
        content:
          "An editorial job-matching workspace. Upload your resume, see your match score, and apply in one move.",
      },
      { name: "author", content: "Jobly" },
      { property: "og:title", content: "Jobly — Roles your resume already wins" },
      {
        property: "og:description",
        content: "An editorial job-matching workspace for seekers and recruiters.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = router.state.location.pathname;
  const isAuthPage = pathname === "/auth";

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="relative min-h-screen bg-cream text-ink">
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">
              <Outlet />
            </div>
            {!isAuthPage && <Footer />}
          </div>
          <Toaster position="bottom-right" />
          <Cursor />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}
