# Beyond Concrete — Flow 1 Prototype Structure

Single-page scroll experience. Vanilla HTML / CSS / JS. Georgia (system font) site-wide. Three.js (r128 CDN) for the 3D hero section.

---

## Files

| File | Purpose |
|---|---|
| `index.html` | All sections and DOM structure |
| `style.css` | Layout and component styles |
| `script.js` | Scroll phase logic, all JS-driven animation |
| `hero3d.js` | Three.js scene — house geometry, explode animation, spin mechanic, roof-to-header fly, raycaster |
| `STRUCTURE.md` | This file |

### Assets

| File | Used in |
|---|---|
| `beyond.png` | Fixed logo, top-left header |

---

## DOM / Z-index Layering

**Critical architecture change from original**: `#hero-canvas` was moved out of `.hero-sticky` to body level as `position: fixed`. This allows the 3D scene to persist visually across both the hero and about sections.

```
z-index 100  #site-header          (fixed, top-left)
z-index  10  (reserved for future overlays)
z-index   2  .hero-sticky          (sticky within hero-sequence)
z-index   2  #about-section        (relative, content above canvas)
z-index   1  #hero-canvas          (fixed fullscreen, always behind content)
```

`.hero-sticky` has `pointer-events: none` so clicks pass through to the fixed canvas beneath. `.wall-overlay.visible` overrides this with `pointer-events: all`.

`#wall-overlays` lives inside `.hero-sticky` (not fixed). When hero-sticky unsticks at the end of the hero sequence, overlays scroll away naturally — but they are already faded to opacity 0 before that happens via `heroExitProgress`.

---

## Section Map

---

### HEADER — `#site-header`

- `position: fixed`, top-left `20px / 20px`, `z-index: 100`
- Flex row: logo image + mini-house canvas side by side, `gap: 12px`, `align-items: center`
- `#bc-logo-img` — `beyond.png`, `height: 40px`
- `#header-canvas` — 54×54px Three.js canvas, transparent background, `opacity: 0` initially
  - Fades in (CSS `transition: opacity 0.35s ease`) when the roof fly animation completes
  - Rendered by a second `WebGLRenderer` inside `hero3d.js` (see Header Mini-House below)

---

### HERO — `.hero-sequence`

Total height: **`2200vh`**. A sticky scene (`height: 100vh`) pins to the top.

**Key formula change**: animations complete after a fixed `1300vh` of scroll (not proportional to total section height). The remaining `800vh` is a hold phase — house stays exploded, user can rotate the cube, label stays fully visible.

```
scrolled = scrollY - seqTop

animPx = 13 × vh    // 1300vh — animations run here
holdPx =  8 × vh    //  800vh — hold phase, label visible, user rotates

raw     = clamp(scrolled / animPx, 0, 1)
exitP   = clamp((scrolled - animPx - holdPx×0.5) / (holdPx×0.5), 0, 1)
          // 0 through all animations + first 400vh of hold
          // ramps 0→1 in final 400vh of hold (label fades here)
```

---

#### Phase timeline

| scroll distance | raw progress | Event |
|---|---|---|
| 0 – 78vh | 0.00 – 0.06 | 3D house sits assembled at far camera distance |
| 78 – 234vh | 0.06 – 0.18 | Tagline fades in |
| 234 – 364vh | 0.18 – 0.28 | Tagline holds |
| 364 – 455vh | 0.28 – 0.35 | Tagline fades out |
| 455 – 1105vh | 0.35 – 0.85 | Body text scrolls up through viewport |
| 1105 – 1300vh | 0.85 – 1.00 | Walls explode + camera dollies in simultaneously |
| 1209 – 1300vh | 0.93 – 1.00 | Roof detaches and flies toward header canvas |
| 1300 – 1700vh | (raw = 1, hold) | House fully exploded, label visible, user rotates cube |
| 1700 – 2100vh | (exitP 0→1) | Label fades out, hero-sticky still pinned |
| 2100vh+ | — | hero-sticky unsticks, about-section begins |

