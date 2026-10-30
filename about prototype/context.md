# About Page Prototype — Beyond Concrete

## Stack
- Plain HTML/CSS/JS, no build system
- Fonts: `'PartnerSerif'` (serif, body/headings) + `'Nunito Sans'` (UI text, captions) — loaded via `../shared/fonts.css`
  - PartnerSerif variants: Regular (400), Medium (500), Bold (700), Italic (400), MediumItalic (500), BoldItalic (700) — all `.otf` in `shared/fonts/`
  - Nunito Sans: Google Fonts import inside `fonts.css`
- Files: `index.html`, `site.js`
- Shared: `../shared/fonts.css`, `../shared/inject-header.js`, `../shared/inject-contact-footer.js`

## Global
- `html`: `scroll-snap-type: y mandatory` — all sections snap
- `section`: `scroll-snap-align: start`
- Base font: `'PartnerSerif', serif` (set on `body`)
- `.subtitle`, `.img-caption`: `'Nunito Sans', sans-serif`
- Horizontal padding on sections: `60px`
- **No header HTML in index.html** — header injected entirely by `../shared/inject-header.js`

---

## Sections (top to bottom)

### 1. Header
- Injected by `../shared/inject-header.js` — no markup or CSS for this in `index.html` or `site.js`

### 2. Hero (`.hero`)
- `min-height: 100vh`, flex row, `background: #d4d4d4`
- **Left** (`.hero-left`): flex column
  - `<h1>` with 3 `<span>` children: "the", "bare bones", "are simple."
    - `justify-content: space-between` on h1
  - `.subtitle`: Nunito Sans, 20px
- **Right** (`.hero-right`): 420px wide
  - `.hero-img-placeholder`: `420×596px` grey box
  - `.img-caption`: small Nunito Sans, uppercase
- **Animation** (JS, on page load):
  - Spans fade in one by one across 3000ms total (1000ms each interval)
  - Each span transition: `opacity 1s ease`
  - After last span + 1000ms fade + 400ms pause → subtitle, image, caption fade in together

### 3. Philosophy (`.philosophy`)
- `position: relative`, `height: 100vh`, `overflow: hidden`
- 4 absolutely positioned blocks:

#### `.phil-center` (centered, `700×440px`, `position: absolute`, `top:50% left:50% transform:translate(-50%,-50%)`)
- Its own inner canvas — all children `position: absolute`
- `.word-our`: italic PartnerSerif, 3.2rem, `top:124px left:70px`
- `.phil-subtitle`: Nunito Sans 0.85rem, `top:121px left:270px`, width 240px
- `.word-true`: 8.5rem weight 400, `top:134px left:160px`
- `.word-north`: italic PartnerSerif 5rem, `top:239px left:380px`
- Note: "our" and "north" use real PartnerSerif Italic (drawn, not synthesised)

#### `.phil-block-a` (top-left: `top:160px left:60px`, `360px` wide)
- Grey card (`#D9D9D9`), `padding: 20px 32px`, `gap: 28px`
- `.phil-label` (PartnerSerif, 24px, uppercase) + `.subtitle`
- Content: "PEOPLE FIRST" + body

#### `.phil-block-b` (bottom-center: `bottom:60px left:calc(50%-240px)`, `480px` wide)
- Same grey card style
- Content: "PLANET-CONSCIOUS" + body

#### `.phil-block-c` (top-right: `top:60px right:60px`, `360px` wide)
- Same grey card style
- Content: "BEYOND OWNERSHIP" + body

- **Animation** (JS, IntersectionObserver, `threshold: 0.5`, replays on re-enter):
  - Section enters → `.phil-center` fades in (opacity, 0.9s)
  - 700ms later → blocks A, B, C fly in (B, A from left; C from right) via `translateX`, `cubic-bezier(0.22,1,0.36,1)`
  - Section leaves → all classes removed, resets

