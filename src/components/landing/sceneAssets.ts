/**
 * Central image re-exports for the landing story.
 *
 * NOTE (recovery): the original module re-exported ~14 images including paper
 * textures and patterned backgrounds from `src/assets/landing/`, which were
 * lost with the uncommitted assets. Only the four images the route actually
 * imports are re-exported here; `intro`/`collaborate` currently resolve to
 * stand-in copies until the originals are restored (see `src/assets/landing/`).
 *
 * `heroImg` is the ONE genuine editorial photograph in the repo (1920x1280,
 * backlit window, warm grade). The intro section's triptych takes all three
 * of its cards from it: the centre card is the full frame, the two side cards
 * are differently-scaled, differently-graded crops. `intro`/`collaborate` are
 * deliberately NOT used there — both have garbled generated text baked in
 * ("TERSUNE", "Job Listis") that is unmissable at full-bleed.
 */

import introImg from "@/assets/landing/intro.jpg";
import collaborateImg from "@/assets/landing/collaborate.jpg";
import heroImg from "@/assets/hero.jpg";
import step1 from "@/assets/step1.jpg";
import step2 from "@/assets/step2.jpg";

export { collaborateImg, heroImg, introImg, step1, step2 };
