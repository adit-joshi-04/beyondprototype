# Roots — Project Context

Beyond Concrete project. Single-page prototype, scroll-driven. Three.js r0.169.0 (ESM importmap) + GSAP 3.12.5 (CDN script tags).

---

## File Map

```
roots/
├── index.html                              — markup, CSS, importmap
├── site.js                                 — Three.js + hero layout + GSAP
├── context.md                              — this file
├── modern_luxury_villa_house_building/     — GLTF model (kept for reference, not used)
│   └── scene.gltf
└── tuscan_villa_-_italian_villa/           — unused heavy model, keep for reference
```

---

## Tech Stack

- **Three.js r0.169.0** via ESM importmap (`three` + `three/addons/`)
- **GSAP 3.12.5** via CDN `<script>` tags (loaded before the module script so `gsap` is a global available inside `site.js`)
- No bundler, no build step — served with `npx serve .` on port 3000
- Google Fonts: Georgia (serif fallback used directly), Inter 400/600

---

## Architecture

### Canvas
- Renderer appended to `document.body` as first child via JS, gets `id="three-canvas"`
- `position: fixed`, `z-index: 0`, `pointer-events: none`
- `alpha: true` — page background (`#d2d2d2`) shows through

### HTML Sections
- `.section` sits above canvas at `z-index: 1`, `pointer-events: none`
- Header is `position: fixed`, `z-index: 100`

### Hero Text Layout — Key Architecture
Every text element is individually `position: absolute` inside `#hero`. **No `text-align` is ever used** — toggling it causes an instant snap. Instead:

1. All text elements start `opacity: 0` in CSS
2. `document.fonts.ready` fires → JS measures each element's `offsetWidth`
3. Each element's `left` is set to `viewport - MARGIN - el.offsetWidth` → flush right (each right edge at `viewport - 45px`)
4. Elements are revealed (`opacity: 1`)
5. GSAP heroTl animates each element's `left` to `45px` — **each line travels a different distance** because each has a different width

This is the same pattern as `reference-only.js` but mirrored: reference goes left→right, Roots goes right→left.

### Vertical Layout
```
TOP     (TITLE_TOP = 115px)
        hd-1  "A Sustainable Villa Community"
        hd-2  "Expanding the landscape of modern living"

BOTTOM  (DESC_BOTTOM = 52px from bottom)
        subtitle  "Mansanpally, 2027"
        hw-1      ROOTS  ← big heading
```

### Hero Elements
| ID | Content | Type |
|---|---|---|
| `#hw-1` | ROOTS | `.title-word` — Georgia, clamp(90px, 8.5vw, 200px), line-height 0.88 |
| `#hw-2` | (space) | `.title-word` — reserved |
| `#hero-subtitle` | Mansanpally, 2027 | Georgia 16px |
| `#hd-1` | A Sustainable Villa Community | `.hero-desc-line` — Inter 16px |
| `#hd-2` | Expanding the landscape… | `.hero-desc-line` — Inter 16px, bold |
| `#hero-line` | vertical 1px line | starts at 10% from left, exits off left edge on scroll |

---

## Three.js

### Model (Placeholder)
No GLTF loaded. Procedural placeholder built from two meshes in a `THREE.Group`:

| Part | Geometry | Material | Notes |
|---|---|---|---|
| Body | `BoxGeometry(0.9, 0.42, 0.7)` | `#b2b2b2` MeshStandard | bottom flush at local y=0, centred x/z |
| Roof | `ConeGeometry(0.78, 0.42, 4)` | `#888888` MeshStandard | 4-sided pyramid, `rotation.y = π/4` to align edges with body, currently `visible = false` |

- Auto-centred and scaled: `scale = 25 / maxDim` (maxDim is the height of the body, ~0.42)
- After scaling, model is ~25 units tall, ~53 units wide (body width after scale)
- `model.position.sub(centre.multiplyScalar(scale))` centres bbox at world origin

### Copies
- 4 clones placed to the **left** (scroll direction), 2 clones to the right
- Spacing = `size.x * scale + 20` (scaled model width + 20 unit gap)
- `model.clone()` — clones the group including all children and their local positions/rotations

### Camera — Initial (hero state)
```js
camera.position.set(11.15, 2.33, -16.31);
cameraTarget = { x: -7.08, y: -2.49, z: 1.24 }
```
Front-left 3/4 view from slightly below eye level.

### Camera — Scroll-1 end
```js
camera.position → { x: -10.22, y: 1.70,  z: -16.65 }
cameraTarget   → { x:   1.80, y: -0.72,  z:  -6.02 }
```
Camera pans left and slightly around the building.

### Camera — Scroll-2 phase 1 end (front of building)
```js
camera.position → { x: -3.00,  y: 2.66,  z: -34.25 }
cameraTarget   → { x: -10.92, y: -4.22,  z:  92.18 }
```