### 4. Team (`.team`)
- `height: 100vh`, `padding: 60px`, `display: flex; flex-direction: column`, `background: #fff`
- **Only Our Leadership remains** — Our Team and Join Our Team sections removed
- `h2.team-heading`: PartnerSerif 400, `clamp(2rem, 3.5vw, 3rem)`, `margin-bottom: 32px`
- `.team-cols`: `flex: 1`, flex row, `gap: 40px`, `min-height: 0`

#### Each `.leader-col` (flex column, `flex: 1`)
- Initial state: `opacity: 0; transform: translateY(32px)` → `.team-col-in` (0.9s ease)
- **`.leader-col-head`**: flex row, `justify-content: space-between`, `margin-bottom: 16px`
  - `.leader-question`: Nunito Sans, 1.3rem, uppercase, `line-height: 1`
    - `.muted` spans: `color: #aaa`, `display: block`
    - `.bold` spans: `color: #111`, `font-weight: 700`, `display: block`
  - `.leader-linkedin`: LinkedIn SVG (same path as `inject-contact-footer.js` footer), `18×18px`, `fill: #111`
- **`.leader-img`**: `flex: 1; min-height: 0; background: #d4d4d4` — fills all remaining column height
- **`.leader-col-foot`**: `padding-top: 20px`, `flex-shrink: 0`
  - `.leader-answer`: PartnerSerif 1rem, uppercase, `letter-spacing: 0.05em`
  - `.leader-quote`: PartnerSerif italic, 0.88rem, `line-height: 1.65`, `color: #333`

#### Leaders
- Jaya Pavan — answer: "Delight."
- Arjun Reddy — answer: "Legacy."

- **Animation** (JS, IntersectionObserver, `threshold: 0.3`, replays):
  - Observes `.team` section; both `.leader-col` elements fade up, staggered 150ms apart

### 5. Sustainability (`.sustainability`)
- `height: 200vh` — scroll snap lands at top, user scrolls through extra 100vh
- Inner `.sust-sticky`: `position: sticky; top: 0; height: 100vh; padding: 100px 60px`
- Flex row: `.sust-left` (flex column, `justify-content: space-between`) + `.sust-right` (`position: relative`)

#### Left side — two states
- `.sust-top`: h2 "Sustainability" + `.sust-subtitle-wrap` (relative container for cross-fade)
  - **State 1** (`.sust-state-1`): subtitle with 2 `.sust-line` spans; line 2 ends with `.sust-strike-word` ("practices.") — animated strikethrough via `::after width`
  - **State 2** (`.sust-state-2`): `.sust-subtitle-2` — PartnerSerif 28px, "isn't an arbitrary statement..."
- `.sust-bottom` (`position: relative`): body + question list
  - **State 1** (`.sust-body.sust-state-1`): 3 `.sust-line` spans, Nunito Sans 1.7rem
  - **State 2** (`.sust-questions.sust-state-2`): `<ul>`, Nunito Sans uppercase, `overflow: hidden`
    - nth-child colors: #333 → #777 → #aaa → #ccc (auto-updates as DOM order changes)
    - **Ticker**: auto-scrolls questions upward in a loop (TICK_DURATION=400ms, TICK_INTERVAL=1200ms)
      - All items translate up by slot height; top item fades out
      - Top item appended to bottom (seamless reorder — natural positions match translated positions)
      - New bottom item fades back in

#### Right side (`.sust-right`, `position: relative`)
- Two floating text labels (state 1 only, `.sust-float-text.sust-state-1`):
  - `.sust-float-text-a`: italic PartnerSerif, `top: calc(14% + 120px); right: 8%`
  - `.sust-float-text-b`: italic PartnerSerif, `bottom: 28%; left: 2%`
  - Both loop with `@keyframes` float (5s / 6s), pause + `translateY(-10px)` on hover
- Two image labels (state 2 only, `.sust-img-label`):
  - `.sust-img-label-a`: `top: calc(14% + 120px); left: 6%`
  - `.sust-img-label-b`: `bottom: 10%; right: 4%`
  - Each: `+` sign + uppercase Nunito Sans text, white background + padding, `z-index: 2`
  - Labels sync with ticker — content from `Q_LABELS` array in `site.js`
