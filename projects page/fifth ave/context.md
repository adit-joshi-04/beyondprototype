# Fifth Ave — Project Context

## Overview
One-page prototype for a real estate development projects page. Built section by section with Three.js for 3D elements and GSAP for animations. Loads a GLTF building model.

**Project path:** `/Users/aditjoshi/Documents/Studio Ping Pong/Beyond Concrete/projects page/fifth ave/`

---

## Files
- `index.html` — markup + all CSS (inline `<style>`)
- `site.js` — Three.js scene + GSAP animations
- `modern_building_2_game-ready/scene.gltf` — building model (scale 0.31)

## Shared files (`Beyond Concrete/shared/`)
- `inject-header.js` — self-contained header IIFE. Fires `headerReady`. Edit content/styles here only.
- `inject-contact-footer.js` — self-contained footer IIFE. Fires `contactFooterReady`. Edit content/styles here only.
- `fonts.css` — single source of truth for all typefaces: PartnerSerif (400/500/700, regular + italic cuts) + Nunito Sans (`@import` from Google Fonts). Link with `<link rel="stylesheet" href="[path]/shared/fonts.css">` + preconnect tags.
- `fonts/` — `PartnerSerif-Regular.otf`, `PartnerSerif-Medium.otf`, `PartnerSerif-Bold.otf`, `PartnerSerif-Italic.otf`, `PartnerSerif-MediumItalic.otf`, `PartnerSerif-BoldItalic.otf`
- `graphics/beyond.png` — Beyond Concrete logo (used by inject-header.js via script-relative path)

---

## Libraries (CDN)
- **Three.js r134** + GLTFLoader
- **GSAP 3.12.5** + ScrollTrigger (registered but not used for scroll — kept for future)
- **No Google Fonts** — previously loaded Playfair Display + Inter, both removed

---

## Typography
**Single typeface throughout: `PartnerSerif`**, loaded via `@font-face` from the local `fonts/` folder.
- `font-weight: 400` → `PartnerSerif-Regular.otf`
- `font-weight: 700` → `PartnerSerif-Bold.otf`
- Weights 500, 600, 900 are used in CSS but the browser synthesises from the 700 cut — acceptable for prototype.
- All previous `font-family: Georgia, serif` and `font-family: 'Inter', sans-serif` declarations replaced with `font-family: 'PartnerSerif', serif`.

---

## Architecture

### Three.js Canvas
- `#three-canvas` is `position: fixed`, full viewport, `z-index: 0`, `pointer-events: none`
- `alpha: true`, `setClearColor(0,0)` — fully transparent; page background shows through
- HTML sections sit above at `z-index: 1`
- `cameraLookAt` is a plain `{ x, y, z }` object animated by GSAP; `camera.lookAt()` is called every frame so the two stay decoupled

### Page Scroll Model
`body { overflow: hidden }` — locked viewport. No native scroll. All transitions driven by wheel events accumulating into `postScroll`, which tweens GSAP timeline progress.

### Text Positioning Convention
All hero text uses `position: absolute` with `left`/`top`/`bottom` set via `positionHeroElements()` — **never CSS `text-align`**. All text children have `width: fit-content` so each element measures its own width independently.

### Animation System — Two Timelines

#### 1. `heroTl` — wheel-triggered (play/reverse)
Fires once on first scroll intent. The wheel handler checks `heroTl.progress() < 1` — the single gate.

#### 2. `postHeroTl` — scroll-progress driven
A single paused GSAP timeline. Wheel handler tweens `postHeroTl.progress` directly:
```js
gsap.to(postHeroTl, { progress: postScroll / POST_TOTAL, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
```
- `postScroll` — accumulated raw `deltaY` clamped to `[0, POST_TOTAL]` (currently 8200)
- `POST_TOTAL = 7400` (18.5 timeline units × 400 deltaY/unit)
- `ease: 'none'` on every tween inside `postHeroTl` — the progress tween provides all easing
- `overwrite: 'auto'` — each wheel event supersedes the previous progress tween
- **Never use `play()` / `reverse()` for scroll-driven animation** — tweening `progress` directly avoids snap/jump from recorded from/to values

### Shared State Object
```js
const scrollState = { postScroll: 0, postHeroTl: null, POST_TOTAL: 8200, heroTl: null };
```
Populated during `fonts.ready` so external code (nav panel, side nav) can drive scroll without living inside the closure.

### Programmatic Jump — `scrollState.jumpTo(target)`
Defined inside `fonts.ready` (closes over the local `postScroll` variable so the wheel handler stays in sync). Usage:
```js
scrollState.jumpTo(4500); // jumps to postScrollTarget=4500 (t=11.25 in postHeroTl)
```
- Clamps to `[0, POST_TOTAL]`, updates both `postScroll` (local) and `scrollState.postScroll`
- Instantly completes `heroTl` if not yet played (`heroTl.progress(1)`)
- Sets `isJumping = true`, tweens `postHeroTl.progress` over 0.6s, resets `isJumping = false` in `onComplete`

#### `isJumping` flag
`let isJumping = false` lives inside `fonts.ready`, checked in the `postHeroTl.onUpdate` callback. When `true`, section entry timelines are snapped to their target state (`entryTl.progress(1).pause()` forward, `entryTl.progress(0).pause()` backward) instead of playing at their normal 0.85s speed. Without this, a jump from `ps=0` to `ps=4500` would cause `s3EntryTl` and `s4EntryTl` to play mid-jump, racing against the progress tween and leaving the accordion partially entered.

---

## Sections Built

### Fixed Chrome
- **`#main-header`** — `position: fixed`, `z-index: 100`
  - Left: hamburger (three `<span>` bars)
  - Centre: `beyond.png` logo (`height: 36px`)
  - Right: `.header-enquire` (grey bg `#999`, uppercase PartnerSerif)

---

### Side Navigation (`#side-nav`)
`position: fixed; left: 24px; top: 50%; transform: translateY(-50%); z-index: 50`. Items built from `SIDE_NAV` config by `initSideNav()` in `site.js`.

#### Config (top of `site.js`, easy to edit):
```js
const SIDE_NAV = [
    { label: '01', postScrollTarget:    0 },  // section target
    { label: '02', postScrollTarget: 4500 },  // section-five text reveal (t=11.25 × 400)
    { label: '03', postScrollTarget: 5800 },  // section target
];
```
`postScrollTarget = timeline_time × 400`. Key landmarks: `t=5.5→2200` (S3), `t=7.5→3000` (S4), `t=11.25→4500` (S5 text), `t=14.5→5800` (S6), `t=18.0→7200` (S7).