### Camera — Scroll-2 phase 2 end (far left, after drifting across copies)
```js
camera.position → { x: -83, y: 2.66, z: -34.25 }
cameraTarget   → { x: -91, y: -4.22, z:  92.18 }
```

### cameraTarget pattern
`camera.lookAt()` is called every frame with a plain object `cameraTarget`. GSAP tweens this object directly — allows smooth animated look-at without MatrixWorld conflicts.

### Lighting
| Light | Type | Position | Intensity | Notes |
|---|---|---|---|---|
| ambient | AmbientLight | — | 0.8 | Base fill |
| sun | DirectionalLight | (10, 40, -60) | 2.2 | Key light — from camera's -z side, illuminates visible faces. Warm (0xfff5e0). Casts shadows. |
| fill | DirectionalLight | (-40, 20, -30) | 0.6 | Softens shadow on secondary faces |

---

## Scroll / Animation

- `body { overflow: hidden }` — wheel events drive all transitions, no native scroll
- Multi-phase scroll system

### Phase 1 — heroTl (play/reverse triggered)
- `heroTl` — GSAP timeline (paused), played/reversed on wheel
- All tweens fire at position `0`, duration 1.4s, ease `power2.inOut`
- Contents:
  1. Each text element: `left` → `MARGIN (45px)`
  2. `#hero-line`: `left` → `-2px` (exits off left edge)
  3. `camera.position`: tweens to scroll-1 end
  4. `cameraTarget`: tweens to scroll-1 end lookAt

### Phase 2 — postHeroTl (progress-driven / scrubbed)
- Fires once `heroTl.progress() === 1`
- Accumulates raw wheel `deltaY` into `postScroll` (clamped 0–`POST_TOTAL = 7800`)
- `gsap.to(postHeroTl, { progress: postScroll / POST_TOTAL, duration: 0.6, ease: 'power2.out', overwrite: 'auto' })`
- All sub-tweens use `ease: 'none'` — easing lives in the progress tween only
- Timeline layout (total duration = 19.5, 400 deltaY per unit):

| t range | What happens |
|---|---|
| 0 → 1 | Camera pans to front of building |
| 1 → 6 | Camera drifts left (x: -3 → -83), s2 strip scrolls |
| 6 → 7.5 | Canvas + section-two exit upward |
| 7.5 → 9.0 | Pad (s4 trigger window) |
| 11.0 → 12.5 | Section-four items fly right, s4 line exits |
| 12.1 → 15.1 | Section-five grey box scales up from centre |
| 12.25 → 12.85 | Section-five text fades in |
| 13.4 → 14.4 | Section-five 3D title flip (rotateX) |
| 15.1 → 17.5 | Pad (s6 dwell) |
| 17.5 → 19.5 | Pad (footer dwell) |

### Trigger thresholds (postHeroTl onUpdate)
| Section | Trigger t | Entry animation |
|---|---|---|
| Section Three | 6.5 | s3Left slides from left, s3Right from right |
| Section Four | 8.5 | s3Right morphs to center strip, accordion slides in |
| Section Six | 15.5 | Slides up from below |
| Section Seven | 17.0 | s6 exits up, s7 rises, CSS `--fw` wipe starts |

### Reverse handoff (postHeroTl → heroTl)
Tricky — calling `heroTl.reverse()` while a postHeroTl progress tween is still in-flight causes a camera snap. Fix:
- When `postScroll <= 0 && postHeroTl.progress() > 0`: start a one-shot tween to `progress(0)`, gated by `gsap.isTweening(postHeroTl)` so it isn't killed and restarted on every wheel event
- Only call `heroTl.reverse()` once `postHeroTl.progress() === 0` (camera is exactly at scroll-1 end)
- **Do NOT use `fromTo` in postHeroTl for camera tweens** — FROM values are applied at timeline creation time, overriding the initial camera setup and breaking heroTl's animation

### layoutHero()
Called on `fonts.ready` and on `resize`. Kills and rebuilds `heroTl` each time (so positions stay correct after resize).

---

## Section Two — Horizontal Scroll Strip

Fades in during postHeroTl phase 1 (t=0.5→1.5). Content scrolls LEFT as camera pans left.

### Layout
- `#section-two`: `position: fixed`, full viewport, `opacity: 0` initially, `z-index: 1`
- `#s2-content`: clip window at **bottom** — `left: 45px`, `right: 45px`, `bottom: 52px`, `height: calc(100vh - 167px)`, `overflow: hidden`
- `#s2-inner`: `display: flex; flex-direction: row` — wide horizontal strip, GSAP translates LEFT
- `.s2-item`: `width: calc(100vw - 90px)`, one slot per item, `justify-content: flex-start` (text anchors top), `padding-left: calc(55vw - 45px)` (text in right ~40% of viewport), `padding-top: 32px`
- `.s2-tether-line`: 1px **vertical** line inside each `.s2-item` after `.s2-body` — `height: 120px`, `margin-top: 20px`, `scaleY: 0→1`, `transform-origin: top center`. Lines move with `s2Inner` automatically.