---

#### Three.js scene (`hero3d.js`)

**Renderer**
- `WebGLRenderer`, antialiased, clear colour `#ffffff`
- Sized to full viewport, `pixelRatio` capped at 2
- Canvas `#hero-canvas` is `position: fixed; inset: 0; z-index: 1`

**Camera**
- `PerspectiveCamera`, 45° FOV
- `CAM_FAR` — `(4.5, 4.5, 7.0)` — starting position, held until explosion
- `CAM_NEAR` — `(2.2, 2.2, 2.8)` — arrived at during explosion
- `lookAt(0, 0.2, 0)` maintained every frame
- `setHeroCameraZoom(p)` lerps between `CAM_FAR` and `CAM_NEAR` at lerp factor `0.06`

**Lighting**
- `AmbientLight` `#ffffff` intensity `0.65`
- `DirectionalLight` from `(2, 4, 3)` intensity `0.7` — key/sun
- `DirectionalLight` from `(-3, 1, -2)` intensity `0.2` — fill

**House group (`house`)**

All house parts are children of a `THREE.Group`. Rotation state:

- *Idle* (before explosion): gentle `sin`-based oscillation `±0.18 rad`. Fades out via `idleWeight = max(0, 1 − explodeProgress × 8)`.
- *Spin mechanic*: `houseSpinY` lerps toward `targetHouseY` at factor `0.05` per frame. Shortest-path normalization keeps the delta in `[−π, π]` so the house never spins the long way round.
- `house.rotation.y = houseSpinY + sin(idleClock) × 0.18 × idleWeight`

`EXPLODE_DIST = 0.2` — how far each wall travels from home position.

*Walls — 4 × `PlaneGeometry(1, 1)`, `MeshStandardMaterial`, `DoubleSide`:*

| ID | Home position | Explode direction | House Y to bring to right-face |
|---|---|---|---|
| `front` | `(0, 0, 0.5)` | `+Z` | `+π/2` |
| `back` | `(0, 0, −0.5)` | `−Z` | `−π/2` |
| `left` | `(−0.5, 0, 0)` | `−X` | `π` |
| `right` | `(0.5, 0, 0)` | `+X` | `0` |

- Wall colour `#d0d0cc`, hover colour `#bcbcb8` (tinted via raycaster)
- Each wall has its own cloned material so hover states are independent
- All wall materials have `transparent: true, opacity: 1` — needed so opacity can be animated in future about-section transition
- `setHeroExplode(p)` → each wall translates: `homePos + dir × p × EXPLODE_DIST`

*Roof — `ConeGeometry(0.76, 0.5, 4)`:*
- 4 radial segments = pyramid / hipped roof shape
- Position `(0, 0.75, 0)` at rest, rotated `45°` on Y to align edges to walls
- On explode: `y = 0.75 + p × 0.4`
- `transparent: true` so opacity can be animated during roof fly
- Colour `#b8b8b4`

**Active face / spin mechanic**

One wall is always the "active" face — the one currently rotated into the right-facing position (+X direction toward camera). Starts as `right`.

- Clicking any wall dispatches a `wall-click` CustomEvent `{ id }`
- Both `hero3d.js` (spin) and `script.js` (navigation hook) listen
- `hero3d.js` sets `targetHouseY` from `wallToHouseY[id]` and updates `activeWallId`
- The spin uses shortest-path angle lerp to avoid spinning the wrong way

**Roof fly**

At `raw 0.93`, the roof detaches and flies toward the header canvas:

1. On first fly frame, `computeRoofFlyTarget()` fires: it reads the header canvas centre via `getBoundingClientRect()`, converts to NDC, unprojects a ray through the camera, and places the 3D target at the same depth as the roof's exploded position — so the target is pixel-exact regardless of viewport size.
2. Roof position lerps from exploded pos → target, scale shrinks `1 → 0.3`, opacity fades `1 → 0`.
3. Header canvas fades in once `roofFlyProgress > 0.4`.
4. `roofFlyWorldTarget` is cleared on resize so it recomputes if the layout shifts.

