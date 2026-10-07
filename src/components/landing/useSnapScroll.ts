import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useMotionValue, type MotionValue } from "framer-motion";
import {
  cubicOut,
  cubicInOut,
  easeInOut,
  easeOut,
  limit,
  quadInOut,
  type EaseFn,
} from "./beagleEase";
import { PASS_THROUGH_STEPS, surfaceAt, type Surface } from "./sceneManifest";

/**
 * Faithful port of the Beagle scroll engine: `nolz.SwipeController` +
 * `nolz.DragHandlerObject` + `nolz.DragController`'s wheel/key handling.
 *
 * Reference: `.beagle-ref/application.js` — see `.beagle-ref/FINDINGS.md` for the
 * quoted source of every constant below.
 *
 * Two-value model. `aim` is the tween target; `pos` follows it with an
 * exponential lerp on every frame. That lag *is* the weight of the original.
 *
 *   render():  |aim - pos| < 1e-6  ?  pos = aim  :  pos += 0.33 * (aim - pos)
 *
 * The reference works in pixels (`y = -step * viewportHeight`) and converts at
 * the boundary. We keep the same arithmetic so the ported durations — all of
 * which are expressed as `k * |dy| / viewportHeight` — stay exact.
 *
 * STORY-AGNOSTIC: the pass-through set and the surface lookup arrive as
 * options, defaulting to the long `sceneManifest` story. They used to be
 * module-scope imports, which meant only one story could ever drive the engine.
 */

const LERP = 0.33;
const WHEEL_STEP_PX = 300;
const WHEEL_IDLE_MS = 200;
const TRACKPAD_THROTTLE_MS = 100;
const RUBBER = 0.35;

/** `ScreenManager.BREAKPOINT_2COLUMN` — the `endStep - 1` rule is desktop-only. */
const BREAKPOINT_2COLUMN = 1023;

const isFormField = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable
  );
};

/**
 * `nolz.Framework.ConvertWheelDelta`, ported verbatim (application.js @5845).
 * `f` is an undeclared implicit global in the original; scoped here.
 */
function convertWheelDelta(e: WheelEvent): number {
  const legacy = e as WheelEvent & { detail?: number; wheelDelta?: number };
  const detail = legacy.detail ?? 0;
  const wheelDelta = legacy.wheelDelta ?? -e.deltaY * (e.deltaMode === 1 ? 40 / 3 : 40 / 120);
  const D = 225;
  const E = D - 1;

  let b: number;
  if (detail) {
    const f = wheelDelta ? wheelDelta / detail : 0;
    b = f ? detail / f : -detail / 1.35;
  } else {
    b = wheelDelta / 120;
  }

  if (b < 1) {
    if (b < -1) b = (-Math.pow(b, 2) - E) / D;
  } else {
    b = (Math.pow(b, 2) + E) / D;
  }

  return Math.min(Math.max(b / 2, -1), 1);
}

/** Rubber-band overscroll: `_handlePositionOnMove` for a negative limit. */
const handlePositionOnMove = (y: number, yLimit: number): number => {
  if (y < yLimit) return y - (y - yLimit) + RUBBER * (y - yLimit);
  if (y > 0) return RUBBER * y;
  return y;
};

/** Hard clamp: `_handlePositionOnEnd`. */
const handlePositionOnEnd = (y: number, yLimit: number): number => Math.min(0, Math.max(yLimit, y));

interface Tween {
  from: number;
  to: number;
  start: number;
  dur: number;
  ease: EaseFn;
  onDone?: () => void;
  apply: (y: number) => void;
}

interface DragState {
  pointerId: number;
  startY: number;
  lastDist: number;
  lastMoveTime: number;
  originY: number;
}

export interface EngineHandle {
  moveTo: (step: number) => void;
  slideTo: (step: number) => void;
  moveToHome: () => void;
  moveToEnd: () => void;
  getPos: () => number;
  getAim: () => number;
  /**
   * Park the camera at an arbitrary, possibly fractional step.
   *
   * `moveTo` cannot do this: it snaps to whole viewports (`getSnapPositionY`)
   * and fires `onActivityEnd`, so the pass-through steps immediately advance
   * away. This sets aim and position together, which leaves `render()` with
   * nothing to do and no activity to end. Screenshot harnesses only — nothing
   * in the UI should call it.
   */
  parkAt: (step: number) => void;
}

/**
 * Everything about the engine that is a property of the STORY rather than of
 * the scroll physics.
 */
