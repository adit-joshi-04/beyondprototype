# Beyond Concrete — Home Page (beyond-home)

Single-page scroll experience. Vanilla HTML/CSS/JS + Three.js r128 (CDN). PartnerSerif (local OTF) site-wide, Georgia fallback. No build system — open with Live Server (ES module in `text-repel.js` requires http, not `file://`).

---

## File Map

| File | Purpose |
|---|---|
| `index.html` | Full page: all sections + DOM structure |
| `hero.css` | Styles for scrolls 1–4 (hero + about sections) |
| `styles.css` | Styles for scrolls 5–7 (split navigator, S6, S7) |
| `hero3d.js` | Three.js scene — 3D house, explode/about animations, roof fly-off |
| `hero-scroll.js` | Scroll logic for scrolls 1–4, split panel state machine, skip-intro logic |
| `script.js` | Interaction logic — S6 cards/glow, S7 podcast carousel |
| `text-repel.js` | ES module — splits hero body text into line halves that part around the 3D house |
| `structure.md` | Detailed Three.js internals + full phase timeline (source of truth for 3D stuff) |
| `split-section.md` | Archived split section code (removed 2026-10-28) — HTML, CSS, JS + known issues |
| `fonts/PartnerSerif-Regular.otf` | PartnerSerif 400 |
| `fonts/PartnerSerif-Bold.otf` | PartnerSerif 700 |
| `../shared/inject-header.js` | Shared header injector — prepends `#main-header` + `#nav-overlay` to `<body>` |
| `../shared/inject-contact-footer.js` | Shared contact + footer injector — appends `#section-seven` to `<body>` |
| `../shared/CONTACT_FOOTER_IMPL.md` | Implementation guide for the shared contact/footer component |

Load order: `hero.css` → `styles.css` → `three.min.js` → `../shared/inject-header.js` → `../shared/inject-contact-footer.js` → `hero3d.js` → `hero-scroll.js` → `script.js` → `text-repel.js` (module).

---

## Section Map

| Section | Element | Height | Status |
|---|---|---|---|
| Hero (3D house explode) | `.hero-sequence` | 2200vh | Complete |
| About (camera sweeps wall face) | `#about-section` | 600vh | Complete |
| Split project navigator | `.split-pin` / `.split` | 200vh | ✅ Working — scroll lock added 2026-10-29 |
| One/One by Nature (S6) | `.s6` | 100vh | Complete |
| Podcast carousel (S7) | `.s7` | 100vh | Complete — revamped 2026-10-29, heading animation added 2026-10-30 |
| Contact + Footer (shared) | `#section-seven` | 100vh | ✅ Complete — injected via `../shared/inject-contact-footer.js` (2026-10-30) |

---

## CSS Architecture

All sizing in `styles.css` uses a single unit variable:

```css
--u: min(calc(100vw / 1440), calc(var(--vh) / 900));
```

`1440 × 900` is the Figma frame. Multiply any design px value by `--u` to get the correct viewport-relative size. All absolute positions in `styles.css` use `calc(N * var(--u))`.

`hero.css` uses fixed px for the first-half (hero/about sections) — those don't use `--u`.

### Scroll snap

`html { scroll-snap-type: y proximity; }` — applied to `.s6`, `.s7`, `#section-seven` via `scroll-snap-align: start`. Proximity is intentional; mandatory was tested and rejected (interferes with hero scroll).

### Fonts

```css
@font-face {
  font-family: "PartnerSerif";
  src: url("fonts/PartnerSerif-Regular.otf") format("opentype");
  font-weight: 400;
}
@font-face {
  font-family: "PartnerSerif";
  src: url("fonts/PartnerSerif-Bold.otf") format("opentype");
  font-weight: 700;
}
```

`--serif` token in `:root` leads with `"PartnerSerif"`, Georgia as fallback. Both `styles.css` and `hero.css` `body` rule use this.

---

## Colour Palette

| Token | Value | Used for |
|---|---|---|
| `--bg` | `#d9d9d9` | Page background |
| `--white` | `#ffffff` | Menu, cards |
| `--ink` | `#000000` | Text, logo bar |
| `--muted` | `#9a9a9a` | Secondary text |
| `--panel` | `#a1a1a1` | Card image placeholder |
| `--nav-active` | `#bbb8b7` | Active menu item bg |
| `--icon-bg` | `#efefef` | Header canvas slot bg |
| `--ease` | `cubic-bezier(.22, .72, .18, 1)` | Shared easing |
| — | `#f8f6f7` | S7 (podcast) background |