- Image crossfade wrapper (`.sust-img-wrap`, `position: relative; z-index: 1`):
  - `.sust-img-current`: in-flow image (takes up space)
  - `.sust-img-next`: `position: absolute; top:0; left:0; width:100%; height:100%` — crossfade layer
  - Images cycle through `Q_IMAGES = ['1.png','2.png','3.png','4.png']` with each ticker tick (0.6s crossfade)
  - `sus.png` shown in state 1; restores on scroll-back

#### State swap (JS scroll listener)
- When scrolled 10% of `innerHeight` past section top → `doSwapIn()`:
  - t=0: state-1 elements fade out (`.sust-out`, 0.6s)
  - t=700ms: subtitle-2 fades in (`.sust-visible`, 0.7s)
  - t=1500ms: questions container + items stagger in (150ms apart, 0.5s fade)
  - t=2000ms: ticker starts
- Scroll back → `doSwapOut()`: clears timeouts, stops ticker, restores DOM order + classes
- `swapped` flag prevents re-triggering mid-animation

#### Entrance animation (IntersectionObserver, `threshold: 0.3`, replays)
- t=0: h2 fades up (1.4s)
- t=700ms: subtitle line 1 fades up (1.2s)
- t=1300ms: subtitle line 2 fades up (1.2s)
- strikethrough draws after subtitle lines settle
- Body lines, image wrap, and float texts all start at `bodyStartT` simultaneously
  - Body lines: 600ms apart, 1.2s fade each
  - Image wrap: 2.4s fade (longer than body)
  - Float texts: 300ms apart after image

### 6. Ekam (`.ekam-section`)
- `<section>`, `scroll-snap-align: start`, `min-height: 100vh`, `display: flex; flex-direction: row`, `background: #d4d4d4`
- **Layout**: white card floating left + grey right area for full-width image

#### `.ekam-card` (white card)
- `width: 44%`, `background: #fff`, `padding: 60px`
- `margin: 60px 0 60px 60px` — floats with grey visible on top, left, bottom
- `display: flex; flex-direction: column; justify-content: space-between`
- Initial state: `opacity: 0; transform: translateY(40px)` → `.ekam-in` (1s ease)
- **Top** (`.ekam-card-top`): flex column, `gap: 28px`
  - `.ekam-title`: PartnerSerif 400, `clamp(2rem, 3.2vw, 3rem)`
  - `.ekam-desc`: PartnerSerif, 1rem, `line-height: 1.65`
- **Bottom** (`.ekam-stats`): flex column, no gap
  - Each `.ekam-stat`: `border-top: 1px solid #ccc`, `padding: 20px 0`
    - `.ekam-stat-label`: Nunito Sans bold 0.82rem, uppercase
    - `.ekam-stat-desc`: PartnerSerif 0.95rem
  - Stats: "35,000 sq. ft CLUBHOUSE" / "468 HOMES with 93 FLATS PER ACRE DENSITY" / "7.4 kW EV CHARGING STATIONS"
  - Stats stagger in: `opacity: 0; transform: translateY(16px)` → `.ekam-stat-in`, 180ms apart starting at 400ms

#### `.ekam-right` (flex: 1)
- Grey from section background (no fill)
- `.ekam-img-label`: `position: absolute; top: 40px; right: 40px` — Nunito Sans 0.68rem uppercase, `color: #777`

- **Animation** (JS, IntersectionObserver, `threshold: 0.25`, replays):
  - Card fades up; stats stagger in 180ms apart at 400ms offset; resets on leave