export interface StoryOptions {
  /**
   * Steps `onActivityEnd` refuses to rest on — the chapter changes. Resting
   * here immediately continues in the direction of travel.
   */
  passThrough?: readonly number[];
  /** Drives `whiteTheme`: dark surfaces get white nav + white dots. */
  surfaceAt?: (pos: number) => Surface;
  /**
   * The reference also treats `endStep - 1` as a desktop-only pass-through,
   * because ITS penultimate step is transitional. That is a property of the
   * story, not the engine: in a story whose penultimate step is a real resting
   * beat the rule silently makes that beat unreachable on any viewport wider
   * than 1023px. Off means "my second-to-last step is a real beat".
   */
  edgePassThrough?: boolean;
}

class BeagleEngine {
  /* ── SwipeController state (in steps) ── */
  private scrollPosition = 0;
  private scrollPositionAim = 0;
  movementDirection = 1;

  /* ── DragHandlerObject state (in px) ── */
  private _y = 0;
  private _lastDistY = 0;
  private lastMoveTime: number | null = null;
  private movementAspect = 1;
  private tween: Tween | null = null;

  private vh = 1;
  private vw = 1;
  private yLimit = 0;
  private raf = 0;
  private wheelIdleTimer: ReturnType<typeof setTimeout> | null = null;
  private trackpad = false;
  private trackpadBlocked = false;
  private drag: DragState | null = null;
  private stage: HTMLElement | null = null;

  /* ── story config ── */
  private passThrough: Set<number>;
  private surfaceAt: (pos: number) => Surface;
  private edgePassThrough: boolean;

  constructor(
    private endStep: number,
    private posValue: MotionValue<number>,
    private onIndex: (i: number) => void,
    private onTheme: (whiteTheme: boolean, navVisible: boolean) => void,
    private isLocked: () => boolean,
    story: StoryOptions = {},
  ) {
    this.passThrough = new Set<number>(story.passThrough ?? PASS_THROUGH_STEPS);
    this.surfaceAt = story.surfaceAt ?? surfaceAt;
    this.edgePassThrough = story.edgePassThrough ?? true;
  }

  /* ─────────── lifecycle ─────────── */

  attach(stage: HTMLElement) {
    this.stage = stage;
    this.measure();
    // MainScene: jumpTo(-1) then slideTo(0) — the story slides up into frame.
    this.jumpTo(-1);
    window.addEventListener("resize", this.onResize);
    window.addEventListener("wheel", this.onWheel, { passive: false });
    window.addEventListener("keydown", this.onKeyDown);
    stage.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
    this.raf = requestAnimationFrame(this.frame);
  }

  detach() {
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("keydown", this.onKeyDown);
    this.stage?.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.clearWheelIdle();
    this.stopTween();
    this.stage?.classList.remove("dragging");
    this.stage = null;
  }

  private measure() {
    this.vh = window.innerHeight || 1;
    this.vw = window.innerWidth || 1;
    // SwipeController: setYLimit(-(scrollLimit - 1) * viewportSizeInPixels)
    this.yLimit = -(this.endStep + 1 - 1) * this.vh;
    // MainScene.calculateDragHandlerMovementAspect
    this.movementAspect = limit(this.vh / 1024, 1, 2);
  }

  private onResize = () => {
    const step = this.scrollPositionAim;
    this.measure();
    this.stopTween();
    this.jumpTo(step);
  };

  /* ─────────── render loop ─────────── */

  private frame = () => {
    this.raf = requestAnimationFrame(this.frame);
    if (this.tween) this.stepTween();
    this.render();
  };

  /** SwipeController.render */
  private render() {
    if (Math.abs(this.scrollPositionAim - this.scrollPosition) < 1e-6) {
      if (this.scrollPosition !== this.scrollPositionAim) {
        this.scrollPosition = this.scrollPositionAim;
        this.posValue.set(this.scrollPosition);
      }
      return;
    }
    this.scrollPosition += LERP * (this.scrollPositionAim - this.scrollPosition);
    this.posValue.set(this.scrollPosition);
  }

  private isStandingStill() {
    return this.scrollPosition === this.scrollPositionAim;
  }

  /* ─────────── step <-> px bridge ─────────── */

  private jumpTo(step: number) {
    this.scrollPositionAim = this.scrollPosition = step;
    this._y = -step * this.vh;
    this.posValue.set(step);
    this.emit(step);
  }

  /** SwipeController.setPosition — no clamp on the drag/tween path. */
  private setDragPositionY(y: number) {
    this.scrollPositionAim = -y / this.vh;
    this.movementDirection = this.scrollPositionAim - this.scrollPosition < 0 ? -1 : 1;
  }

