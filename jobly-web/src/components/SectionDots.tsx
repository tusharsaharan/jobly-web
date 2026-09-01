import { useEffect, useState } from "react";

type Item = { id: string; label: string };

export function SectionDots({ items }: { items: Item[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const els = items
      .map((i) => document.getElementById(i.id))
      .filter((e): e is HTMLElement => !!e);
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { threshold: [0.35, 0.6], rootMargin: "-20% 0px -20% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="Section navigation"
      className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-4 md:flex"
    >
      {items.map((i) => {
        const isActive = active === i.id;
        return (
          <a
            key={i.id}
            href={`#${i.id}`}
            aria-label={i.label}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(i.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="group relative flex h-3 w-3 items-center justify-center"
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                isActive
                  ? "h-3 w-3 bg-ink"
                  : "h-1.5 w-1.5 bg-ink/30 group-hover:bg-ink/60"
              }`}
            />
            <span className="pointer-events-none absolute right-6 whitespace-nowrap rounded-full bg-ink px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-cream opacity-0 transition-opacity group-hover:opacity-100">
              {i.label}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