### 7. Work Behind the Words (`.work-section`)
- `<div>` not `<section>` — has `scroll-snap-align: start`
- `background: #d4d4d4`, `padding: 80px 60px 100px`, natural height
- `.work-heading`: PartnerSerif 400, `clamp(2.4rem, 4.5vw, 4rem)`, `white-space: nowrap`, `margin-bottom: 80px`
- `.work-grid`: 3-column CSS grid, `gap: 0 48px`
- Each `.work-col`:
  - `border-top: 1px solid #999`, `padding-top: 20px`
  - `.work-col-header`: flex row, filled circle dot (10px, `#333`) + uppercase Nunito Sans label
  - `.work-list`: PartnerSerif 1rem items with `· ` prefix via `::before`
- Columns: MATERIAL / ENERGY / LANDSCAPE

### 8. FAQ (`.faq-section`)
- `<div>`, `scroll-snap-align: start`, `min-height: 100vh`, `background: #fff`
- `padding: 80px 60px 100px`, flex row, `gap: 80px`
- **Left** (`.faq-left`, `width: 260px`, flex column, `justify-content: space-between`):
  - `.faq-left-top`: h2 "Nothing Hidden in the Fine Print" (PartnerSerif 3.5rem) + subtitle "In the spaces we design and the way we work"
  - `.faq-img-placeholder`: `220×220px` grey box
- **Right** (`.faq-right`, `flex: 1`, `max-width: 1000px`, `margin-left: auto`):
  - List of `.faq-item` accordion panels
  - Each item: `.faq-question` (flex row, question text + toggle button) + `.faq-answer` + `border-bottom`
  - **Accordion animation**: CSS `grid-template-rows: 0fr → 1fr` (0.45s cubic-bezier)
    - Inner `.faq-answer-inner` has `overflow: hidden` (required for grid trick)
    - First item open by default (`.faq-open`)
    - Click: previously open item closes instantly (no animation), new item animates open — prevents layout jump
  - Toggle button: `+` (closed) / `×` (open), Nunito Sans, `font-weight: 300`
  - Questions: "Is this your first venture in real estate?" / "Are you an architecture studio or a real estate company?" / "Why are you called Beyond Concrete?" / "What does IGBC recognition mean for a building?" / "How does living in a green building benefit me?" / "Where can I learn more about your projects?"

### 9. Contact + Footer (`#section-seven`)
- Injected entirely by `../shared/inject-contact-footer.js` — no markup or CSS in `index.html`
- **Exception**: `index.html` must provide `#section-seven { height: 100vh; position: relative; scroll-snap-align: start; }` — the inject file only sets `background` and animation properties, not layout. Without these the absolutely positioned children escape the section.

---

## JS Architecture (`site.js`)
All animation logic lives here. Patterns used:
- `setTimeout` chains for sequenced entrance animations
- `IntersectionObserver` for scroll-triggered entrances (all replay on re-enter)
- `window.addEventListener('scroll')` for within-section state swap (sustainability)
- Timeouts stored in arrays and `clearTimeout`-ed on section leave to prevent mid-animation resets
- `setInterval` for sustainability ticker; `swapped` flag prevents re-entry
- `requestAnimationFrame` double-fire for reliable CSS transition triggering after DOM changes

## Key CSS Patterns
- **Absolute positioning canvas**: `position: relative` on parent, `position: absolute` on children — philosophy, phil-center, sust-right floating texts
- **Sticky scroll**: `height: 200vh` + `position: sticky; top: 0; height: 100vh` — sustainability
- **Floating card**: `margin: 60px 0 60px 60px` inside full-bleed section — ekam card
- **Fade-up entrance**: `opacity: 0; transform: translateY(Xpx)` → `.class-in` — used throughout
- **Fly-in**: `transform: translateX(±100vw)` → `.class-in` — philosophy blocks
- **Cross-fade swap**: two stacked elements, one absolute over the other, opacity toggled — sustainability state swap, image crossfade
- **Grid accordion**: `grid-template-rows: 0fr → 1fr` on outer, `overflow: hidden` on inner — FAQ
- **Seamless ticker reorder**: all items translate up → append first to end → reset transform (natural positions in new DOM match translated positions, so snap is invisible)
- **Flex column fill**: `flex: 1; min-height: 0` on image inside flex column — team leader images fill all available height without overflow