3D house colours (in `hero3d.js`): walls `#d0d0cc`, wall hover `#bcbcb8`, roof `#b8b8b4`.

---

## Z-index Stacking

```
z-index 100  #main-header (fixed — injected by inject-header.js)
z-index  99  #nav-overlay (fixed — backdrop behind open nav, injected by inject-header.js)
z-index  60  .skip-intro (fixed)
z-index   5  .split (fixed, always — lives outside .split-pin so it's in root stacking context)
z-index   3  .s6, .s7, #section-seven
z-index   2  .hero-sticky, #about-section
z-index   1  #hero-canvas (fixed, fullscreen Three.js canvas)
```

---

## Header (`#main-header`)

Injected by `../shared/inject-header.js` via `document.body.insertAdjacentHTML('afterbegin', ...)` — prepended to `<body>`.

- **Collapsed** (default): `60px` tall, fixed `16px` from all three top edges, white background. Shows logo (left) + hamburger (right).
- **Expanded** (`#main-header.is-open`): grows to `50vh`. Nav fades in over four columns — Home, Our Pillars, Projects (→ Fifth Ave / Roots), Connect.
- **Overlay** (`#nav-overlay`): full-screen semi-transparent backdrop at `z-index: 99`; click it to close.
- **Connect link**: scrolls to `#section-seven` on this page (or calls `window.scrollState.jumpTo` on GSAP-scroll pages).
- All internal hrefs are resolved relative to the script file itself — safe to load from any page depth.
- Does **not** fade out on scroll; has no dependency on `body.menu-hidden` or any page-specific class.

---

## Skip Intro (`.skip-intro`)

Added 2026-10-30. Fixed bottom-centre element visible only on the first frame.

- **HTML**: `<p class="skip-intro" id="skip-intro">Keep scrolling for the full experience or <a class="skip-intro__link" href="#splitPin">skip</a></p>` — injected directly in `index.html` just after `#hero-canvas`.
- **Visibility**: `is-hidden` class toggled by scroll listener in `hero-scroll.js` — hidden when `scrollY > 0`, re-shown when back at top.
- **Skip behaviour** (click handler in `hero-scroll.js`):
  1. `scrollLocked = true` — prevents any scroll during animation.
  2. `splitEl.classList.add('is-entering')` — panels slide in over the current view (3D hero underneath, hidden by panels).
  3. After 900ms: `window.scrollTo({ top: splitPin.offsetTop, behavior: 'instant' })` — instant jump while panels cover the viewport. `is-open` added, scroll unlocked.
- **Color**: `rgba(0,0,0,0.5)` — visible against the white Three.js renderer background.

---

## Section Details

### Split project navigator (`.split-pin` / `.split`) — ✅ WORKING
- Two full-viewport panels (FIFTH AVENUE left, ROOTS right) that fly in from the sides on scroll and reverse on scroll-up.
- **Entrance**: `.split-pin` is `200vh` tall with `margin-top: -100vh` (overlaps last 100vh of about section — no dead scroll gap). `.split` is `position: fixed; top: 0; overflow: hidden` at all times. Panels are `position: absolute; inset: 0` starting at `translateX(±100%)`.
- **State machine** (managed by `updateSplit()` in `hero-scroll.js`):
  - `is-entering` — added when entry conditions are met (see thresholds below). Panels slide to `translateX(0)` over 900ms. Panels are already clipped at `--sp-x` during the slide so they arrive pre-split (no full-width flash).
  - `is-open` — added 900ms later (unlocks scroll simultaneously — see Scroll Lock below). Panels switch from `transform` to `clip-path` control.
  - `is-leaving` — added on any exit trigger. `is-open` + `is-entering` + hover classes are removed simultaneously, triggering the reverse `transform` slide. After 900ms the `is-leaving` class is removed and scroll is unlocked.
  - `splitEnterSource` — `'above'` or `'below'`, tracks which direction the panels entered from so the correct exit threshold is used. `null` when panels are not active.
  - **Direction tracking**: `goingDown = scrollY > prevScrollY` determines whether to apply entry-from-above vs entry-from-below logic. `prevScrollY` is updated each scroll event (and also by `lockScrollAt` on every snap).
- **Thresholds**:
  - `enterAt = splitPin.offsetTop` — entry trigger when scrolling DOWN
  - `exitForwardAt = s6El.offsetTop` — S6 top hits viewport top; forward exit in both directions
  - `exitReverseAt = s6El.offsetTop - innerHeight` — S6 fully below viewport; reverse exit when entered from below