#### Visual behaviour
- Inactive: `transform: scale(0.72); opacity: 0.28` — 350ms CSS transition
- Active (`.is-active`): `transform: scale(1.5); opacity: 1; font-weight: 700`
- Fixed 32×32px container per item so layout doesn't shift on scale change
- `gsap.ticker.add()` checks `scrollState.postScroll` every frame to keep active class current

#### Click behaviour
Calls `scrollState.jumpTo(entry.postScrollTarget)`. If `jumpTo` isn't available yet (fonts.ready not resolved), the click is a no-op.

---

### Section 1 — Hero (`#hero`, `height: 100vh`)
Background: body `#d2d2d2` shows through transparent canvas.

#### HTML elements
| Element | Content | Initial position |
|---|---|---|
| `#hero-title` | `.title-word` spans + `#hero-subtitle` | `left: 45px`, `top: 115px` |
| `.title-word` ×2 | "FIFTH", "AVENUE" | block, `width: fit-content` |
| `#hero-subtitle` | "Tellapur, 2027" | inside `#hero-title`, `margin-top: 6px` |
| `#hero-desc` | Two `<p>` tags | `left: 45px`, `bottom: 52px` |
| `#hero-line` | 1px × 100vh vertical line | `left: 95%` |

**Fonts:** title words PartnerSerif 900 `clamp(90px, 8.5vw, 200px)` `line-height: 0.88`; subtitle PartnerSerif 16px; desc PartnerSerif 16px.

#### Three.js — Building
GLTF model loaded into a `THREE.Group` (transform anchor):
```
building.position = (2.2, -1.3, 0)
building.rotation.y = 0.12 + Math.PI/2
gltf.scene.scale.setScalar(0.31)
```
Camera: `PerspectiveCamera(60°)` at `(0, 0, 5)`, lookAt `(0, 0, 0)`.

Lights:
- `AmbientLight(#fff, 0.65)`
- Key: `DirectionalLight(#fff, 0.55)` from `(-3, 8, 6)`
- Fill: `DirectionalLight(#fff, 0.18)` from `(5, 2, -4)`

#### Hero Scroll Animation (`heroTl`)
Trigger: `wheel` event, wrapped in `document.fonts.ready`.

**All simultaneous (1.4s, `power2.inOut`):**
| Target | To |
|---|---|
| `camera.position` | `(7, 0, 2)` |
| `cameraLookAt` | `(4.5, 0, -1)` |
| Each `.title-word`, `#hero-subtitle`, `#hero-desc p` | `x` calculated for right-flush at `viewport - 45px` |
| `#hero-line` | exits right edge |

Right-flush technique: each element animated to its own `x` end value (`viewport - margin - el.getBoundingClientRect().left - el.offsetWidth`).

---

### Section 2 — Building Face + Content (`#section-two`)
`position: fixed; top: 0; left: 0; 100% × 100%; z-index: 1; pointer-events: none`. Starts `opacity: 0`. GSAP fades in as part of `postHeroTl`.

#### postHeroTl layout (total duration = 5)

| Time | Phase |
|---|---|
| 0.0 → 1.5 | Phase 1 — zoom in: camera to face, building flattens, hero fades, content fades in |
| 1.5 → 5.0 | Phase 2 — camera drifts down face, content + lines scroll up |

**Phase 1 tweens:**
| Target | To |
|---|---|
| `camera.position` | `(3.35, 1.12, 2.6)` |
| `cameraLookAt` | `(3.35, 1.12, 0.6)` |
| `building.rotation.y` | `0` |
| `[heroTitle, heroDesc, heroLine]` opacity | `0` |
| `sectionTwo` opacity (starts t=0.5) | `1` |

**Phase 2 tweens:**
| Target | To |
|---|---|
| `camera.position.y` | `-3.5` |
| `cameraLookAt.y` | `-3.5` |
| `[s2Inner, s2LinesInner]` translateY | `-(window.innerHeight - 167) * 3` |

`s2Inner` and `s2LinesInner` receive the **same tween** so text and tether lines stay locked.

#### Section 2 — Scroll Mechanic
`#s2-content` is a clip window (`overflow: hidden`, `left: 50%`, `right: 45px`, `top: 115px`, `bottom: 52px`). Inside it, `#s2-inner` is a tall flex-column strip. Each `.s2-item` is `height: calc(100vh - 167px)` — exactly one "slot". GSAP translates `#s2-inner` upward by 3 slots over phase 2. Items physically enter/exit the clip window as the camera scrolls the building.

#### Tether Lines
A parallel container `#s2-lines-wrap` mirrors `#s2-content`'s top/bottom/overflow but spans `left: 42%; right: 50%` (the gap between building right edge and content left edge). Inside it, `#s2-lines-inner` has 4 `.s2-line-slot` divs (same height as `.s2-item`, `align-items: center`), each containing a `.s2-tether-line` (1px, `width: 100%`, `transform-origin: left center`, initially `scaleX: 0`).

`#s2-lines-inner` gets the **same translateY tween** as `#s2-inner` — both are passed as `[s2Inner, s2LinesInner]` to a single GSAP `.to()`. This keeps lines and headings vertically locked as they scroll.

**`left: 42%` on `#s2-lines-wrap` is the visual tuning knob** — adjust to align with the building's right edge on screen.

#### Reveal Animations
Each item: `fromTo` tweens for line (`scaleX 0→1`), heading (`opacity 0→1`), body (`opacity 0→1`). `fromTo` used (not `.to`) to ensure clean reversal when scrolling back. `ease: 'none'` on all.

| Item | Line at | Heading at | Body at |
|---|---|---|---|
| 1 | t=0.7 | t=0.85 | t=0.95 |
| 2 | t=2.0 | t=2.15 | t=2.25 |
| 3 | t=3.15 | t=3.3 | t=3.4 |
| 4 | t=4.3 | t=4.45 | t=4.55 |

Timing rationale: content enters clip bottom at t≈2.08, 3.25, 4.42 for items 2–4 (based on `justify-content: center` centering and slot height). Reveal fires just before the content crosses the clip boundary, so the line draws as text rises into view.

**`.s2-heading` and `.s2-body` both have `opacity: 0` in CSS** — initial state before GSAP reveals them.

#### Section 2 Content — 4 items (`.s2-item`)
- `.s2-heading` — PartnerSerif, 32px, `color: #0f0f0f`
- `.s2-body` — PartnerSerif, 14px, `line-height: 1.72`, `color: #333`

Items: Privacy & Open Views / Material Intelligence / Ceiling Height / Centralised Hot Water System

---

### Section 3 — Residency Overview (`#section-three`)
`position: fixed; z-index: 2` — above canvas (z-index: 0) and section-two (z-index: 1). Two panels fill 50/50 of viewport. No background on the container; panels carry their own colour.