**Header Mini-House**

A second `WebGLRenderer` (54×54, `alpha: true`) renders an independent assembled house into `#header-canvas`:
- Same wall geometry, same colours as the main scene
- Same three-point lighting setup
- `headerCamera` at `(1.5, 1.5, 2.4)`, aspect `1:1`, 45° FOV
- Gentle continuous idle rotation: `sin`-based `±0.18 rad`
- Only renders when `hOpacity > 0.01` to avoid wasting GPU when invisible

**Raycaster (interactivity)**
- `mousemove` → updates `mouse` NDC coords every frame
- Active only when `explodeProgress > 0.4`
- Hover: tints hovered wall to `COLOR_HOVER (#bcbcb8)`, resets others, sets `cursor: pointer`
- Click: dispatches `wall-click` CustomEvent with `{ id }`

**HTML wall overlays (`#wall-overlays`)**
- 4 `.wall-overlay` divs (`position: absolute`, `transform: translate(-50%, -50%)`) inside `.hero-sticky`
- Only the **active** wall's overlay is shown, all others are `opacity: 0`
- Visible only once `explodeProgress > 0.55`
- Position: active wall's world centre projected to screen coords, then offset by `LABEL_ANCHOR = (0.6, 0.1, −0.58)`
- Opacity multiplied by `max(0, 1 − heroExitProgress × 2)` — fully visible through hold phase, fades in final 400vh before hero-sticky unsticks. **Do not use roofFlyProgress for this fade.**
- CSS `transition: opacity 0.2s ease` handles the fade

**Hero exit progress (`heroExitProgress`)**
- New state added in this session
- Driven by `setHeroExit(p)` called from `script.js`
- Lerp factor `0.05` (slightly slower than other lerps for smooth label fade)
- Only non-zero in the final 400vh of the hero hold phase
- Currently only used for overlay fade; available for any other end-of-hero cleanup

---

#### Tagline (`#hero-tagline`)

Three `<span>` elements positioned absolutely around the house centre:

| Element | Text | Position |
|---|---|---|
| `#tagline-left` | TOWARDS | `left: 35%`, vertically centred |
| `#tagline-right` | THOUGHT-LED | `right: 33%`, vertically centred |
| `#tagline-bottom` | DEVELOPMENT | `left: 50%`, `top: 67%`, centred |

- Font: 13px Georgia, uppercase, `letter-spacing: 0.14em`
- Opacity driven by `raw` progress (see phase table above)

---

#### Body text scroll (`#hero-text-scroll`)

A single text block containing the full narrative, driven by `translateY` only — no opacity change, purely positional.

**Content (in order):**
1. You build a home.
2. That home belongs to / a neighbourhood, / a city, / a country.
3. So where does a home really end?
4. Perhaps it doesn't.
5. Because the air beyond your window is part of your home. / The soil beneath. / The trees outside. / Are all a part of your home.
6. And that is why, to us, building a home means looking beyond the walls.
7. Beyond concrete.

**Motion:**
- `raw 0.35` → `translateY(+100vh)` (fully below viewport)
- `raw 0.85` → `translateY(−160vh)` (fully above viewport)
- Formula: `ty = 100 − textP × 260` where `textP` is progress within the text phase
- `width: 440px`, centred, `font-size: 16px`, `line-height: 1.7`, `margin-bottom: 32px` between paragraphs

---

## Wall Overlay Component

Each `.wall-overlay` has two content zones and a marker:

```
● ┌─────────────────────┐
  │ LABEL               │  ← .overlay-label (uppercase, 24px, white, bg #878585)
  ├─────────────────────┤
  │ Body text           │  ← .overlay-body (12px, bg #dcdcdc, dark text)
  └─────────────────────┘
```

