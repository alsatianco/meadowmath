# Number Friends — Storybook UI Redesign

**Date:** 2026-06-27
**Branch:** `feature/number-friends-tach-gop`
**Status:** Approved design → ready for implementation plan

## 1. Summary

Redesign the Number Friends landing page and the shared app shell (sidebar, logo, language switcher) to match the approved storybook mockup at `~/Downloads/ChatGPT Image Jun 27, 2026, 08_00_56 AM.png` (1254×1254). The target is a warm, hand-illustrated "parchment meadow" aesthetic: cream grid paper, chunky Cooper-Black-style display type, soft sage sidebar, painterly block-character hero, and journey cards with hand-drawn circular badge medallions.

## 2. Background / current state

The codebase carries two competing design languages:

- A global **"Habbo Hotel 2006"** system — `css/variables.css`, `css/sidebar.css` — glossy 3D, vibrant cyan/teal, a bright-green gradient sidebar with white 3D logo text and flag-only language buttons.
- A page-local **storybook** theme already attempted inside `number-friends/number-friends.css` — cream parchment, brown ink, Cooper-Black serif, but rendered with CSS primitives (CSS sun/clouds/island) and live block-engine creatures, and `"Cooper Black"` is referenced but **never web-loaded** (most visitors fall back to Georgia).

The mockup is a higher-fidelity realization of the storybook theme and differs from the live build (which is captured in `~/Downloads/medowmath.png`): sage sidebar instead of glossy green, hand-drawn badge medallions instead of emoji-in-squares, a painterly hero instead of block-engine creatures, and a framed meadow painting at the sidebar's foot.

## 3. Decisions (locked with user)

1. **Scope:** Number Friends page **+ shared shell**. The sidebar/logo/language are restyled site-wide; grade/tools/about **content** is left as-is for now.
2. **Hero art:** Match the mockup as closely as possible by **cropping assets from the mockup PNG**, escalating to **`codex` / gpt‑5.5** generation only where a crop is too low-resolution (primarily a 2× hero).
3. **Language:** Keep **English + Tiếng Việt**. The mockup's "Spanish / 🇲🇽" was placeholder; only the switcher's *appearance* changes.

## 4. Non-goals

- No restyle of grade1–5 / prek / kinder / tools / about **page content** (they inherit only the new shell CSS).
- No change to activity pages under `number-friends/activities/` in this pass.
- No change to `data/number-friends.json` structure, the i18n key scheme, or `block-engine` internals.
- No refactor of the sidebar into a JS-injected component (rejected: unrelated risk).

## 5. Architecture approach

**CSS-only shell restyle.** The sidebar markup is duplicated as static HTML across 10 pages. Rather than edit each, repaint the shell in `css/sidebar.css` and add the mockup's new pieces as CSS pseudo-elements / backgrounds:

- Brand tagline "GROW • LEARN • THRIVE" → `.sidebar-logo::after { content: … }`.
- Logo flower sprig → background on `.sidebar-logo::before` (or the logo card).
- Per-flag text labels → `.lang-btn[data-lang="en"]::after { content: "English" }`, `[data-lang="vi"]::after { content: "Tiếng Việt" }`. This is correct, not a hack: a language switcher names each language in its own tongue, so the labels are static regardless of active locale.
- Bottom meadow painting → `.sidebar::after` background element (cropped asset).

Result: **zero HTML edits** to home/grade/tools/about pages; the only page rewritten is `number-friends/index.html`. Fully reversible, small review surface.

Shared design tokens move into a new `css/storybook.css` so the shell and the NF page draw from one source.

## 6. Design language / tokens

- **Palette:** parchment `#fbf3da` / paper `#fff8e8`, ink `#4b372e`, sage sidebar (`~#8aa06a → #6f8a52` gradient), accents gold `#e3a83f`, rose `#d97967`, sky `#8cc8c2`, mint `#8fcf9f`.
- **Display font:** load a Cooper-Black-style web font — **candidate: `Chango` (Google Fonts)** — for `Number Friends`, `MEADOW MATH`, section/stage titles. Verify visually; swap if the user dislikes it. Fallback stack: `"Chango","Cooper Black","Bookman Old Style",Georgia,serif`.
- **Body font:** keep `Nunito` (already loaded).
- **Background:** cream with a faint square grid (refine the existing `.main-content` gradient + grid lines) plus a soft speckle, matching the mockup.

## 7. Shared shell — detail