#### Entry animation — `s3EntryTl` (not scrubbed)
Plays/reverses once via `postHeroTl` `onUpdate` when timeline-time crosses `S3_TRIGGER_T = 5.5`. Not tied to scroll speed — plays at its own 0.85s pace. Reverses cleanly when scrolling back past the threshold.

**Visibility pattern** — `#section-three` has `visibility: hidden` in CSS from the start (prevents FOUC before JS runs). GSAP `gsap.set()` only manages `x` on the child panels. Sequence:
1. `onUpdate` threshold crossed → snap panels to off-screen (`gsap.set(s3Left, { x: '-100%' })`, `gsap.set(s3Right, { x: '100%' })`) then `gsap.set(sectionThree, { visibility: 'visible' })` then `s3EntryTl.play()`. The explicit snap before the visibility flip eliminates the one-frame flash caused by GSAP's RAF delay.
2. Scrolling back → `s3EntryTl.reverse()`
3. `s3EntryTl.onReverseComplete` → `gsap.set(sectionThree, { visibility: 'hidden' })` (guarded by `!s3Triggered` to prevent race on fast re-scroll)

**Do not put CSS `transform` on `#s3-left` or `#s3-right`** — GSAP stacks its own `x` on top of any existing CSS transform, breaking the `fromTo` from/to endpoints.

Panels animated by `gsap.set()` before `s3EntryTl` is defined:
- `#s3-left`: `x: '-100%'` → `x: 0` (`power2.out`, 0.85s)
- `#s3-right`: `x: '100%'` → `x: 0` (`power2.out`, 0.85s)

The existing `#main-header` stays visible and unchanged throughout.

#### Phase 3 in `postHeroTl` (t=5 → 6.5)
`fromTo([sectionTwo, canvas], { y: 0 }, { y: -window.innerHeight, ... }, 5)` — both fixed elements exit upward. `fromTo` ensures clean reversal.

`POST_TOTAL` extended from 2000 → **2600** (6.5 × 400 deltaY/unit). Later extended to **3200** (8.0 units) for section 4 — see below.

#### Left panel (`#s3-left`) — white
`pointer-events: auto` overrides the `pointer-events: none` on the container so mouse events reach the accordion.

- `#s3-heading`: PartnerSerif 900, `clamp(30px, 3vw, 52px)`
- `#s3-stats`: CSS grid, 2 columns, 2 rows — SIZE / CEILING HT. / HOT WATER / A/C. Labels: PartnerSerif 10.5px uppercase `#777`. Values: PartnerSerif 15px bold `#0f0f0f`.
- `#s3-accordion`: `border-top/bottom: 1px solid #0f0f0f`. Light `#ccc` dividers between items. All three items start with white background — **no permanently active state**. Hover state: `background: #e4e4e4`.
- `#s3-footer-text`: `margin-top: auto` — pinned to bottom of flex column. PartnerSerif 13px, `#555`.

#### Right panel (`#s3-right`) — `#d2d2d2`
Plain grey panel, no internal elements. The existing `#main-header` (z-index: 100) persists above section-three unchanged.

#### Accordion hover interaction
`mouseenter` / `mouseleave` listeners (added inside `document.fonts.ready`) shift `#s3-right`'s background to a distinct grey per item, hinting at future image content. Reverts to `#d2d2d2` on leave.

| Item | Panel tint on hover |
|---|---|
| Layout | `#c8c8c8` |
| Materials | `#d8d8d8` |
| Surroundings | `#bebebe` |

---

### Section 4 — Amenities Accordion (`#section-four`)
`position: fixed; z-index: 3; background: #ffffff; visibility: hidden` — white backdrop, hidden until `s4EntryTl` fires.

#### Key variables
- `s4BottomClip = S4_COLLAPSED_H * (s4Items.length - 1)` = 192px — the vertical space items 1–3 occupy when collapsed. Used as both the items' y start offset and the clip-path end value.
- `s4Item0Grey = s4Items[0].querySelector('.s4-item-grey')` — cached reference to item 0's grey box, hidden during entry so s3-right serves as the visual grey.

#### Entry animation — `s4EntryTl` (not scrubbed)
Plays/reverses once via `postHeroTl` `onUpdate` when timeline-time crosses `S4_TRIGGER_T = 7.5`.

**Before `s4EntryTl.play()`** (set in onUpdate, in this order):
1. `gsap.set(sectionThree, { zIndex: 4 })` — raises section-three above section-four's white backdrop
2. `gsap.set(s3Right, { position: 'fixed', top: 0, left: '50%', right: 0, bottom: 0, width: 'auto', height: 'auto', clipPath: 'inset(0 0 0px 0)' })` — detaches s3-right from flex flow, initialises clip-path to a compatible value
3. Accordion heights reset: item 0 expanded (`computeS4ExpandedH()`), rest `S4_COLLAPSED_H = 64px`
4. `gsap.set(s4Items[0], { x: window.innerWidth })` — item 0 starts off-screen right
5. `gsap.set(Array.from(s4Items).slice(1), { y: s4BottomClip })` — items 1–3 start off-screen below
6. `gsap.set(s4Item0Grey, { opacity: 0 })` — hide item 0's own grey box; s3-right is the visual grey
7. `gsap.set(sectionFour, { visibility: 'visible' })`

**`s4EntryTl` tweens:**
| Target | From | To | Time |
|---|---|---|---|
| `#s3-right` position | `top:0, left:'50%', right:0` | `top:116, left:'28%', right:'28%'` | 0, 0.85s |
| `#s3-left` | `x: 0` | `x: '-100%'` | 0, 0.85s |
| `s4Items[0]` | `x: window.innerWidth` | `x: 0` | 0, 0.85s |
| `s4Items[1–3]` | `y: 192` | `y: 0` | 0, 0.85s |
| `#s3-right` clip-path | `inset(0 0 0px 0)` | `inset(0 0 192px 0)` | 0, 0.85s |
| `#s3-right` opacity | `1` | `0` | 0.85, 0.2s |
| `s4Item0Grey` opacity | `0` | `1` | 0.85, 0.2s |

**`onReverseComplete`** (guarded by `!s4Triggered`):
- `gsap.set(s3Right, { clearProps: 'position,top,left,right,bottom,width,height,opacity,clipPath' })`
- `gsap.set(s4Items, { clearProps: 'x,y' })`
- `gsap.set(s4Item0Grey, { clearProps: 'opacity' })`
- `gsap.set(sectionThree, { zIndex: 2 })`
- `gsap.set(sectionFour, { visibility: 'hidden' })`
- Accordion heights reset to default (item 0 expanded) for next entry

#### Timeline extension
`postHeroTl` extended with `.to({}, { duration: 1.5 }, 6.5)` — dummy tween, pads to t=8.0 for s4 trigger window.
`POST_TOTAL_DURATION = 14.1`, `POST_TOTAL = 5640` (400 deltaY/unit). Extended by Phase 5 — see Section 5 below.