- `●` — the circle marker, rendered via `.wall-overlay::before`, `position: absolute; right: calc(100% + 10px)`, vertically centred, `8×8px`, `border-radius: 50%`, colour `#878585`
- `.overlay-label` — `display: block`, left-aligned
- `.overlay-body` — bleeds edge-to-edge via negative margins (`−12px` left/right), own background and padding

**Content per wall:**

| Wall | Label | Body |
|---|---|---|
| front | Architecture | The way a building understands orientation, proportion, views, and ventilation. |
| right | Engineering | The things you don't notice because they've been engineered so well. |
| left | Biodiversity | An environment where nature and people thrive together. |
| back | Sustainability | Systems designed to use less, conserve more and give back where they can. |

---

### ABOUT — `#about-section`

- Height: `600vh`, `position: relative; z-index: 2`
- Inner `.about-sticky` — `position: sticky; top: 0; height: 100vh; pointer-events: none`

**Scroll wiring** (`script.js` `updateAbout()`):
- Reads scroll progress 0→1 through the about-section
- Calls `window.setWallExpand(raw)` — drives `wallExpandProgress` in `hero3d.js`

**Raycaster** disabled once `wallExpandProgress > 0.05` — wall hover/click turns off as about section begins.

---

#### Camera animation phases (`wallExpandProgress`)

All phases operate on the same fixed `#hero-canvas` — no separate renderer.

| Range | Phase | What happens |
|---|---|---|
| `0.00 → 0.30` | Face wall | Camera swings from `CAM_NEAR` → `CAM_ABOUT` directly in front of the right wall on the +X axis. `lookAt` lerps from `(0, 0.2, 0)` → `(0.7, 0, 0)` (wall centre). `camera.up` stays `(0,1,0)`. |
| `0.30 → 0.60` | Skew | Camera moves to `CAM_SKEW` — close to the wall, offset in −Z (screen-right), slightly above centre. `camera.up` lerps toward `CAM_SKEW_UP` (roll tilt). FOV lerps `45° → 28°` (optical zoom). |
| `0.60 → 0.65` | Hold | All values frozen at phase 2 end. |
| `0.65 → 0.85` | Pan | Camera drifts from `CAM_SKEW` → `CAM_PAN` (closer to the +Z corner it was facing). `lookAt` pans to opposite corner. `camera.up` lerps to `CAM_PAN_UP`. FOV stays `28°`. |
| `0.85 → 1.00` | (free) | Reserved for next steps. |

---

#### Phase 2 + 3 text — `aboutTextMesh` (`hero3d.js`)

"WE DON'T CUT CORNERS." typed out character-by-character as the phase 2 camera sweeps from head-on to the skewed perspective view.

**Implementation:**
- Offscreen `<canvas>` `128 × 1024` px, `THREE.CanvasTexture`
- `MeshBasicMaterial` (no lighting), `transparent: true`, `depthTest: false`, `depthWrite: false`, `renderOrder: 1`
  - `depthTest: false` + `renderOrder: 1` prevents the wall (transparent, rendered in back-to-front sort) from painting over the text when the camera distance ordering flips during the phase transition
- Geometry: `PlaneGeometry(0.12, 1.0)` — 0.12 units wide (character height dimension), 1.0 tall (text flow direction, matching wall height)
- `rotation.y = +π/2` — front face faces +X toward camera. Using `−π/2` (same as wall meshes) shows the back face, which mirrors the UV horizontally and flips the text
- World position `(0.715, 0.1, 0.42)` — slightly in front of right wall (x=0.7), slight Y lift, near the +Z corner edge of the wall

Both texts share the same `aboutTexCanvas` (`128 × 1024`), `aboutTexture`, `aboutTextMat`, and `aboutTextMesh`. Canvas is cleared and both texts are redrawn together whenever either character count changes.