- **Full scroll-down sequence**: scroll hits `enterAt` → **lock** → panels enter (900ms) → unlock → scroll to `exitForwardAt` → **lock** → panels exit (900ms) → unlock → S6 fills viewport.
- **Full scroll-up sequence**: scroll hits `exitForwardAt` going up → **lock** → panels enter from below (900ms) → unlock → scroll up to `exitReverseAt` → **lock** → panels exit (900ms) → unlock → 3D canvas fills viewport.
- **Clip-path is always active** once panels are visible. `is-entering`, `is-open`, and `is-leaving` all apply `clip-path: inset(...)` based on `--sp-x`. This means panels enter/exit already split at 50/50 — no snap when `is-open` fires, no full-width overlap during exit.
- **Hover divider**: Registered `@property --sp-x` (`<length>`, `inherits: true`) on `.split`. JS sets it via `split.style.setProperty('--sp-x', ...)`. `pointerenter` on left panel shifts divider to `width − 156u`; right panel shifts to `155u`. `pointerleave` resets to `width / 2`. Only active when `is-open`.
- **Text fade**: `hover-left` / `hover-right` classes added by JS. CSS fades opposing panel's text to `opacity: 0`.
- **`.split` background**: intentionally transparent. Each panel has its own background. Do not add a background to `.split` — it would show through as panels slide and block the Three.js canvas underneath.

#### Scroll Lock (added 2026-10-29)
Without locking, fast scrolling lets S6 peek into the viewport while panels are mid-slide (900ms gap). The fix: lock scroll at every transition boundary and unlock exactly when the animation completes.
- `scrollLocked` boolean — when `true`, `wheel` and `touchmove` listeners call `e.preventDefault()` to block all scroll input. The main scroll listener stays `{ passive: true }` (cannot be changed without perf regression).
- `lockScrollAt(y)` — sets `scrollLocked = true`, snaps `window.scrollTo({ top: y, behavior: 'instant' })`, and updates `prevScrollY = y` to keep direction tracking consistent post-snap.
- `unlockScroll()` — clears `scrollLocked` and nulls `splitUnlockTimer`.
- `triggerSplitLeave(snapTo)` — takes the threshold to snap to, locks, fires the CSS exit animation, sets both the class-removal timer and `splitUnlockTimer` to 900ms. Both timers are cleared first to handle interruption.
- `updateSplit()` guard — `if (scrollLocked) return` at the top: the `scrollTo` inside `lockScrollAt` fires a scroll event, but it's immediately dropped here. No re-trigger, no double-animation.
- **Entry from below condition** uses `scrollY > exitReverseAt` (strict `>`). If it were `>=`, after the reverse-exit snap lands exactly on `exitReverseAt`, the very next scroll event would re-trigger entry-from-below. The strict inequality prevents this.
- **Snap directions**: every snap moves to the exact threshold of the trigger. Fast-scroll overshoot is at most one wheel-event delta — invisible because panels cover the full viewport during the lock window.

#### Timers
- `splitOpenTimer` — tracks the 900ms delay before `is-open`. Cancelled by `triggerSplitLeave` and by any new entry.
- `splitLeaveTimer` — tracks the 900ms delay before removing `is-leaving`. Cleared on each new leave call.
- `splitUnlockTimer` — tracks the 900ms scroll-unlock delay. Cleared on each new leave call so a rapid re-trigger can't double-unlock.

#### Known gotchas
- `@property --sp-x` must use `inherits: true` — if `false`, children never see the value.
- Do NOT add `overflow: hidden` to `.split-pin` — breaks sticky. Must stay `overflow: visible`.
- Do NOT change the `wheel`/`touchmove` listeners to `{ passive: true }` — passive listeners cannot call `preventDefault`, which is required for the scroll lock to work.
- Do NOT change `.split` back to `position: sticky` — always-fixed gives a stable compositing layer and removes sticky→fixed paint-order flicker.
- `.split` z-index is 5 (above `.s6` at z-index 3) and is in the root stacking context because `.split` lives outside `.split-pin` in the DOM. Do not nest it back inside `.split-pin`.
- `split-section.md` archives the original failed attempt (do not restore it).


### Scroll 6 (`.s6`) — ONE/ONE BY NATURE
- 4 perspective-skewed cards (`.card`) with `clip-path` tilt animation on hover.
- Notes (`.s6__note`) in the top-right — one per card, shown on card hover.
- Radial glow cursor (`.glow`) trails the pointer at 0.22 lerp factor.
- On touch: tap a card to toggle its tilt.

### Scroll 7 (`.s7`) — Podcast carousel (revamped 2026-10-29, heading animation 2026-10-30)