#### Layout — `#section-four`
- `#s4-line-top` — 1px `#0f0f0f` line at `top: 115px`
- `#s4-accordion` — `position: absolute; top: 116px; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column`

#### Accordion — `.s4-item` ×4
Items: Clubhouse / Sports Complex / Walking Track / Swimming Pool.

Each item uses **height animation + `overflow: hidden`** as its reveal mechanism — no opacity needed. GSAP animates between:
- **Collapsed:** `height: S4_COLLAPSED_H = 64px` — shows label only
- **Expanded:** `height: computeS4ExpandedH() = window.innerHeight - 116 - 64 * 3` — fills remaining space

Each item has three zones (`position: absolute`, full item height):
| Zone | CSS | Content |
|---|---|---|
| Label | `left:0; right:28%; height:64px; z-index:1` | PartnerSerif 900 label, always visible |
| Grey box | `left:28%; right:28%; top:64px; bottom:0` | `#d2d2d2`, body zone only |
| Right | `left:74%; right:45px; top:64px; bottom:0; justify-content:space-between` | desc (top) + stats grid (bottom) |

**Grey box `top: 64px` in CSS (default = collapsed state).** In collapsed items the grey box starts exactly at the item's bottom edge (0px visible). When an item expands, `openS4Item` also animates the grey box `top` to `0` so it fills the full item height including the label row. Collapsing snaps it back to `top: 64`. This pattern is reset in all three places accordion heights are reset: initial setup, `onUpdate` s4 entry block, and `s4EntryTl.onReverseComplete`.

#### Hover interaction
`openS4Item(index)` — expands target item, collapses all others (0.45s, `power2.inOut`, `overwrite: 'auto'`). Also animates each item's `.s4-item-grey` `top` between `0` (expanded) and `S4_COLLAPSED_H` (collapsed) in the same call. Triggered by `mouseenter` on each `.s4-item`. No mouseleave reset — always exactly one item open.

`s4ActiveItem` tracks the current open index. `computeS4ExpandedH()` recalculates on each call so it's resize-safe.

---

### Section 5 — Expanding Grey (`#section-five`)
`position: fixed; inset: 0; z-index: 5; pointer-events: none` — above all previous sections.

#### Phase 5 in `postHeroTl` (t=10.0 → 14.1)

**Dwell window in Section 4:** t=7.5 (s4 entry) → t=10.0 (Phase 5 start) = 2.5 units (1000 deltaY). Intentionally wide so users can interact with the amenities accordion before the exit.

| Time | What |
|---|---|
| 10.0 → 11.5 | `.s4-item` ×4 exit right (entire row: border, label, grey box, right col move together) |
| 10.0 → 11.5 | `#s4-line-top` exits right |
| 11.1 → 14.1 | `#s5-box` scales from `0 → 1` (starts at 73% through the s4 exit) |
| 11.25 → 11.85 | Text fades in (`#s5-label`, `#s5-title-top`, `#s5-title-bottom`, `#s5-body`) — triggered at 5% box scale |
| 12.4 → 13.4 | `#s5-title-top` rotates away upward + drifts up + fades out (`rotateX: 0→85, y: 0→-70, opacity: 1→0`) |
| 12.4 → 13.4 | `#s5-title-bottom` rotates away downward + drifts down + fades out (`rotateX: 0→-85, y: 0→70, opacity: 1→0`) |

**Section 4 exit — whole item animation:** `.s4-item` elements are animated as units (`fromTo s4Items, { x:0 }, { x: window.innerWidth }`). This is required because `border-top` lives on the item element itself and cannot be moved by animating children alone.

**`#s5-box`:** `position: absolute; inset: 0; background: #d2d2d2`. Starts at `scale: 0; transformOrigin: center center` (set via `gsap.set` at init). Animates to `scale: 1` over 3.0 timeline units.

#### Section 5 — Text Content
All text elements are `position: absolute` inside `#section-five`, stacked above `#s5-box` via DOM order (no z-index needed). All start `opacity: 0` in CSS.

| Element | Content | Position |
|---|---|---|
| `#s5-label` | `\| Sustainability \|` | `top: 58px`, centered, PartnerSerif 11px uppercase |
| `#s5-title-top` | "The Anatomy" | `bottom: 68%`, centered, PartnerSerif 900 `clamp(58px, 7.5vw, 108px)` |
| `#s5-title-bottom` | "Of Your Home" | `top: 68%`, centered, same font |
| `#s5-body` | paragraph | `top: 84%`, centered, PartnerSerif 15px, `width: min(460px, 80vw)` |

**`transformPerspective: 900`** set via `gsap.set` on both title elements at init — bakes perspective into each element so the fixed stacking context is not affected.

**`opacity: 1` must NOT appear in the `from` object of the rotateX tweens** — GSAP records `from` values immediately at timeline creation (for scrub-back purposes), which overwrites the CSS `opacity: 0` and makes the text visible on page load. Keep `opacity` only in the `to` object; GSAP captures the live value (1, after the fade-in tween) when the playhead arrives.

`POST_TOTAL_DURATION` extended to **18.5** (was 14.1). `POST_TOTAL` = **7400**. Timeline padded with `.to({}, { duration: 2.4 }, 14.1)` then `.to({}, { duration: 2.0 }, 16.5)` for s6 and footer dwell windows.

---

### Section 6 — Full Viewport (`#section-six`)
`position: fixed; inset: 0; z-index: 6; background: #ffffff; visibility: hidden`.

#### Entry animation — `s6EntryTl` (not scrubbed)
Plays/reverses once via `postHeroTl` `onUpdate` when timeline-time crosses `S6_TRIGGER_T = 14.5`.

**Before `s6EntryTl.play()`:** `gsap.set(sectionSix, { y: '100%' })` snaps it off-screen bottom, then `visibility: visible`.

`s6EntryTl`: `fromTo(sectionSix, { y: '100%' }, { y: 0, duration: 0.85, ease: 'power2.out' })`.

`onReverseComplete` (guarded by `!s6Triggered`): `gsap.set(sectionSix, { visibility: 'hidden' })`.

#### Content
| Element | Content | Position |
|---|---|---|
| `#s6-heading` | "If We Found You at Fifth Avenue, Where Would You Be?" | `top: 115px`, centered, PartnerSerif 500 `clamp(24px, 4vw, 52px)` |
| `#s6-map-wrap` | canvas wrapper + pin overlays | `top: 258px; bottom: 148px; left: 6%; right: 6%` |
| `#s6-map` | Three.js locality map canvas | `width: 100%; height: 100%` inside wrapper |
| `#s6-body` | body paragraph | `bottom: 52px`, centered, PartnerSerif 15px, `width: min(480px, 80vw)` |