  private getDragPositionY() {
    return -this.scrollPosition * this.vh;
  }

  private getWheelPositionY() {
    return -this.scrollPositionAim * this.vh;
  }

  /** MainScene.getSnapPositionY */
  private snap(y: number) {
    return Math.round(y / this.vh) * this.vh;
  }

  /** SwipeController.getCurrentIndex */
  private currentIndex() {
    return Math.round(this.scrollPositionAim);
  }

  /* ─────────── theme / nav ─────────── */

  /**
   * `DragHandlerObject.onPositionChange`.
   *
   * The reference hardcodes `p<1 || 1<p<3 || 6<p<9` here. That was tuned to
   * Beagle's own backgrounds and renders dark-on-dark once the surfaces change,
   * so the theme is derived from the scene manifest instead — chrome and
   * background can't drift apart.
   */
  private emit(step: number) {
    const whiteTheme = this.surfaceAt(step) === "dark";
    this.onTheme(whiteTheme, step < this.endStep);
    this.onIndex(limit(Math.round(step), 0, this.endStep));
  }

  /* ─────────── tween ─────────── */

  private stopTween() {
    this.tween = null;
  }

  private startTween(
    from: number,
    to: number,
    dur: number,
    ease: EaseFn,
    apply: (y: number) => void,
    onDone?: () => void,
  ) {
    if (to - from === 0) return;
    this.tween = { from, to, start: performance.now(), dur: Math.max(1, dur), ease, onDone, apply };
  }

  private stepTween() {
    const t = this.tween;
    if (!t) return;
    const elapsed = performance.now() - t.start;
    if (elapsed >= t.dur) {
      t.apply(t.to);
      this.tween = null;
      t.onDone?.();
      return;
    }
    t.apply(t.ease(elapsed, t.from, t.to - t.from, t.dur));
  }

  private setAndStorePositionY = (y: number) => {
    this._y = y;
    this.setDragPositionY(y);
  };

  /** One wheel gesture = one resting beat. Groups the burst of wheel events
   *  between idles so a single flick can never sail through several sections. */
  private wheelBurstStart: number | null = null;
  private wheelBurstDir = 0;

  /* ─────────── pass-through ─────────── */

  /** MainScene's `dragHandlerObject.onActivityEnd`. */
  private onActivityEnd = () => {
    const i = this.currentIndex();
    if (this.passThrough.has(i)) {
      this.moveTo(this.movementDirection === 1 ? i + 1 : i - 1);
      return;
    }
    if (this.edgePassThrough && this.vw > BREAKPOINT_2COLUMN && i === this.endStep - 1) {
      this.moveTo(this.movementDirection === 1 ? this.endStep : this.endStep - 2);
    }
  };

  /* ─────────── wheel ─────────── */

  private clearWheelIdle() {
    if (this.wheelIdleTimer) clearTimeout(this.wheelIdleTimer);
    this.wheelIdleTimer = null;
  }

  private armWheelIdle() {
    this.clearWheelIdle();
    this.wheelIdleTimer = setTimeout(() => {
      this.wheelIdleTimer = null;
      this.endWheelBurst();
    }, WHEEL_IDLE_MS);
  }

  /** DragController.onMouseWheelYHandler */
  private onWheel = (e: WheelEvent) => {
    if (this.isLocked() || isFormField(e.target)) return;
    e.preventDefault();

    let d = convertWheelDelta(e);
    if (Math.abs(d) < 0.03) d = 0;
    if (Math.abs(d) < 0.4) {
      d *= 10;
      this.trackpad = true;
    }

    if (d === 0) {
      this.clearWheelIdle();
      this.endWheelBurst();
      return;
    }

    d = limit(d, -1, 1);
    if (this.trackpad) {
      // Framework.LimitCall(onWheelStep, 100) — trailing-edge throttle.
      if (!this.trackpadBlocked) {
        this.trackpadBlocked = true;
        const delta = d;
        setTimeout(() => {
          this.trackpadBlocked = false;
          this.onWheelStep(delta);
        }, TRACKPAD_THROTTLE_MS);
      }
    } else {
      this.onWheelStep(d);
    }
    this.armWheelIdle();
  };

