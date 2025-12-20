import { Link } from "@tanstack/react-router";
import { Github, Instagram, Linkedin, Twitter } from "lucide-react";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "For candidates", to: "/auth" as const },
      { label: "For recruiters", to: "/auth" as const },
      { label: "How it works", to: "/" as const },
    ],
  },
  {
    title: "Workspace",
    links: [
      { label: "Dashboard", to: "/dashboard" as const },
      { label: "Jobs", to: "/jobs" as const },
      { label: "Applications", to: "/applications" as const },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/" as const },
      { label: "Contact", to: "/" as const },
      { label: "Privacy", to: "/" as const },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-cream px-6 pb-10 pt-14 sm:px-10">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
        <div>
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-cream">
              <span className="h-2.5 w-2.5 rounded-full bg-mint" />
            </span>
            <span className="font-display text-lg text-ink">Jobly</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-ink/65">
            A calmer job-matching workspace. Bring your resume, understand every match, and
            keep every application moving.
          </p>
          <div className="mt-6 flex items-center gap-3 text-ink/60">
            <a href="#" aria-label="Twitter" className="hover-icon rounded-md p-1.5">
              <Twitter className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Instagram" className="hover-icon rounded-md p-1.5">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" aria-label="LinkedIn" className="hover-icon rounded-md p-1.5">
              <Linkedin className="h-4 w-4" />
            </a>
            <a href="#" aria-label="GitHub" className="hover-icon rounded-md p-1.5">
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-ink">{col.title}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-ink/65 transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-xs text-ink/55">
        <p>© {new Date().getFullYear()} Jobly. All rights reserved.</p>
        <p>Better job matching for candidates and recruiters.</p>
      </div>
    </footer>
  );
}
