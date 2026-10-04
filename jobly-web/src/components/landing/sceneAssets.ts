/**
 * Central image re-exports for the landing story.
 *
 * NOTE (recovery): the original module re-exported ~14 images including paper
 * textures and patterned backgrounds from `src/assets/landing/`, which were
 * lost with the uncommitted assets. Only the four images the route actually
 * imports are re-exported here; `intro`/`collaborate` currently resolve to
 * stand-in copies until the originals are restored (see `src/assets/landing/`).
 */

import introImg from "@/assets/landing/intro.jpg";
import collaborateImg from "@/assets/landing/collaborate.jpg";
import step1 from "@/assets/step1.jpg";
import step2 from "@/assets/step2.jpg";

export { collaborateImg, introImg, step1, step2 };