#### Locality Map — `#s6-map`
Separate Three.js renderer/scene/camera — fully independent from the building canvas. Initialized in `initS6Map()`, called at the end of `document.fonts.ready`. Returns a `renderMap` function stored in the module-level `let renderMap = null`, called every frame in `animate()`.

- **Renderer:** `setClearColor(0xffffff, 1)` — plain white, seamless with section background
- **Camera:** `PerspectiveCamera(40°)`, base position `(14, 14, 12)`, `lookAt(0, 0, 0)`
- **Geometry:** all `MeshBasicMaterial` (no lighting needed). Ground plane `#eeeae4`. Roads `#d0ccc6` (2 horizontal + 2 vertical + 1 minor alley). Parks `#becfaa`. Buildings `#e6e2dc` fill + `EdgesGeometry` dark `#1c1c1c` wireframe edges.
- **Layout:** 3×3 city block grid. Roads at x=±4, z=±4. Parks in 3 corner blocks. Central block has tallest buildings (5.5 units) — the project. Surrounding blocks have 1.0–4.5 unit clusters.
- **Mouse parallax:** `mousemove` on canvas maps cursor to `±2.5` unit `targetOffset` in x/z. `liveOffset` lerps toward target at `0.04` per frame. `mouseleave` resets target to zero. Camera position = `basePos + liveOffset`. No auto-orbit.

#### Map Pins — `.map-pin`
Three HTML overlays inside `#s6-map-wrap` positioned with inline `left`/`top` percentages. Each is a flex column (card above, dot below) so hover state covers the full card-to-dot span without flicker.

| Pin | `left / top` | Label | Title |
|---|---|---|---|
| Park | `20% / 33%` | Open Space | The Grove |
| Road | `45% / 41%` | Connectivity | Main Approach |
| Clubhouse | `64% / 54%` | Amenity | Clubhouse |

**Structure per pin:**
```html
<div class="map-pin" style="left: X%; top: Y%">
    <div class="map-pin-card"> <!-- label, title, <ul class="map-pin-features"> --> </div>
    <div class="map-dot"></div>
</div>
```

- `.map-pin`: `position: absolute; transform: translate(-50%, -50%)` — centers dot exactly on coordinates
- `.map-dot`: 7px circle, `#0f0f0f`, ring shadow. Scales `1.5×` on `.map-pin:hover`
- `.map-pin-card`: `opacity: 0; transform: translateY(5px)` → `opacity: 1; translateY(0)` on hover, `transition: 0.18s ease`. `margin-bottom: 10px` creates the visual gap between card and dot while keeping the hover area connected.
- `.map-pin-features`: `list-style: none`, bullet via `::before` 3px circle `#bbb`, PartnerSerif 11px

**Adjusting pin positions:** edit `style="left: X%; top: Y%"` inline on each `.map-pin`. Positions are approximate to the camera angle `(14,14,12) → (0,0,0)` and need eyeballing in-browser.

---

### Fixed Chrome (continued)

#### Shared Header (`#main-header`) — `shared/inject-header.js`

`position: fixed; top: 16px; left: 16px; right: 16px; z-index: 100` — floats off all three edges, does not touch the viewport boundary.

**To add to a page:** one script tag before `site.js`:
```html
<script src="../../shared/inject-header.js"></script>   <!-- projects page/* -->
<script src="../shared/inject-header.js"></script>        <!-- beyond-home/, about prototype/ -->
```
No inline header markup or CSS needed in the page — all injected by the IIFE.

**Structure:**
- `#main-header` — outer shell, `overflow: hidden`, transitions `height: 60px → 50vh` on `.is-open`
  - `.header-bar` — 60px row, always visible. Logo left, hamburger right.
  - `.header-nav` — dropdown content, `height: calc(50vh - 60px)`, fades in after panel opens

**Hamburger → X animation** — single button, no separate close element. CSS transitions on the three `<span>` bars:
- bar 1: `translateY(6.5px) rotate(45deg)`
- bar 2: `opacity: 0; scaleX(0)`
- bar 3: `translateY(-6.5px) rotate(-45deg)`
All triggered by `.is-open` on `#main-header`.

**Overlay** — `#nav-overlay` at `z-index: 99`. `pointer-events: none` when closed, clicking it calls `closeMenu()`.

**Nav layout:**
- `.header-nav-grid` — flex row, `justify-content: space-between`. Four `.nav-col` items: Home / Our Pillars / Projects / Connect.
- Projects col has `.nav-sub` with Fifth Avenue + Roots sub-links.
- `.header-nav-footer` — `border-top: 1px solid #d0d0d0`, tagline left + "Work room" right.

**Page links** — resolved via `document.currentScript.src` at load time (same trick as logo), so paths are correct regardless of which page loads the script:
```
_root = script dir → strip /shared → Beyond Concrete root
Home       → _root + /beyond-home/index.html
Our Pillars → _root + /about prototype/index.html
Fifth Avenue → _root + /projects page/fifth ave/index.html
Roots       → _root + /projects page/roots/index.html
Connect     → scrollState.jumpTo(POST_TOTAL) if available, else scrollIntoView(#section-seven)
```

**Connect scroll** — requires `window.scrollState = scrollState` in `site.js` (added after the `const scrollState` declaration). The inject script checks `window.scrollState.jumpTo` at click time; falls back to `scrollIntoView` on non-scroll-driven pages.

**`const` vs `window`** — `const scrollState` in `site.js` is NOT on `window` by default. The explicit `window.scrollState = scrollState` assignment is required so the inject-header click handler (different script scope) can reach it.

---

### Section 7 — Contact + Footer (`#section-seven`)

`position: fixed; inset: 0; z-index: 7; visibility: hidden` — set in `index.html` inline `<style>`. All visual CSS and markup live in `shared/inject-contact-footer.js` (self-contained, no fetch).

#### Shared Component — `shared/inject-contact-footer.js`

A self-contained IIFE. All HTML and CSS are baked in as a template literal — no fetch, no parsing, no intermediate DOM manipulation. Calls `document.body.insertAdjacentHTML('beforeend', ...)` once, then fires `contactFooterReady`. The `contact-footer.html` file in `shared/` is now unused and can be deleted.

**To edit content or styles:** open `Beyond Concrete/shared/inject-contact-footer.js` and edit the template literal directly.

**To add footer JS:** add it inside the IIFE after the `insertAdjacentHTML` call. Elements are synchronously in the DOM at that point — no waiting needed. GSAP-dependent logic (scroll triggers, visibility) still belongs in `site.js` inside `initS7()`.

**In `index.html`:** `<script src="../../shared/inject-contact-footer.js"></script>` placed before `site.js`. No inline section-seven markup.