- **Layout**: centred heading + body copy in upper portion; 5-card carousel in lower portion (`bottom: 140u`).
- **HTML**: `.s7__copy` (`.s7__heading` + `.s7__episode` + `.s7__body`) + `.s7__fan` (five `.s7__card` divs) + `.s7__card-label`. Play button (`<button class="s7__play">`) injected into each card by JS.
- **Card data attributes**: each `.s7__card` has `data-title` (episode title) and `data-label` (e.g. `BEYOND CONCRETE × SWITCHEKO`) — used by `updateCopyState()`.

#### Heading animation (added 2026-10-30)
On first card click, `.s7__copy` gets `is-activated`:
- `.s7__heading` transitions from `48u bold` → `16u normal grey` (single line — `<br>` hidden via CSS, replaced by `<span class="s7__heading-br"> </span>` shown only when activated).
- `.s7__episode` expands from `max-height: 0 / opacity: 0` → full size `56u` with the centre card's `data-title`.
- `.s7__card-label` fades in below the fan showing the centre card's `data-label` (split at ` × ` onto two lines).
- Clicking empty space in `.s7` calls `deactivate()` — resets all of the above and returns cards to uniform sizes.
- `updateCopyState()` runs on every card shift to keep episode title + label in sync with the current centre card.

#### Carousel logic (IIFE in `script.js`)
- `slotOf[i]` tracks which slot (0–4) each of the 5 DOM cards occupies.
- `activated` flag starts `false` — cascade sizing and `is-center` suppressed until first click.
- **Unactivated state**: heights `[88, 104, 116, 104, 88]u` (descending from centre), all widths `220u`. Evenly fills 1140u container.
- **Activated / cascade sizes** (slot 0..4): widths `[140, 160, 500, 160, 140]`u, heights `[100, 116, 356, 116, 100]`u.
- **Wrap animation**: cards going out of range teleport off-screen (transition:none), then re-enabled next rAF. `overflow: hidden` on `.s7__fan` hides the teleport.
- `busy` flag (620ms lock) prevents click interruption mid-animation.
- **Fan gradient mask**: `mask-image: linear-gradient(to right, transparent, black 12%, black 88%, transparent)` — fades extreme cards at the edges.
- **Tweaking card sizes**: `WIDTHS` must be symmetric, `sum(WIDTHS) + 40 = 1140`. `.s7__fan` CSS height must equal `HEIGHTS[2]`. `UNIFORM_W` must satisfy `5 × UNIFORM_W + 40 = 1140` → `220`.
- **Play button**: visual only — no audio wired yet.

### Contact + Footer — `#section-seven` ✅ Complete (2026-10-30)

Injected by `../shared/inject-contact-footer.js` via `document.body.insertAdjacentHTML('beforeend', ...)` — appended to `<body>` outside `<main>`.

- **Pattern A** (normal scroll) — no GSAP wiring needed.
- `#section-seven { height: 100vh; position: relative; z-index: 3; scroll-snap-align: start; }` in `styles.css`.
- Old `.contact` / `.footer` HTML, CSS, and JS (menu-hidden toggle, form validation, compass/geolocation IIFE, `--vw` setter) all removed.
- See `shared/CONTACT_FOOTER_IMPL.md` for layout reference and gotchas.

---

## JS Architecture

### `hero-scroll.js` — scrolls 1–4 + split + skip intro
Single `scroll` listener calling `updateHero()`, `updateAbout()`, and `updateSplit()`.

Also contains:
- **Skip intro logic**: scroll listener to toggle `.skip-intro.is-hidden`; click handler on `.skip-intro__link` that triggers the skip animation (panels first, then instant scroll jump).
- `lockScrollAt(y)`, `unlockScroll()`, `triggerSplitLeave(snapTo)` — split panel scroll lock utilities.

`updateHero()` drives all first-half animation by computing `raw` (0→1 over 1300vh) and `exitP` (0→1 in last 400vh of the 800vh hold):
- Tagline opacity (fade in 0.06→0.18, hold, fade out 0.28→0.35)
- Body text `translateY` (travels from +100vh to −160vh between raw 0.35–0.85)
- Camera approach (`setHeroCameraApproach`)
- Wall explosion + camera zoom (`setHeroExplode`, `setHeroCameraZoom`)
- Roof fly (`setRoofFly`)
- Overlay exit fade (`setHeroExit`)

`updateAbout()` feeds `wallExpandProgress` (0→1) to `setWallExpand` — drives the camera sweep across the right-wall face in `hero3d.js`.