- **Sidebar panel:** soft sage textured column; remove glossy green/blue and white 3D text shadows here.
- **Logo card:** cream rounded card; flower sprig + "MEADOW MATH" (display serif) + "GROW • LEARN • THRIVE" letterspaced caps.
- **Nav items:** soft cream pills, green ink, gentle 3D press; **active** item = deeper sage pill (matches mockup's "Number Friends" treatment). Emoji icons retained, nudged toward the mockup's choices where free (e.g. Kinder pencil, Grade 1 paper-plane) — applied globally via the shared markup, harmless to other pages.
- **Language switcher:** "🇺🇸 English" (active) / "🇻🇳 Tiếng Việt" chips with text labels.
- **Footer of sidebar:** framed meadow-landscape painting (cropped) under the language section.
- **Mobile:** existing hamburger + backdrop behavior preserved; only the painted skin changes.

## 8. Number Friends page — detail

- **Hero:** remove CSS sun/clouds and the `renderHero()` block-engine showcase; place the cropped painterly island+characters illustration top-right; "Number Friends" in display serif with leaf sprig; tagline beneath; hairline divider under the hero band. Clouds/butterfly come with the hero crop (or light CSS).
- **"Meet the Blocks" featured card:** brown blocks badge + 4 white sub-tiles — Meet the Blocks / Count the Blocks / Which Number? / Quick Look — generated from the existing `stage-0` (`intro` + 3 activities).
- **Journey cards (6):** parchment rows; circular hand-drawn **badge medallion** + title + goal + "Sắp ra mắt • Coming soon" + circular chevron. Rendered from `data/number-friends.json` via `number-friends.js`; only the emitted markup changes.
- **Footer:** centered "About • Privacy & Terms" with a small ornament.

## 9. Asset pipeline

Output dir: `number-friends/assets/`.

| Asset | Source | Approx. crop region (1254² mockup) | Display size | Notes |
|---|---|---|---|---|
| Hero scene | crop | x≈675 y≈50 w≈560 h≈300 | ~550px | ~1× → if soft on retina, regenerate 2× via `codex` |
| Sidebar landscape | crop | x≈5 y≈950 w≈250 h≈295 | ~240px | self-framed in mockup |
| 7 badge medallions | crop | discs ~70px at each card's left | ~52px | downscaled → crisp |
| 4 sub-tile icons | crop or SVG | small tiles in featured card | ~40px | crop or simple SVG |
| Logo sprig | crop or SVG | top of logo card | ~28px | small |
| Decorative bits (chevron, divider ornament, leaf) | SVG/CSS | — | — | hand-authored |

All crop coordinates are **approximate** and will be tuned by inspecting outputs against the mockup. `codex exec "<prompt>"` is the non-interactive generation path, used for a 2× hero and any asset whose crop is too low-res.

## 10. File-by-file change list

**New:**
- `css/storybook.css` — shared tokens + display-font `@import`/`@font-face` + shared storybook card/typography helpers.
- `number-friends/assets/*` — cropped/generated images.

**Edited:**
- `css/sidebar.css` — full storybook repaint of shell + pseudo-element additions (global).
- `number-friends/index.html` — link `storybook.css`; rebuild hero + journey container markup; footer ornament.
- `number-friends/number-friends.css` — replace CSS-primitive hero + restyle featured/journey cards to mockup; consume shared tokens.
- `number-friends/number-friends.js` — update `renderHero` (static illustration instead of block-engine showcase) and `renderStage`/chip markup (badge medallion + chevron + featured-card variant for stage-0).
- Possibly `css/variables.css` — only if a token must be shared globally with the shell.

**Untouched:** all grade/prek/kinder/tools/about HTML; `data/number-friends.json`; `js/block-engine.js`; activity pages.

## 11. Responsive & accessibility

- Sidebar collapses to existing hamburger < 768px; hero stacks beneath the title on narrow screens; journey cards reflow; sub-tiles wrap.
- `prefers-reduced-motion`: float/spin animations disabled (extend existing rules).
- `:focus-visible` rings preserved; nav active state has non-color affordance.
- Illustrations get meaningful `alt`; decorative crops use empty `alt`/`aria-hidden`.
- Maintain text contrast on sage pills and parchment cards (ink on cream ≥ AA).

## 12. Verification

- Serve locally and screenshot the Number Friends page at desktop + mobile widths; compare side-by-side against the mockup; iterate on crop offsets, spacing, and font until it visually matches.
- Spot-check one other page (e.g. home) to confirm the new shared shell renders correctly and nothing else regressed.
- Confirm language toggle still swaps en/vi and active states are correct.

## 13. Risks & mitigations

- **Hero crop resolution at ~1×** → regenerate 2× via `codex`; mitigation already in pipeline.
- **`Chango` may not perfectly match Cooper Black** → it's a candidate; verify visually and swap if needed (Bookman/Georgia fallback always present).
- **Global sidebar change touches every page** → CSS-only and reversible; spot-check home/grade pages for clashes; this is the user-accepted "consistent chrome, interiors later" state.
- **codex image generation capability uncertain** → crop-from-mockup is the primary, deterministic path; codex is enhancement/fallback only.