**In `site.js`:** `sectionSeven` is `let` (not `const`). S7 init in `initS7()` inside `fonts.ready`. Called immediately if element exists; otherwise waits on `contactFooterReady` one-shot listener. `s7SwapTl`, `s7EntryTl`, and `s7Triggered` are `let` in the outer closure. `onUpdate` s7 block guarded by `if (sectionSeven && s7SwapTl && s7EntryTl)`.

#### Two-timeline system for Section 7

Two separate timelines handle entry and exit independently:

**`s7SwapTl`** — page-swap only. **Always reverses** on scroll-back, giving a smooth "scrolling up" feel.
```js
s7SwapTl
    .fromTo(sectionSeven, { y: '100%' }, { y: 0, duration: 0.65, ease: 'power2.out' }, 0);
```
Section-six is **not** in this timeline — it stays at `y:0` under section-seven (z-index 6 < 7). When `s7SwapTl` reverses, section-seven slides back down and reveals section-six beneath it. `onReverseComplete` (guarded by `!s7Triggered`): `gsap.set(sectionSeven, { visibility: 'hidden' })`.

**`s7EntryTl`** — footer reveal only. **Resets to `progress(0)`, never reverses.** Plays fresh on every re-entry.
```js
s7EntryTl
    .fromTo(ftLeft,      { x: '-100%' }, { x: 0, 0.55s, power2.out }, 0.65)
    .fromTo(ftNavGrid,   { opacity:0, y:8 }, { opacity:1, y:0, 0.3s }, 1.2)
    .fromTo(ftWeather,   { opacity:0 },      { opacity:1, 0.25s },     1.2)
    .fromTo(ftSocial,    { opacity:0, y:6 }, { opacity:1, y:0, 0.3s }, 1.3)
    .fromTo(ftClouds,    { opacity:0 },      { opacity:1, 0.4s },      1.35)
    .fromTo(ftBottom,    { opacity:0 },      { opacity:1, 0.25s },     1.45)
    .fromTo(ftHead,      { opacity:0, x:10 },{ opacity:1, x:0, 0.4s }, 1.2)
    .fromTo(ftAddrBlock, { opacity:0 },      { opacity:1, 0.25s },     1.45);
```
Initial states set via `gsap.set` in `initS7`: `ftLeft` at `x: '-100%'`, all content elements at `opacity: 0`.

**Sequence (0.65s page-swap → 0.55s ft-left slide → staggered content reveals):**
- `0 → 0.65s`: section-seven rises
- `0.65 → 1.2s`: `.ft-left` slides in from left
- `1.2s+`: nav, weather, head, social, clouds, address, credit stagger in

#### Entry trigger — `S7_TRIGGER_T = 18.0`
**Before `s7SwapTl.play()`:** snap `sectionSeven` to `y: '100%'`, set `visibility: visible`, add `.is-in` class.

On scroll-back (`t < S7_TRIGGER_T`): `s7EntryTl.progress(0).pause()` (instant reset), then `s7SwapTl.reverse()` (smooth exit).

`POST_TOTAL_DURATION = 20.5`, `POST_TOTAL = 8200` (20.5 × 400 deltaY/unit). S6 dwell window t=14.5 → 18.0 (3.5 units = 1400 deltaY). S7 dwell window t=18.0 → 20.5 (2.5 units).

#### Layout — two halves, stacked vertically

**Top half — `#s7-contact`**
`position: absolute; top: 0; left: 0; right: 0; height: 50%; background: #d2d2d2`. Flexbox row, `align-items: center`, `padding: 0 6%`, `gap: 8%`. Separated from footer by `border-bottom: 1px solid #c4c4c4`. Has `pointer-events: auto` override in `index.html` (parent layers use `pointer-events: none`).

| Zone | CSS | Content |
|---|---|---|
| `.ct-left` | `flex: 0 0 36%` | title + sub-copy |
| `.ct-form` | `flex: 1` | three-field form |

`.ct-title` — PartnerSerif 500, `clamp(26px, 1.4vw, 46px)`, `line-height: 1.15`. Natural wrapping, no forced `<br>`.
`.ct-sub` — PartnerSerif 14px, `color: #555`.

Form fields (`.ct-field`) are flex rows with `border-bottom: 1px solid #0f0f0f` on the **field row** (not the input). `.ct-label` (`flex: 0 0 72px`, PartnerSerif 12px, `#666`, `letter-spacing: 0.06em`) + `.ct-input-wrap` (`flex: 1`). `.ct-input` is borderless/backgroundless. Placeholder text (`::placeholder`) is italic `#aaa`.

SUBMIT button (`.ct-submit`): `align-self: flex-end`, white bg, `border: 1px solid #0f0f0f`, dark text. Inverts on hover (`background: #0f0f0f; color: #ffffff`).

No `.ct-help` helper text — placeholder attributes on the input carry the hint copy.

**Bottom half — `#s7-footer`**
`position: absolute; bottom: 0; left: 0; right: 0; height: 50%; display: flex`.

Two-column layout — the old `ft-base`/`ft-dark` two-layer wipe system is removed. `@property --fw` remains registered (JS still adds/removes `.is-in` class) but no `.ft-dark` element uses it — the wipe is dormant.

#### Footer — Left Panel (`.ft-left`, `flex: 0 0 64%`)
`background: #878787`, dark grey. Flex column, `padding: 28px 4% 22px`.

- **`.ft-nav-grid`** — flex row, `gap: 52px`
  - `.ft-nav-col` col 1: WORK / ABOUT / CONTACT links
  - `.ft-nav-col` col 2: WORK ROOM (span) / PROJECTS (span) + `.ft-nav-sub` with Fifth Avenue / Roots links
  - Nav links: PartnerSerif 13px, white. Sub-links: 12px, `rgba(255,255,255,0.65)`
- **`.ft-weather`** — `position: absolute; top: 28px; right: 4%`. Displays live weather placeholder: "25 C | HYDERABAD", HUMIDITY, WINDSPEED, AQI. PartnerSerif 11px uppercase, `rgba(255,255,255,0.8)`.
- **`.ft-social`** — flex row, `gap: 10px`, `margin-top: 24px`. YouTube / LinkedIn / Instagram inline SVGs in 28×28px bordered `border-radius: 5px` boxes.
- **`.ft-clouds`** — `flex: 1` spacer. Contains three inline SVGs from `shared/graphics/` positioned absolutely relative to `.ft-left` (which is `position: relative; overflow: hidden`). `.ft-clouds` itself has no `position` or `overflow` — the SVGs escape it and use `.ft-left` as their containing block.
  - `.fc-sun` — radial glow, `top: 10%; right: 12%; width: 80px`. Fixed, no animation.
  - `.fc-cloud2` — wide flat cloud, `bottom: 0; left: 0; width: 55%`. Drifts left −12px over 20s (`ft-drift2` keyframe, `ease-in-out infinite`).
  - `.fc-cloud1` — tall cloud, `bottom: 8%; right: 4%; width: 28%`. Drifts right +18px over 14s (`ft-drift1` keyframe, `ease-in-out infinite`).
  - **ViewBox corrections applied** — original SVG viewBoxes were too small for their path content. Fixed: sun `0 0 371 371`, cloud2 `0 -47 462 190`, cloud1 `-470 -62 635 256`.