### `script.js` — S6 + S7
Three IIFEs:
1. **Split hover divider**: shifts `--sp-x` toward the hovered panel.
2. **S6 cards + glow**: resolves hover via `elementFromPoint`; updates `.is-hover` on cards and `.is-active` on notes; glow lerps at 0.22.
3. **S7 carousel**: slot tracking, cascade/uniform sizing, wrap teleport animation, `updateCopyState()`, `deactivate()`, click-outside handler.

(Old contact/footer/compass IIFE and `--vw` setter removed 2026-10-30.)

### `text-repel.js` (ES module)
Lays hero body text as positioned line halves that slide apart around the 3D house ellipse. Depends on `window.__houseScreen` published by `hero3d.js`. Requires http (not `file://`).

### `hero3d.js`
Three.js scene — see `structure.md` for full detail. Key globals it exposes to `hero-scroll.js`:
- `window.setHeroCameraApproach(p)`
- `window.setHeroExplode(p)`
- `window.setHeroCameraZoom(p)`
- `window.setRoofFly(p)`
- `window.setHeroExit(p)`
- `window.setWallExpand(p)`
- `window.__houseScreen` — bounding ellipse of house in screen space (for text repel)

---

## Key Gotchas

- **`--u` vs fixed px**: `hero.css` uses fixed px; `styles.css` uses `--u`. Don't mix systems in the wrong file.
- **`hero-canvas` is fixed, not in the sticky**: persists behind hero + about sections.
- **ES module**: `text-repel.js` must be served over http — `file://` blocks module imports.
- **Font path**: `@font-face` in `styles.css` uses `url("fonts/...")` — relative to the CSS file, which lives in `beyond-home/`. Don't change to an absolute path.
- **Injector load order**: both `inject-header.js` and `inject-contact-footer.js` must load BEFORE `hero-scroll.js` and `script.js` so `#main-header` and `#section-seven` are in the DOM when those scripts run.
- **`#section-seven` outside `<main>`**: the injector appends to `<body>`, not inside `<main>`. Do not move it — its z-index and scroll snap work correctly from body level.
- **Scroll snap — no mandatory**: `scroll-snap-type: y mandatory` was tested and rejected. It causes the browser to snap away from mid-hero scroll positions. Stay with `proximity`.
- **Podcast audio**: play button is visual only — no audio wired yet.
- **Split `@property` inheritance**: `--sp-x` must be `inherits: true`. If `false`, clip-path on child panels sees `0px` forever.
- **Split overflow clipping**: `.split` must keep `overflow: hidden` — this is what hides panels at `translateX(±100%)` before entrance. Do not remove it.
- **Split `overflow: hidden` ancestor**: do NOT add `overflow: hidden` to `.split-pin` — it would make `.split-pin` the scroll container and break layout. `.split-pin` must stay `overflow: visible` (default).
- **Split always fixed**: `.split` is `position: fixed` at all times (not sticky). This gives a stable compositing layer and removes any sticky→fixed paint-order flicker. `pointer-events: none` on the base rule ensures the invisible element never blocks clicks when inactive. Do NOT change it back to sticky.
- **Split scroll lock — passive listeners**: the `wheel` and `touchmove` listeners that drive the scroll gate must stay `{ passive: false }`. Making them passive disables `preventDefault`, which breaks the lock entirely.
- **Split scroll lock — snap + prevScrollY**: `lockScrollAt(y)` must update `prevScrollY = y` after the snap. If it doesn't, the `goingDown` direction check on the next scroll event sees a stale value and can flip direction incorrectly.
- **Split scroll lock — strict inequality on entry-from-below**: `scrollY > exitReverseAt` (not `>=`). After a reverse-exit snap lands exactly on `exitReverseAt`, the next event would otherwise re-trigger entry-from-below.
- **Split timer cancellation**: all three timers (`splitOpenTimer`, `splitLeaveTimer`, `splitUnlockTimer`) must be cleared at the start of each new `triggerSplitLeave` call to prevent double-firing if the user triggers a new exit before the previous one finishes.
- **Split z-index**: `.split` is always `z-index: 5` (above `.s6` at z-index 3, above about at z-index 2, below header at 99/100). Because `.split` lives outside `.split-pin` in the DOM, its z-index is in the root stacking context — not bounded by any parent stacking context. Do not lower below 4, do not nest `.split` back inside `.split-pin`.
- **Header z-index**: `#main-header` is `z-index: 100`, `#nav-overlay` is `z-index: 99`. Both sit above everything on the page including the split panels (5) and skip-intro (60). The skip-intro is therefore visually below the header when both are on screen.
