import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "monochrome" | "inverse";
  to?: string;
}

const sizes = {
  sm: { mark: "h-7 w-7 text-sm", word: "text-base" },
  md: { mark: "h-8 w-8 text-base", word: "text-lg" },
  lg: { mark: "h-10 w-10 text-lg", word: "text-xl" },
} as const;

export function Logo({
  className,
  size = "md",
  variant = "default",
  to = "/",
}: LogoProps) {
  const palette = {
    default: "bg-ink text-cream",
    monochrome: "bg-ink/90 text-cream",
    inverse: "bg-cream text-ink",
  }[variant];

  const wordClass = {
    default: "text-ink",
    monochrome: "text-ink",
    inverse: "text-cream",
  }[variant];

  return (
    <Link
      to={to}
      aria-label="Jobly — go to home"
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-display font-bold transition-transform duration-200 group-hover:scale-105",
          palette,
          sizes[size].mark,
        )}
        aria-hidden="true"
      >
        J
    </span>
      <span className={cn("font-display font-semibold tracking-tight", wordClass, sizes[size].word)}>
        Jobly
    </span>
  </Link>
  );
}

/** Icon-only mark for compact contexts (favicons, OG, tight headers). */
export function BrandMark({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex items-center justify-center rounded-lg bg-ink font-display font-bold text-cream",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.55 }}
    >
      J
  </span>
  );
}