- **`.ft-bottom`** — flex row, `justify-content: space-between`, `align-items: flex-end`
  - `.ft-credit`: "DESIGNED BY SPP", PartnerSerif 10px, `rgba(255,255,255,0.5)`

#### Footer — Right Panel (`.ft-right`, `flex: 1`)
`background: #ffffff`. Flex column.

- **`.ft-head`** — `flex: 1`, "Towards / Thought-Led / Development". PartnerSerif 400, `color: #aaaaaa`, `clamp(28px, 3vw, 54px)`, `line-height: 1.12`. `padding: 22px 8% 16px; padding-left: 0`.
- **`.ft-address-block`** — `padding: 16px`
  - `.ft-email`: "HELLO@BEYONDCONCRETE.IN" — PartnerSerif 11px 700, uppercase, `letter-spacing: 0.08em`, `#0f0f0f`
  - `.ft-address`: "BEYOND CONCRETE HQ, MALLESHWARAM, NEW OLD ROAD, HYDERABAD — 457367" — PartnerSerif 11px, `line-height: 1.8`, uppercase, `#444`

---

## Key Decisions & Gotchas

- **No `text-align` toggling** — switching mid-animation causes an instant jump. All alignment via `translateX`.
- **`width: fit-content` required** — block children inside an absolutely-positioned container expand to container width, making all `offsetWidth` values identical.
- **`cameraLookAt.y` stays 0 during hero** — animating it caused visible downward tilt.
- **`document.fonts.ready` wrap** — local `@font-face` fonts also resolve via `fonts.ready`; measuring `offsetWidth` before fonts load gives wrong values.
- **`wheel` event for `heroTl`** — with only a 100vh hero, there's no scroll distance for ScrollTrigger.
- **`ease: 'none'` inside `postHeroTl`** — the `gsap.to(postHeroTl, { progress, ease: 'power2.out' })` call provides all easing. Double-easing creates erratic motion.
- **Never `play()` / `reverse()` for scroll-driven animation** — uses GSAP's recorded from/to values; reversing snaps. Tweening `progress` always starts from current state.
- **`#section-two` as `position: fixed`** — keeps it out of document flow, adds no height.
- **`postScroll` as source of truth** — DOM values lag behind GSAP tweens mid-animation.
- **Tether lines must live outside `#s2-content`** — `overflow: hidden` on the clip window would cut them before they reach the building. The parallel `#s2-lines-wrap` + `#s2-lines-inner` pattern solves this: same clip bounds, same translateY, different horizontal span.
- **`[s2Inner, s2LinesInner]` as single tween target** — ensures text and lines move by identical amounts with zero drift.
- **`fromTo` for all reveal tweens** — GSAP's `.to()` captures "from" lazily on first playback; unreliable when scrubbing backward. `fromTo` makes both endpoints explicit.
- **`visibility: hidden` to hide fixed panels before entry** — not CSS `transform`, not `opacity: 0`, not `display: none`. Reason: GSAP stacks its own `x` transform on top of any existing CSS `transform`, breaking `fromTo` endpoints. `visibility` is a property GSAP never touches on these elements. Flip to `visible` immediately before `play()`, back to `hidden` in `onReverseComplete`. This pattern applies to both `#section-three` and `#section-four`.
- **Snap panels to from-state before visibility flip** — `gsap.set(panel, { x })` is synchronous; `s3EntryTl.play()` schedules on the next RAF. If visibility is set before that RAF fires, panels would briefly appear at their prior position. Fix: call `gsap.set` to snap panels off-screen in the same synchronous block as the visibility flip, so the browser never paints them at an unwanted position.
- **`onReverseComplete` guard with `!s3Triggered`** — if the user scrolls forward again before the reverse finishes, the callback must not re-hide the section. The flag check prevents this race.
- **To animate an element that "is" the same element across two sections:** detach it from layout (`position: fixed`, `width: auto`, `height: auto`) before the tween, animate its `top`/`left`/`right`/`bottom` to the new position, then restore with `clearProps` in `onReverseComplete`. Setting `width: auto` + `height: auto` is required so the inherited CSS `width`/`height` from the original layout don't override the new `left`/`right` bounds.
- **z-index swap for cross-layer exit visibility:** when a fixed section (z-index N) needs to show content from a section below (z-index N-1) during a transition, raise the lower section's z-index above N before play, then restore it in `onReverseComplete`. The raised section must have `pointer-events: none` (or its interactive children must not interfere) so mouse events reach the new section below.
- **`clearProps` restores flex-child layout cleanly** — only works seamlessly if the element is at the exact same visual position as where the CSS layout would place it. Time `clearProps` to fire at `onReverseComplete` (when the tween returns to its from-state) for a seamless snap-back.
- **Height + `overflow: hidden` as the reveal mechanism** — for accordion rows where label must always be visible but body content clips, use `overflow: hidden` on the item and animate `height`. No opacity needed. The label lives in a sub-container with a fixed `height: collapsedH` and `z-index: 1` so it sits above the grey box and is never clipped.
- **`computeS4ExpandedH()` called at tween time, not at init** — pass it as a function call inside `openS4Item` so resize changes are always reflected. Do the same for any height that depends on `window.innerHeight`.
- **s3-right IS item 0's grey box in s4EntryTl** — s3-right moves to the center strip and serves as the visual grey throughout. Item 0's own `.s4-item-grey` is hidden (`opacity: 0`) while s3-right is present. At t=0.85, s3-right fades out and item 0's grey fades in — invisible swap because they share colour and position. `clearProps` must include `opacity` and `clipPath` on s3-right and `opacity` on `s4Item0Grey`.
- **`clip-path` to simulate items clipping the grey box from below** — items 1–3 are in section-four (z:3) and cannot visually sit above s3-right in section-three (z:4). `clip-path: inset(0 0 Ypx 0)` on s3-right removes Y px from its bottom. Animating Y from 0 → 192 on the same duration and easing as items rising from y:192 → 0 means s3-right's visible bottom edge and items' top edge are always at the same pixel. Effect reads as items clipping the box even though they are technically behind it. Initialise s3-right's `clipPath` to `'inset(0 0 0px 0)'` in the onUpdate gsap.set (not just leaving it as CSS `none`) so GSAP has a compatible string to interpolate from. `clearProps` must include `'clipPath'`.
- **Grey box `top` animation in s4 accordion** — CSS sets `top: 64px` (collapsed default). `openS4Item` animates `top` to `0` for the opening item and back to `64` for closing items, simultaneously with the `height` tween. All three accordion reset sites (init, onUpdate s4 entry, onReverseComplete) must also reset grey box `top` alongside item height. Forgetting any one of these causes the grey box to appear/disappear incorrectly on re-entry.
- **Cannot split-animate children while the item exits as a unit** — animating `.s4-item` rightward AND its `.s4-item-grey` leftward produces net-zero movement for the grey box (transforms add), and `overflow: hidden` on the item clips the grey box to zero the moment it exits the item's left edge. For a split exit, remove `overflow: hidden` first. For a unified exit (all children move with the item), animate the item directly — this is how Phase 5 works.
- **Mixed NodeList + Element arrays in GSAP** — `[nodeList, singleEl]` is not reliably flattened by GSAP. Give each target its own `fromTo` call rather than trying to combine NodeLists and single elements in one array target.
- **`scale: 0` initial state must be set via `gsap.set` before the timeline runs** — `fromTo` in a paused timeline applies the `from` state only when the playhead first reaches that tween. Before that the element is at its CSS default (`scale` unset = 1), causing a flash. `gsap.set(el, { scale: 0 })` at init prevents this.
- **Two WebGL renderers on one page is fine** — the locality map uses a completely separate `WebGLRenderer`, `Scene`, and `PerspectiveCamera` from the building canvas. They share no state. Both are called in the same `animate()` RAF loop. The module-level `let renderMap = null` pattern lets `animate()` call the map renderer safely before `initS6Map()` has run.
- **`initS6Map()` must be called inside `document.fonts.ready`** — it reads `wrap.clientWidth / clientHeight` for the initial renderer size. Calling it before layout is settled (e.g. at module level before fonts load) returns stale dimensions. The fallback `|| window.innerWidth * 0.88` handles the edge case where the wrapper has zero size.
- **`visibility: hidden` does not pause rendering** — `#section-six` is hidden via `visibility: hidden` between entries. The map renderer keeps running every frame regardless. For a low-poly dummy this is negligible; if performance matters, gate `renderMap()` behind a `s6Visible` flag set in the `s6EntryTl` callbacks.
- **Map pin hover flicker fix** — card and dot are siblings inside `.map-pin` (flex column, card first). The parent's hover state covers both, so moving the mouse from dot up into the card never loses hover. If the card were outside the pin's hit area (e.g. `position: absolute` sibling rather than child), the gap between dot and card bottom would cause the card to flash off. The `margin-bottom: 10px` on the card is the visual gap; it is inside the parent hit area.
- **`#s6-map-wrap` position constraints** — four CSS knobs: `top` (clear the heading — heading bottom ≈ `115px + ~2 lines × clamp(24px,4vw,52px)`), `bottom` (clear the body — body top ≈ `52px + ~52px` of text), `left`/`right` (can go to 0 for full bleed). Current values: `top: 258px; bottom: 148px; left: 6%; right: 6%`.
- **Map pin positions are eyeballed percentages** — `left`/`top` inline on each `.map-pin` are approximations relative to the camera angle `(14,14,12) → (0,0,0)`. They are not computed from 3D projection. Adjust in-browser by editing the inline style. The `transform: translate(-50%, -50%)` on `.map-pin` centres the dot exactly on the given coordinate.
- **Page-swap via paired `fromTo` in one timeline** — to replace one fixed section with another without overlap, put both the outgoing exit (`y: 0 → -100%`) and the incoming entry (`y: 100% → 0`) as simultaneous `fromTo` tweens at `t=0` in the same timeline. Reversing the timeline cleanly restores both sections. Always snap both elements to their `from` states (`gsap.set`) before calling `play()`. (S6 uses this pattern; S7 does not exit S6 — see two-timeline system above.)
- **Don't put the outgoing section in the entry timeline if it has its own exit logic** — when two sections share a trigger threshold, animating the outgoing section in the incoming section's timeline creates a conflict: reversing the incoming section also reverses the outgoing section's exit, fighting with the outgoing section's own entry/exit timeline. Solution: only animate the incoming section in its timeline. Let the outgoing section sit at `y:0` underneath (covered by z-index) and be revealed naturally when the incoming section reverses out.
- **`@property` required for CSS custom property transitions** — registered on `#section-seven` for the `--fw` length. No longer actively used (wipe system removed) but kept so the JS `.is-in` toggle doesn't error.
- **`isJumping` flag for `scrollState.jumpTo`** — programmatic nav jumps (side nav click) tween `postHeroTl.progress` over 0.6s. During that tween, `onUpdate` fires continuously and can cross section entry thresholds (S3, S4, etc.), calling `s3EntryTl.play()` etc. Those independent timelines take 0.85s — they cannot complete before the jump finishes, leaving sections in a broken half-entered state. Fix: `isJumping = true` during the jump causes `onUpdate` to call `entryTl.progress(finalState).pause()` instead of `play()` / `reverse()`, snapping them instantly to the correct endpoint. `isJumping = false` in `onComplete` so normal wheel scroll resumes correctly.
- **Side nav `jumpTo` must close over local `postScroll`** — `postScroll` is a local variable inside `fonts.ready` used by the wheel handler. `scrollState.jumpTo` is defined inside `fonts.ready` specifically to update both `postScroll` (local) and `scrollState.postScroll` (shared). If the nav jumped by only updating `scrollState.postScroll`, the next wheel event would resume from the old local value, causing a position snap.
- **Side nav item sizing via `transform: scale`** — active item is `scale(1.5)`, inactive `scale(0.72)`. Using `transform` instead of `font-size` keeps each item in a fixed 32×32px layout box, so the flex column spacing never shifts when active state changes.
- **`inject-contact-footer.js` is self-contained — no fetch** — all HTML and CSS are a template literal inside the IIFE. `insertAdjacentHTML` is synchronous so `#section-seven` is in the DOM before the next line runs. `contactFooterReady` fires immediately after. No server root requirement, no MIME mismatch risk, no fetch timing race.
- **`sectionSeven` / `s7SwapTl` / `s7EntryTl` as `let` in outer closure** — `initS7()` inside `fonts.ready` assigns all three. The `onUpdate` s7 block is guarded by `if (sectionSeven && s7SwapTl && s7EntryTl)` so it is safe even if `contactFooterReady` fires after `fonts.ready` (can't happen with synchronous injection, but the guard costs nothing).
- **Footer reveal never reverses — split timelines** — the ft-left slide and content reveals (`s7EntryTl`) reset to `progress(0)` on scroll-back rather than reversing. Only the page-swap (`s7SwapTl`) reverses. This means the footer animates fresh on every re-entry while the section transition still feels smooth in both directions.