  /**
   * A burst of wheel events only LEANS the aim — capped at 0.6 steps from
   * where the burst began — so the content answers immediately but can never
   * run away. The render-loop lerp turns that lean into smooth motion; when
   * the wheel goes idle, `endWheelBurst` glides exactly one resting step in
   * the dominant direction. Pass-through chapters (1, 3, 5) still
   * auto-continue via `onActivityEnd`, so one gesture is one chapter.
   */
  private onWheelStep(delta: number) {
    if (this.wheelBurstStart == null) {
      this.stopTween();
      this.wheelBurstStart = limit(Math.round(this.scrollPositionAim), 0, this.endStep);
      this._y = this.getWheelPositionY();
    }
    // Negative deltas travel toward higher steps.
    this.wheelBurstDir = delta > 0 ? -1 : 1;
    const yStart = -this.wheelBurstStart * this.vh;
    const maxLean = 0.6 * this.vh;
    this._y = limit(
      this._y + WHEEL_STEP_PX * delta * this.movementAspect,
      yStart - maxLean,
      yStart + maxLean,
    );
    this.setDragPositionY(this._y);
    this.emit(-this._y / this.vh);
  }

  /** The wheel went idle: settle exactly one step from where the burst began. */
  private endWheelBurst() {
    if (this.wheelBurstStart == null) return;
    const target = limit(this.wheelBurstStart + this.wheelBurstDir, 0, this.endStep);
    this.wheelBurstStart = null;
    this.wheelBurstDir = 0;
    this.moveTo(target);
  }

  /* ─────────── drag ─────────── */

  private onPointerDown = (e: PointerEvent) => {
    if (this.isLocked()) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const t = e.target as HTMLElement | null;
    if (t?.closest("a,button,input,textarea,select,[data-no-drag]")) return;

    this.stopTween();
    // A grab cancels any pending wheel burst, or its idle timer would settle
    // a step from under the drag a moment later.
    this.clearWheelIdle();
    this.wheelBurstStart = null;
    this.wheelBurstDir = 0;
    this._y = this.getDragPositionY();
    this.lastMoveTime = Date.now();
    this.drag = {
      pointerId: e.pointerId,
      startY: e.clientY,
      lastDist: 0,
      lastMoveTime: Date.now(),
      originY: this._y,
    };
    this._lastDistY = 0;
    try {
      this.stage?.setPointerCapture(e.pointerId);
    } catch {
      /* best effort */
    }
    this.stage?.classList.add("dragging");
  };

  /** DragHandlerObject.onDragMoveY */
  private onPointerMove = (e: PointerEvent) => {
    const drag = this.drag;
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dist = e.clientY - drag.startY;
    const target = handlePositionOnMove(drag.originY + dist * this.movementAspect, this.yLimit);
    this._lastDistY = target - this._y;
    this._y = target;
    this.setDragPositionY(this._y);
    this.lastMoveTime = Date.now();
  };

  private onPointerUp = (e: PointerEvent) => {
    const drag = this.drag;
    if (!drag || e.pointerId !== drag.pointerId) return;
    this.drag = null;
    this.stage?.classList.remove("dragging");
    try {
      this.stage?.releasePointerCapture(e.pointerId);
    } catch {
      /* best effort */
    }
    this.onDragEndY();
  };

  /** DragHandlerObject.onDragEndY — the fling. */
  private onDragEndY() {
    let dt = Date.now() - (this.lastMoveTime ?? Date.now());
    dt = limit(dt, 20, 80);
    this.lastMoveTime = null;

    let target = this._y + this._lastDistY * (200 / dt);
    target = handlePositionOnEnd(target, this.yLimit);
    target = this.snap(target);
    this.emit(-target / this.vh);

    let dur = 1200 * Math.abs((target - this._y) / this.vh);
    dur += limit(dur * (0.5 * dt), 0, 1000);
    const extendsDirection =
      Math.abs(target - this._y + this._lastDistY) > Math.abs(target - this._y);
    this.startTween(
      this._y,
      target,
      dur,
      extendsDirection ? cubicOut : quadInOut,
      this.setAndStorePositionY,
      this.onActivityEnd,
    );
  }