**Phase 2 — bottom-to-top text (`drawAboutText`):**
- `ctx.translate(64, 512)` → `ctx.rotate(−π/2)` → `fillText(partialText, 0, 0)`
- `rotate(−π/2)` makes the text flow direction (+X in rotated space) map to canvas −Y (upward). With THREE.js `flipY=true`, upward canvas → higher V → higher world Y, giving text that reads bottom-to-top on the 3D plane
- Font: `bold 50px Georgia, "Times New Roman", serif`, fill `#1a1a1a`

**Phase 3 — top-edge text (`drawAboutText`):**
- No rotation — text drawn horizontally at canvas top (`ctx.translate(64, 8)`, `textBaseline: 'top'`)
- Runs left-to-right in canvas X = world −Z direction = along the 0.12-unit narrow top edge of the plane
- Font: `bold 11px Georgia`. Scale factor `116 / fullWidth` applied in X so all chars fit in 116px; scale is computed from full-string width so the anchor stays fixed as characters type on
- Material is already at `opacity 1` (from Phase 2 fade-in), so no separate fade — text simply types onto the visible plane

**Timing:**
- Material opacity fades `0 → 1` over `wallExpandProgress 0.28 → 0.32` (just before phase 2 starts; stays 1 thereafter)
- Phase 2 characters revealed: `count = Math.ceil(phase2P × 22)` where `phase2P = (wallExpandProgress − 0.30) / 0.30`
- All 22 phase-2 characters visible by `wallExpandProgress = 0.60`; stays visible through phase 3
- Phase 3 characters revealed: `count = Math.ceil(phase3P × 29)` where `phase3P = (wallExpandProgress − 0.65) / 0.20`
- All 29 phase-3 characters visible by `wallExpandProgress = 0.85`

**Key values to tweak:**

| What | Value |
|---|---|
| Phase 2 text string | `"WE DON'T CUT CORNERS."` |
| Phase 3 text string | `"WE LET LIGHT COME INTO THEM."` |
| World position | `(0.715, 0.1, 0.0)` — x in front of wall, z centred on wall face |
| Plane size | `PlaneGeometry(1.0, 1.0)` — full wall face |
| Canvas size | `1024 × 1024` |
| Phase 2 canvas X | `82` → maps to world Z ≈ 0.42 (+Z corner) |
| Phase 2 font | `bold 50px Georgia` |
| Phase 3 font | `bold 50px Georgia` (same size as phase 2) |
| Phase 3 canvas position | `(512, 8)` — centred on 1024px canvas, top = world +Y top edge |
| Opacity fade range | `wallExpandProgress 0.28 → 0.32` |
| Phase 2 typewriter range | `wallExpandProgress 0.30 → 0.60` |
| Phase 3 typewriter range | `wallExpandProgress 0.65 → 0.85` |

**Key 3D constants (`hero3d.js`)**

| Constant | Value | Purpose |
|---|---|---|
| `CAM_ABOUT` | `(3.5, 0, 0)` | Phase 1 camera position |
| `CAM_ABOUT_LOOK` | `(0.7, 0, 0)` | Phase 1 lookAt |
| `CAM_SKEW` | `(1.8, 0.05, −0.6)` | Phase 2 camera position |
| `CAM_SKEW_LOOK` | `(0.9, 0.2, 0.1)` | Phase 2 lookAt |
| `CAM_SKEW_UP` | `(0, 1, 1.5).normalize()` | Phase 2 camera roll (up vector) |
| `CAM_PAN` | `(1.5, 0.1, −0.2)` | Phase 3 camera position |
| `CAM_PAN_LOOK` | `(−1.2, 1.4, −0.001)` | Phase 3 lookAt |
| `CAM_PAN_UP` | `(0.2, 1.8, −0.8).normalize()` | Phase 3 camera roll |

---

## JS Architecture

Single scroll listener calling all update functions:

```
scroll →
  updateHero()
    → tagSpan opacities              // tagline fade in/out
    → heroTextScroll translateY      // body text rides up
    → setHeroCameraApproach(p)       // lerps CAM_START → CAM_FAR over pre-explosion scroll
    → setHeroExplode(explodeP)       // moves walls + roof outward
    → setHeroCameraZoom(explodeP)    // lerps CAM_FAR → CAM_NEAR
    → setRoofFly(flyP)               // triggers roof departure at raw 0.93
    → setHeroExit(exitP)             // fades overlays in final 400vh of hold

  updateAbout()
    → setWallExpand(raw)             // drives wallExpandProgress (about camera phases)
```

`hero3d.js` runs its own `requestAnimationFrame` loop independently:
```
rAF →
  lerp explodeProgress    → targetExplode
  lerp cameraProgress     → targetCamera
  lerp approachProgress   → targetApproach
  lerp roofFlyProgress    → targetRoofFly
  lerp heroExitProgress   → targetHeroExit
  lerp wallExpandProgress → targetWallExpand
  _approachBase = lerp(CAM_START, CAM_FAR, approachProgress)
  camera.position = lerp(_approachBase, CAM_NEAR, cameraProgress)
  about phases: position / lookAt / camera.up / FOV driven by wallExpandProgress
  camera.updateProjectionMatrix()   // called every frame (FOV may change)
  camera.lookAt(_lookTarget)
  shortest-path lerp houseSpinY → targetHouseY
  idle rotation (eases off as explosion starts, layered on spin)
  wall positions updated (explosion offset)
  roof position + scale + opacity updated (explosion + fly phases)
  overlay screen projections updated (active wall only, fades with heroExitProgress)
  about text opacity + drawAboutText()     // typewriter reveal during phase 2
  raycaster hover check (explodeProgress > 0.4 && wallExpandProgress < 0.05)
  renderer.render(scene, camera)           // main scene
  headerCanvas.style.opacity updated
  headerHouse idle rotation
  headerRenderer.render(headerScene, headerCamera)  // header mini-house
```

---

## Quick-reference: Key values to tweak

| What | Where | Value |
|---|---|---|
| Camera initial position | `hero3d.js` `CAM_START` | `(8.0, 8.0, 13.0)` |
| Camera pre-explosion position | `hero3d.js` `CAM_FAR` | `(4.5, 4.5, 7.0)` |
| Camera post-explosion position | `hero3d.js` `CAM_NEAR` | `(2.2, 2.2, 2.8)` |
| Wall explosion distance | `hero3d.js` `EXPLODE_DIST` | `0.2` |
| Explosion scroll start | `script.js` `P_EXPLODE` | `0.85` |
| Roof fly scroll start | `script.js` `P_FLY_START` | `0.93` |
| Label anchor offset | `hero3d.js` `LABEL_ANCHOR` | `(0.6, 0.1, −0.58)` |
| Header canvas size | `style.css` + `hero3d.js` | `54×54px` |
| Header camera position | `hero3d.js` `headerCamera` | `(1.5, 1.5, 2.4)` |
| Spin lerp speed | `hero3d.js` animate loop | `0.05` |
| Hero anim scroll length | `script.js` `animPx` | `13 × vh` (1300vh) |
| Hero hold scroll length | `script.js` `holdPx` | `8 × vh` (800vh) |
| Label fade start | `script.js` exitP formula | after `animPx + holdPx × 0.5` |
| About text position | `hero3d.js` `aboutTextMesh` | `(0.715, 0.1, 0.42)` |
| About text plane size | `hero3d.js` `PlaneGeometry` | `0.12 × 1.0` |
| About text font | `hero3d.js` `drawAboutText` | `bold 50px Georgia` |
| About phase 2 typewriter range | `hero3d.js` `drawAboutText` | `wallExpandProgress 0.30 → 0.60` |
| About phase 3 typewriter range | `hero3d.js` `drawAboutText` | `wallExpandProgress 0.65 → 0.85` |

---

