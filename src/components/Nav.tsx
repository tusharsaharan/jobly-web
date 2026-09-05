import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import { LogOut, Menu, UserRound, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

interface NavLink {
  label: string;
  to: string;
}

interface TopNavProps {
  dark?: boolean;
  links?: NavLink[];
  right?: ReactNode;
}

export function TopNav({ links, right, dark = false }: TopNavProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const overlay = dark && !scrolled && !menuOpen;
  const hasSurface = !overlay;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const linkActive = (to: string) => {
    if (to === "/") return pathname === "/";
    return pathname === to || pathname.startsWith(`${to}/`);
  };

  return (
    <header
      className={cn(
        "fixed top-0 z-40 w-full transition-[background-color,border-color] duration-200",
        hasSurface ? "border-b border-border bg-cream/94 backdrop-blur" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 sm:px-10">
        <Logo variant={overlay ? "inverse" : "default"} />

        {links && links.length > 0 ? (
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {links.map((link) => {
              const active = linkActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "border-b-2 px-3 py-2 text-sm font-semibold transition-colors",
                    active
                      ? overlay
                        ? "border-white text-white"
                        : "border-ink text-ink"
                      : overlay
                        ? "border-transparent text-white/75 hover:text-white"
                        : "border-transparent text-ink/60 hover:text-ink",
                  )}
                >
                  {link.label}
               </Link>
              );
            })}
         </nav>
        ) : null}

        <div className="flex items-center gap-2 sm:gap-3">
          {right}
          {links && links.length > 0 ? (
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors md:hidden",
                overlay
                  ? "border-white/35 text-white hover:bg-white/10"
                  : "border-border text-ink hover:bg-mint-soft",
              )}
            >
              {menuOpen ? (
                <X className="h-4 w-4" aria-hidden />
              ) : (
                <Menu className="h-4 w-4" aria-hidden />
              )}
           </button>
          ) : null}
       </div>
     </div>

      {links && links.length > 0 && menuOpen ? (
        <nav
          className="border-t border-border bg-cream px-6 py-3 md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="mx-auto grid max-w-7xl gap-1">
            {links.map((link) => {
              const active = linkActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-3 text-sm font-semibold transition-colors",
                    active
                      ? "bg-mint-soft text-ink"
                      : "text-ink/70 hover:bg-mint-tint",
                  )}
                >
                  {link.label}
               </Link>
              );
            })}
         </div>
       </nav>
      ) : null}
   </header>
  );
}

export function PublicNav({ dark = false }: { dark?: boolean }) {
  const { user } = useAuth();
  return (
    <TopNav
      dark={dark}
      right={
        <Link to={user ? "/dashboard" : "/auth"} className="pill-mint text-sm">
          {user ? "Open dashboard" : "Get started"}
        </Link>
      }
    />
  );
}

interface LandingNavProps {
  light: boolean;
  revealed: boolean;
}

/** Beagle-style landing nav: slides down after the preloader and crossfades
 *  its logo + links between the light and dark scene themes while scrolling. */
export function LandingNav({ light, revealed }: LandingNavProps) {
  const { user } = useAuth();

  return (
    <motion.header
      className={cn(
        "fixed top-0 z-40 w-full transition-colors duration-500",
        light ? "text-ink" : "text-cream",
      )}
      initial={{ y: -96 }}
      animate={{ y: revealed ? 0 : -96 }}
      transition={{ duration: 0.8, ease: [0.5, 0, 0.5, 1] }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 sm:px-10">
        <span className="relative inline-flex items-center gap-2.5" aria-hidden="true">
          <span
            className={cn(
              "absolute inset-0 flex items-center transition-opacity duration-500",
              light ? "opacity-100" : "opacity-0",
            )}
          >
            <Logo size="sm" />
          </span>
          <span
            className={cn(
              "absolute inset-0 flex items-center transition-opacity duration-500",
              light ? "opacity-0" : "opacity-100",
            )}
          >
            <Logo size="sm" variant="inverse" />
          </span>
          <span className="invisible flex items-center gap-2.5">
            <Logo size="sm" />
          </span>
        </span>

        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            to={user ? "/dashboard" : "/auth"}
            className={cn(
              "hidden text-[13px] font-semibold transition-colors sm:inline",
              light ? "text-ink/80 hover:text-ink" : "text-cream/80 hover:text-cream",
            )}
          >
            {user ? "Dashboard" : "Log in"}
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex min-h-10 items-center rounded-full bg-mint px-5 text-[13px] font-bold text-ink transition-colors hover:bg-mint-hover"
          >
            Sign up
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

export function AppNav() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const seekerLinks: NavLink[] = [
    { to: "/dashboard", label: "Overview" },
    { to: "/jobs", label: "Jobs" },
    { to: "/learn", label: "Learn" },
    { to: "/resume", label: "Resume" },
    { to: "/applications", label: "Applications" },
    { to: "/interviews", label: "Interviews" },
  ];
  const recruiterLinks: NavLink[] = [
    { to: "/dashboard", label: "Overview" },
    { to: "/post-job", label: "Post a role" },
    { to: "/applicants", label: "Applicants" },
    { to: "/interviews", label: "Interviews" },
  ];
  const links = user?.role === "recruiter" ? recruiterLinks : seekerLinks;

  const handleLogout = async () => {
    await logout();
    router.navigate({ to: "/auth" });
  };

  return (
    <TopNav
      links={links}
      right={
        <>
          <span className="hidden font-mono text-[10px] uppercase tracking-wider text-ink/45 lg:inline">
            {user?.name} · {user?.role === "recruiter" ? "Recruiter" : "Candidate"}
         </span>
          <Link
            to="/profile"
            aria-label="Open profile"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-ink transition-colors hover:bg-mint-soft"
          >
            <UserRound className="h-4 w-4" aria-hidden />
         </Link>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border text-ink/70 transition-colors hover:bg-ink hover:text-cream"
          >
            <LogOut className="h-4 w-4" aria-hidden />
         </button>
        </>
      }
    />
  );
}