  /* ─────────── keyboard ─────────── */

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.isLocked() || isFormField(e.target)) return;
    switch (e.key) {
      case "PageUp":
      case "ArrowUp":
        this.moveUp();
        break;
      case "PageDown":
      case "ArrowDown":
      case " ":
        this.moveDown();
        break;
      case "Home":
        this.moveToHome();
        break;
      case "End":
        this.moveToEnd();
        break;
      default:
        return;
    }
    e.preventDefault();
    e.stopPropagation();
  };

  /* ─────────── navigation ─────────── */

  private glide(target: number, dur: number, ease: EaseFn) {
    this.stopTween();
    this._y = this.getDragPositionY();
    const to = this.snap(handlePositionOnEnd(target, this.yLimit));
    this.emit(-to / this.vh);
    this.startTween(this._y, to, dur, ease, this.setAndStorePositionY, this.onActivityEnd);
  }

  moveUp() {
    const to = this.snap(handlePositionOnEnd(this._y + this.vh, this.yLimit));
    this.glide(to, 1600 * Math.abs((to - this.getDragPositionY()) / this.vh), quadInOut);
  }

  moveDown() {
    const to = this.snap(handlePositionOnEnd(this._y - this.vh, this.yLimit));
    this.glide(to, 1600 * Math.abs((to - this.getDragPositionY()) / this.vh), quadInOut);
  }

  /** Direct section navigation: quick nearby moves, capped long-distance travel. */
  moveTo(step: number) {
    if (this.isLocked()) return;
    const distance = Math.abs(step - this.scrollPosition);
    const duration = Math.min(1150, Math.max(550, 500 + distance * 90));
    this.glide(-this.vh * step, duration, easeOut);
  }

  /** Intro reveal + logo/CTA jumps. */
  slideTo(step: number) {
    this.stopTween();
    this._y = this.getDragPositionY();
    const to = this.snap(handlePositionOnEnd(-this.vh * step, this.yLimit));
    this.emit(-to / this.vh);
    const dur = 1600 * Math.abs((to - this._y) / this.vh);
    this.startTween(this._y, to, dur, easeInOut, this.setAndStorePositionY, this.onActivityEnd);
  }

  moveToHome() {
    const to = this.snap(handlePositionOnEnd(0, this.yLimit));
    this.glideFast(to);
  }

  moveToEnd() {
    const to = this.snap(handlePositionOnEnd(this.yLimit, this.yLimit));
    this.glideFast(to);
  }

  private glideFast(to: number) {
    this.stopTween();
    this._y = this.getDragPositionY();
    this.emit(-to / this.vh);
    const dur = 200 * Math.abs((to - this._y) / this.vh);
    this.startTween(this._y, to, dur, easeInOut, this.setAndStorePositionY, this.onActivityEnd);
  }

  getPos() {
    return this.scrollPosition;
  }

  getAim() {
    return this.scrollPositionAim;
  }

  /** See `EngineHandle.parkAt`. Screenshot harnesses only. */
  parkAt(step: number) {
    this.stopTween();
    this.jumpTo(step);
  }

  /** Called once the preloader clears: MainScene.onLoadingAnimationIsDoneHandler. */
  reveal() {
    this.slideTo(0);
  }
}

export interface UseSnapScrollResult {
  /** Rendered scroll position, in steps. Drives every SwipeElement. */
  pos: MotionValue<number>;
  activeIndex: number;
  whiteTheme: boolean;
  navVisible: boolean;
  moveTo: (step: number) => void;
  engineRef: RefObject<EngineHandle | null>;
}

export function useSnapScroll(
  endStep: number,
  locked: boolean,
  stageRef: RefObject<HTMLElement | null>,
  story?: StoryOptions,
): UseSnapScrollResult {
  const pos = useMotionValue(-1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [whiteTheme, setWhiteTheme] = useState(true);
  const [navVisible, setNavVisible] = useState(true);
  const engineRef = useRef<BeagleEngine | null>(null);
  const lockedRef = useRef(locked);
  const wasLocked = useRef(locked);

  // The story config is read once per engine; keep it off the effect's dep list
  // so an inline object literal at the call site cannot thrash the engine.
  const storyRef = useRef(story);
  storyRef.current = story;

  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const engine = new BeagleEngine(
      endStep,
      pos,
      (i) => setActiveIndex((cur) => (cur === i ? cur : i)),
      (white, nav) => {
        setWhiteTheme((cur) => (cur === white ? cur : white));
        setNavVisible((cur) => (cur === nav ? cur : nav));
      },
      () => lockedRef.current,
      storyRef.current,
    );
    engineRef.current = engine;
    engine.attach(el);
    return () => {
      engine.detach();
      engineRef.current = null;
    };
  }, [endStep, pos, stageRef]);

  // Preloader just cleared -> slide the story into frame from -1.
  useEffect(() => {
    if (wasLocked.current && !locked) engineRef.current?.reveal();
    wasLocked.current = locked;
  }, [locked]);

  const moveTo = useCallback((step: number) => {
    engineRef.current?.moveTo(step);
  }, []);

  return {
    pos,
    activeIndex,
    whiteTheme,
    navVisible,
    moveTo,
    engineRef: engineRef as RefObject<EngineHandle | null>,
  };
}

export { cubicInOut, quadInOut };