## Status

| Section | Status |
|---|---|
| Hero — 3D house | Complete |
| Hero — tagline | Complete |
| Hero — body text scroll | Complete |
| Hero — wall explosion + camera zoom | Complete |
| Hero — active face spin mechanic | Complete |
| Hero — wall overlays (label + body + marker) | Complete |
| Hero — roof fly to header | Complete |
| Hero — hold phase (overlay visible, rotate cube) | Complete |
| Hero — label fade out before unstick | Complete |
| Header — logo + mini-house canvas | Complete |
| About — scroll wiring | Complete |
| About — camera animation phases 1–3 | Complete |
| About — phase 2 text ("WE DON'T CUT CORNERS.") | Complete |
| About — phase 3 text ("WE LET LIGHT COME INTO THEM.") | Complete |
| All sections below about | Not yet built |

---

## MERGE — Option 2, full flow (scrolls 1–7 + footer)

### Files

| File | Purpose |
|---|---|
| `index.html` | Full page: hero + about (scrolls 1–4), scroll 5–7, contact, footer |
| `hero.css` | First-half styles (was `style.css`) |
| `hero3d.js` | Three.js scene (see above) |
| `hero-scroll.js` | First-half scroll logic (was `script.js`) |
| `styles.css` | Shared menu + scrolls 5–7, contact, footer |
| `script.js` | Second-half logic (menu expand, project switch, cursors, cards, podcast, form, compass) |

Load order: `hero.css` → `styles.css`; `three.min.js` → `hero3d.js` → `hero-scroll.js` → `script.js`.

### Header → shared menu

- `#site-header` (beyond.png + 54px canvas) is removed. The fixed `.menu` from the second half is the header for the whole page.
- `#header-canvas` now lives inside the menu's icon slot (`.logo__icon`, 30×25 design px, scales with `--u`).
- `hero3d.js` sizes the header renderer to that slot (`sizeHeaderCanvas()`, re-run on resize); header camera moved to `(1.0, 1.0, 1.6)` so the house reads at this size.
- The roof-fly target is still `#header-canvas`'s centre, so the roof now lands in the menu. The slot's grey background is on the canvas itself, so it fades in with the house.

### Stacking

```
z-index 100  .play-cursor
z-index  50  .menu (fixed)
z-index  40  .location (fixed)
z-index   3  .s5-pin, .s6, .s7, .contact, .footer
z-index   2  .hero-sticky, #about-section
z-index   1  #hero-canvas (fixed)
```

### Hero pause

Once the scroll-5 pin track reaches the top of the screen, `script.js` sets `window.__heroPaused = true` and hides `#hero-canvas`; `hero3d.js` skips the full-screen render while paused (the header mini-house keeps rendering). Scrolling back up resumes it.

### Hero text repel (`text-repel.js`, ES module)

- Stanza copy in `#hero-text-scroll` parts around the 3D house as it scrolls past (ref: gionatannese.com/about).
- **Pretext** (`@chenglou/pretext`, loaded from jsDelivr → esm.sh) lays each paragraph/`<br>` line out at the 440px column width without DOM reflow, and measures the word gap nearest each line's middle. Canvas `measureText` is used as a fallback if the CDN can't be reached.
- Each line is rendered as two absolutely positioned halves. Every frame, the needed half-gap at that line's height is read from an ellipse around the house (`window.__houseScreen`, published by `updateHouseScreen()` in `hero3d.js` from the projected wall corners + roof apex); the halves slide apart just enough to clear it and ease back (`EASE`).
- Tunables at the top of the file: `PAD_X`, `PAD_Y`, `EASE`. `FONT` / `LINE_H` / `PARA_GAP` / `COL_W` must match the CSS for `#hero-text-scroll p`.
- The original `<p>`s stay in `.repel-source` (visually hidden) so screen readers still read the copy.
- Module scripts need the page served over http (e.g. VS Code Live Server), not opened as `file://`.
