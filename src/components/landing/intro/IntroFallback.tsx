import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import { heroImg } from "../sceneAssets";
import {
  ATS_CATEGORIES,
  CARDS,
  COPY,
  PAGE_VARS,
  RESUME,
  RESUME_BODY,
  SCORE_TOTAL,
  SIBLINGS,
} from "./manifest";

/**
 * The same four sections, with nothing moving.
 *
 * Served to `prefers-reduced-motion` and to coarse-pointer / sub-1024px
 * viewports, where a drag-driven snap-scroll canvas is the wrong interaction
 * anyway. Same copy, same photograph and — importantly — the same resume and
 * the same seven scored categories, read top to bottom. The argument has to
 * survive without the choreography, so none of it is carried by motion: the
 * highlighted phrases are just `<mark>`, and the score rows are just filled
 * bars at their final width.
 */
export function IntroFallback() {
  return (
    <>
      {/* ── the hero ── */}
      <section className="landing-fb-hero">
        <img src={heroImg} alt="" className="landing-fb-hero-img" />
        <div className="landing-fb-hero-body">
          <h1 className="landing-fb-h1">{COPY.hero.title}</h1>
          <p className="landing-fb-sub">{COPY.hero.subheader}</p>
          <Link to="/auth" search={{ mode: "signup" }} className="pill-mint-lg mt-9 gap-2">
            Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* ── the triptych, as a static row ── */}
      <section className="landing-fb-tri" aria-hidden="true">
        {CARDS.map((card) => (
          <span
            key={card.id}
            className={`landing-fb-tri-card landing-fb-tri-card--${card.id}`}
            style={{
              backgroundImage: `url(${heroImg})`,
              backgroundSize: card.size ?? "cover",
              backgroundPosition: card.position ?? "center",
              filter: card.filter,
            }}
          />
        ))}
      </section>

      {/* ── the thesis ── */}
      <section className="landing-fb-thesis">
        <p className="landing-fb-serif">{COPY.thesis.upper}</p>
        <p className="landing-fb-bold">{COPY.thesis.boldA}</p>
        <p className="landing-fb-serif">{COPY.thesis.mid}</p>
        <p className="landing-fb-bold">{COPY.thesis.boldB}</p>
        <p className="landing-fb-foot">{COPY.thesis.bottom}</p>
      </section>

      {/* ── step one: the import ── */}
      <section className="landing-fb-import">
        <p className="landing-fb-label">{COPY.import.label}</p>
        <h2 className="landing-fb-h2">{COPY.import.title}</h2>
        <p className="landing-fb-sub landing-fb-sub--ink">{COPY.import.subheader}</p>

        <ul className="landing-fb-sibs">
          {SIBLINGS.map((sib) => (
            <li key={sib.id}>{sib.title}</li>
          ))}
        </ul>
      </section>

      {/* ── step two: the ATS calculation ──
          The canvas grows the sheet and sweeps it; here it is simply printed at
          its final state, already marked. `--page-h` is overridden to a rem
          value so the whole `--doc-*` rhythm re-derives against a scrolling
          document instead of the viewport. */}
      <section className="landing-fb-ats">
        <p className="landing-fb-label">{COPY.calc.label}</p>
        <h2 className="landing-fb-h2">{COPY.calc.title}</h2>
        <p className="landing-fb-sub landing-fb-sub--ink">{COPY.calc.subheader}</p>

        <div className="landing-fb-ats-grid">
          {/* `--page-h` is the only override needed: every `--doc-*` measure and
              every font size is a fraction of it, so re-pointing it at a rem
              value re-derives the whole rhythm for a scrolling document. 34rem
              pushed the body type onto its 9px floor; 48rem lands it at ~11px. */}
          <article
            className="landing-fb-page"
            style={{ ...PAGE_VARS, "--page-h": "48rem" } as React.CSSProperties}
          >
            <p className="landing-page-tag">{RESUME.tag}</p>
            <p className="landing-page-name">{RESUME.name}</p>
            <p className="landing-page-role">
              {RESUME.role} · {RESUME.org}
            </p>
            <span className="landing-page-rule" />

            {RESUME_BODY.map((block) => (
              <div key={block.id} className="landing-doc-block">
                <p className="landing-doc-head">{block.label}</p>
                {block.bullets.map((bullet) => (
                  <p key={bullet.id} className="landing-doc-line">
                    <span className="landing-doc-dot" aria-hidden="true" />
                    <span className="landing-doc-text">
                      {bullet.before}
                      <mark className="landing-fb-mark">{bullet.phrase}</mark>
                      {bullet.after}
                    </span>
                  </p>
                ))}
              </div>
            ))}

            <div className="landing-doc-skills">
              <span className="landing-doc-rule" />
              <p className="landing-doc-head landing-doc-head--tight">{RESUME.skillsLabel}</p>
              <p className="landing-doc-skills-line">{RESUME.skills.join("  ·  ")}</p>
            </div>
          </article>

          <aside className="landing-fb-score">
            <p className="landing-fb-score-total">
              <span>{SCORE_TOTAL}</span>
              <span className="landing-fb-score-cap">{COPY.scan.cap}</span>
            </p>
            <ul className="landing-fb-score-rows">
              {ATS_CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <span className="landing-fb-score-label">{cat.label}</span>
                  <span className="landing-fb-score-pts">
                    {cat.earned}
                    <span className="landing-fb-score-max">/{cat.max}</span>
                  </span>
                  <span className="landing-fb-score-track">
                    <span style={{ width: `${(cat.earned / cat.max) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
            <p className="landing-fb-score-foot">{COPY.scan.foot}</p>
          </aside>
        </div>
      </section>

      {/* ── the cap ── */}
      <section className="landing-fb-cap">
        <h2 className="landing-fb-h2">
          {COPY.seam.lead} <span className="landing-fb-em">{COPY.seam.em}</span> {COPY.seam.trail}
        </h2>
        <p className="landing-fb-label mt-3">{COPY.seam.kicker}</p>
        <Link to="/auth" search={{ mode: "signup" }} className="pill-mint mt-8 gap-2">
          Create your profile <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>

      {/* Global footer lives here for the scrolling fallback. The canvas
          landing suppresses it in `__root` so it can never peek through the
          full-viewport animation — it only ever appears at the end. */}
      <Footer />
    </>
  );
}
