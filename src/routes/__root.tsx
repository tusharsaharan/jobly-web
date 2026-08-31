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
import { FocusModeProvider, useFocusMode } from "@/contexts/FocusModeContext";
import { CommandPalette } from "@/components/CommandPalette";

function ToasterWrapper() {
  const { isFocusMode } = useFocusMode();
  if (isFocusMode) return null;
  return <Toaster theme="light" position="bottom-right" richColors closeButton />;
}

function SkipToContent() {
  return (
    <a href="#main" className="skip-link">
      Skip to main content
   </a>
  );
}

function NotFoundComponent() {
  return (
    <main
      id="main"
      className="flex min-h-screen items-center justify-center bg-cream px-4"
    >
      <div className="max-w-md text-center">
        <p className="marker-num">404 · lost</p>
        <h1 className="mt-3 font-display text-7xl text-ink">Off the map</h1>
        <p className="mt-4 text-sm text-ink/70">
          This page slipped through the cracks. Let&rsquo;s get you back.
       </p>
        <Link to="/" className="pill-mint mt-8">Take me home</Link>
     </div>
   </main>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <main
      id="main"
      className="flex min-h-screen items-center justify-center bg-cream px-4"
    >
      <div className="max-w-md text-center">
        <p className="marker-num">error · 500</p>
        <h1 className="mt-3 font-display text-5xl text-ink">Something snapped</h1>
        <p className="mt-4 text-sm text-ink/70">
          Refresh the page or head home &mdash; we&rsquo;ll log the rest.
       </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="pill-mint"
          >
            Try again
         </button>
          <Link to="/" className="pill-ghost">
            Go home
         </Link>
       </div>
     </div>
   </main>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#f5f5f3" },
      { name: "color-scheme", content: "light" },
      { title: "Jobly — Find roles your resume already wins" },
      {
        name: "description",
        content:
          "Jobly turns your resume into a fit score for every role, then keeps every conversation in one calm workspace. Free for candidates and recruiters.",
      },
      { name: "author", content: "Jobly" },
      { name: "application-name", content: "Jobly" },
      { property: "og:title", content: "Jobly — Find roles your resume already wins" },
      {
        property: "og:description",
        content:
          "Upload your resume, see your match score, and keep every conversation close to the role that started it.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Jobly" },
      { property: "og:image", content: "/og-default.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Jobly — Find roles your resume already wins" },
      {
        name: "twitter:description",
        content:
          "Upload your resume, see your match score, and keep every conversation close to the role that started it.",
      },
      { name: "twitter:image", content: "/og-default.png" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.svg" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "stylesheet", href: appCss },
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
        <SkipToContent />
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
  const cursorEnabled = pathname === "/" || pathname.startsWith("/auth") === false && pathname === "/";

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FocusModeProvider>
          <div className="relative min-h-screen bg-cream text-ink">
            <div className="flex min-h-screen flex-col">
              <main id="main" className="flex-1">
                <Outlet />
             </main>
              {!isAuthPage && <Footer />}
           </div>
            <ToasterWrapper />
            <Cursor enabled={pathname === "/"} />
            <CommandPalette />
         </div>
       </FocusModeProvider>
     </AuthProvider>
   </QueryClientProvider>
  );
}
