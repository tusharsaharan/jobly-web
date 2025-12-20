import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Menu, UserRound, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 ${className}`}>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-ink font-display text-lg text-cream">
        J
      </span>
      <span className="font-display text-xl text-ink">Jobly</span>
    </Link>
  );
}

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

  return (
    <header
      className={`fixed top-0 z-40 w-full transition-[background-color,border-color] duration-200 ${
        hasSurface ? "border-b border-border bg-cream/94 backdrop-blur" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 sm:px-10">
        <div className={overlay ? "[&_*]:!text-white" : ""}>
          <Logo />
        </div>

        {links && links.length > 0 ? (
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {links.map((link) => {
              const active = link.to === "/" ? pathname === "/" : pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? overlay
                        ? "border-white text-white"
                        : "border-ink text-ink"
                      : overlay
                        ? "border-transparent text-white/75 hover:text-white"
                        : "border-transparent text-ink/60 hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        ) : null}

        <div className={`flex items-center gap-2 sm:gap-3 ${overlay ? "[&_.nav-text]:text-white" : "[&_.nav-text]:text-ink"}`}>
          {right}
          {links && links.length > 0 ? (
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              title={menuOpen ? "Close navigation" : "Open navigation"}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-md border transition-colors md:hidden ${
                overlay ? "border-white/35 text-white" : "border-border text-ink hover:bg-ink/5"
              }`}
            >
              {menuOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
            </button>
          ) : null}
        </div>
      </div>

      {links && links.length > 0 && menuOpen ? (
        <nav className="border-t border-border bg-cream px-6 py-3 md:hidden" aria-label="Mobile navigation">
          <div className="mx-auto grid max-w-7xl gap-1">
            {links.map((link) => {
              const active = link.to === "/" ? pathname === "/" : pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-md px-3 py-3 text-sm font-semibold ${
                    active ? "bg-mint-soft text-ink" : "text-ink/70 hover:bg-ink/5"
                  }`}
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
        <>
          <Link to={user ? "/profile" : "/auth"} className="nav-text hidden text-sm font-semibold hover:opacity-70 sm:inline">
            {user ? "Account" : "Log in"}
          </Link>
          <Link to={user ? "/dashboard" : "/auth"} className="pill-mint text-sm">
            {user ? "Dashboard" : "Get started"}
          </Link>
        </>
      }
    />
  );
}

export function AppNav() {
  const { user, logout } = useAuth();
  const seekerLinks: NavLink[] = [
    { to: "/dashboard", label: "Overview" },
    { to: "/jobs", label: "Jobs" },
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

  return (
    <TopNav
      links={links}
      right={
        <>
          <span className="nav-text hidden text-sm font-medium text-ink/55 lg:inline">
            {user?.name} | {user?.role === "recruiter" ? "Recruiter" : "Candidate"}
          </span>
          <Link
            to="/profile"
            aria-label="Open profile"
            title="Open profile"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-ink transition-colors hover:bg-mint-soft"
          >
            <UserRound className="h-4 w-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-border text-ink/70 transition-colors hover:bg-ink hover:text-cream"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </>
      }
    />
  );
}
