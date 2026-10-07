import { motion, useTransform, type MotionValue } from "framer-motion";
import { DOT_STEPS } from "./sceneManifest";

/** Accessible names only — the reference renders bare dots with no visible text. */
const LABELS: Record<number, string> = {
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
  /** Which steps get a dot. Defaults to the long `sceneManifest` story. */
  steps?: readonly number[];
  /** `step -> aria-label`. Defaults to the long story's labels. */
  labels?: Record<number, string>;
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
export function SideDots({
  pos,
  activeIndex,
  light,
  onGo,
  steps = DOT_STEPS,
  labels = LABELS,
}: SideDotsProps) {
  return (
    <nav
      aria-label="Landing sections"
      className="absolute top-1/2 z-50 hidden -translate-y-1/2 lg:block"
      style={{ right: "6vh" }}
    >
      <ol className="flex flex-col items-end">
        {steps.map((step) => (
          <Dot
            key={step}
            step={step}
            steps={steps}
            label={labels[step] ?? `Section ${step}`}
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
  steps,
  label,
  pos,
  light,
  activeIndex,
  onGo,
}: {
  step: number;
  steps: readonly number[];
  label: string;
  pos: MotionValue<number>;
  light: boolean;
  activeIndex: number;
  onGo: (step: number) => void;
}) {
  // SideNavigation.selectItemForStep: the first item whose step >= position wins.
  const selected = useTransform(pos, (v) => {
    let winner: number = steps[steps.length - 1];
    for (const s of steps) {
      if (s >= v) {
        winner = s;
        break;
      }
    }
    return winner === step ? 1 : 0;
  });

  // The reference is always-dark, so it hardcodes a white selected dot. Once a
  // beat rests on a LIGHT surface (the mint import band) that dot is invisible,
  // so the selected colour has to follow the surface too.
  const backgroundColor = useTransform(selected, (on) =>
    on
      ? light
        ? "var(--lp-ink)"
        : "#ffffff"
      : light
        ? "rgb(47 48 45 / 0.32)"
        : "#606060",
  );
  const boxShadow = useTransform(selected, (on) =>
    on ? "0 1px 1px rgba(0,0,0,.2)" : "0 0 0 rgba(0,0,0,0)",
  );

  return (
    <li>
      <button
        type="button"
        aria-label={label}
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