### Content (4 items)
| # | Heading | When revealed |
|---|---|---|
| 1 | Proximity Privilege | t=0.80 |
| 2 | Future-Proof Design | t=2.00 |
| 3 | Community Temple | t=4.00 |
| 4 | Goushala | t=5.20 |

### GSAP x tween
```js
.to(s2Inner, { x: () => -(window.innerWidth - 90) * 3, duration: 5, ease: 'none' }, 1)
```

---

## Section Three — Split Panel

- `#section-three`: `position: fixed`, `z-index: 2`, `visibility: hidden` until triggered
- `#s3-left` (white, 50%): heading, stats grid, accordion, footer blurb — slides in from left
- `#s3-right` (grey `#d2d2d2`, 50%): image placeholder — slides in from right; tinted on accordion hover
- Accordion hover: 3 items, each shifts `s3Right.style.background` to a different grey tint

---

## Section Four — Full-screen Accordion

- `#section-four`: `position: fixed`, `z-index: 3`, `visibility: hidden` until triggered
- Entry: `s3Right` (grey box) morphs from right panel → center strip (`left: 28%, right: 28%`), then fades out once accordion item 0 is in place
- 4 `.s4-item` rows; collapsed height = 64px; expanded = `window.innerHeight - 116 - 64 * 3`
- Hover opens item via GSAP height tween; `overflow: hidden` clips the body content
- Each item has: label (left), grey box (centre, `left: 28%, right: 28%`), desc + stats (right, `left: 74%`)

---

## Section Five — Sustainability

- `#section-five`: `position: fixed`, `z-index: 5`
- `#s5-box`: fills viewport, `background: #d2d2d2`, scales from `scale: 0` at centre
- Two title lines do a 3D flip (`rotateX ±85°`) as the box fills

---

## Section Six — Locality Map

- `#section-six`: `position: fixed`, `z-index: 6`, `visibility: hidden` until triggered
- `#s6-map`: Three.js WebGL canvas — procedural top-down city block map
- Map camera parallax: mouse position within canvas nudges camera, lerped each frame
- `initS6Map()` called from inside `fonts.ready`; returns a `renderMap()` function called in the main animate loop

---

## Section Seven — Contact + Footer

- `#section-seven`: `position: fixed`, `z-index: 7`, `visibility: hidden` until triggered
- Top half: contact form
- Bottom half (`#s7-footer`): two stacked layers — `ft-base` (light) and `ft-dark` (black panel)
- Black panel wipe: CSS `@property --fw` custom property transitions from `0px` → `calc(100vw - 392.5px)` when `.is-in` is added; `clip-path: inset(0 calc(100vw - var(--fw)) 0 0)` grows the panel left→right

---

## Constants
```js
MARGIN      = 45    // px — left/right page margin
TITLE_TOP   = 115   // px — top of desc lines
DESC_BOTTOM = 52    // px — bottom clearance for heading block
POST_TOTAL  = 7800  // wheel deltaY units to traverse full postHeroTl (19.5 units × 400)
```

---

## Orbit Controls (camera positioning mode)
To re-enable for finding new camera coordinates:
1. Add `import { OrbitControls } from 'three/addons/controls/OrbitControls.js'`
2. After renderer setup, add controls + L-key logger (see git history)
3. Comment out `pointer-events: none` on `#three-canvas` in index.html
4. Keep `pointer-events: none` on `.section` — that's what was blocking orbit before
5. Comment out the wheel event listener inside `fonts.ready` (it fights OrbitControls zoom)
6. Press **L** to log `camera.position` + `controls.target` to console
7. Undo all of the above when done

## Gotchas
- GSAP must be loaded via `<script>` tag before the `<script type="module">` — module scripts are deferred, GSAP needs to be a global when `site.js` runs
- `pointer-events: none` on `.section` is required even in orbit mode — `.section` sits at z-index: 1 above the canvas and blocks all mouse events if pointer-events is enabled
- `layoutHero()` must run inside `document.fonts.ready` — offsetWidth is wrong before fonts load, causing incorrect flush-right positioning
- `heroTl` is rebuilt on resize to recalculate start positions; the `.kill()` prevents ghost tweens from the previous build
- **Do not use `fromTo` in `postHeroTl` for camera tweens** — FROM values are applied at timeline creation time, overriding the initial camera setup and breaking heroTl's animation
- `gsap.isTweening(target)` checks for active tweens targeting a GSAP object — used to gate the return-to-hero tween so it runs once to completion rather than being restarted on every wheel event
- Section entry timelines (s3, s4, s6, s7) are **not scrubbed** — they play/reverse as one-shots triggered by threshold crossings in postHeroTl's `onUpdate` callback
- `s3Right` is repurposed in s4EntryTl: taken out of flex flow with `position: fixed`, morphed to the center strip position, then faded out once the accordion item 0 grey box takes over. On reverse, `clearProps` restores it to its original flex-child state.
