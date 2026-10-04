import { motion, useTransform, type MotionValue } from "framer-motion";
import { DOT_STEPS } from "./sceneManifest";

/** Accessible names only — the reference renders bare dots with no visible text. */
const LABELS: Record<(typeof DOT_STEPS)[number], string> = {
  0: "Your desk",
  2: "Why Jobly",
  4: "One resume",
  6: "Resume parsing",
  8: "ATS score",
  9: "Apply where you fit",
  11: "Live interview",
  12: "Interview feedback",
  13: "What to fix",
  15: "A better score",
  18: "Sign up",
};

interface SideDotsProps {
  pos: MotionValue<number>;
  activeIndex: number;
  light: boolean;
  onGo: (step: number) => void;
}

/**
 * `SideNavigation` / `SideNavigationItem`.
 *
 * The reference selects the FIRST item whose `step >= position`, which is what
 * keeps the dots in sync across the pass-through steps. Geometry from
 * `application.min.css`: 4x4px dot, 8px padding, 12px radius, `right: 6vh`,
 * `background-color 500ms ease-in-out`.
 *
 * Visible text labels are deliberately absent, as in the reference; the names
 * above are exposed via `aria-label` so the nav remains usable.
 */
export function SideDots({ pos, activeIndex, light, onGo }: SideDotsProps) {
  return (
    <nav
      aria-label="Landing sections"
      className="absolute top-1/2 z-50 hidden -translate-y-1/2 lg:block"
      style={{ right: "6vh" }}
    >
      <ol className="flex flex-col items-end">
        {DOT_STEPS.map((step) => (
          <Dot
            key={step}
            step={step}
            pos={pos}
            light={light}
            activeIndex={activeIndex}
            onGo={onGo}
          />
        ))}
      </ol>
    </nav>
  );
}

function Dot({
  step,
  pos,
  light,
  activeIndex,
  onGo,
}: {
  step: (typeof DOT_STEPS)[number];
  pos: MotionValue<number>;
  light: boolean;
  activeIndex: number;
  onGo: (step: number) => void;
}) {
  // SideNavigation.selectItemForStep: the first item whose step >= position wins.
  const selected = useTransform(pos, (v) => {
    let winner: number = DOT_STEPS[DOT_STEPS.length - 1];
    for (const s of DOT_STEPS) {
      if (s >= v) {
        winner = s;
        break;
      }
    }
    return winner === step ? 1 : 0;
  });

  const backgroundColor = useTransform(selected, (on) =>
    on ? "#ffffff" : light ? "var(--lp-ink)" : "#606060",
  );
  const boxShadow = useTransform(selected, (on) =>
    on ? "0 1px 1px rgba(0,0,0,.2)" : "0 0 0 rgba(0,0,0,0)",
  );

  return (
    <li>
      <button
        type="button"
        aria-label={LABELS[step]}
        aria-current={activeIndex === step ? "true" : undefined}
        onClick={() => onGo(step)}
        className="block cursor-pointer p-2"
        data-no-drag
      >
        <motion.span
          aria-hidden="true"
          className="block h-1 w-1 rounded-[12px] transition-[background-color] duration-500 ease-in-out"
          style={{ backgroundColor, boxShadow }}
        />
      </button>
    </li>
  );
}
