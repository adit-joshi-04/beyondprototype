# Contact + Footer — Implementation Guide

**Rule:** on every page, both the existing contact section AND the existing footer
are always removed and replaced with the shared `#section-seven` component.

Single source of truth: `shared/inject-contact-footer.js`
(`contact-footer.html` in `shared/` is unused — can be deleted.)

**To edit copy, layout, or styles:** open `inject-contact-footer.js` and edit
the template literal inside the IIFE. No other files need touching.

---

## How the injector works

`inject-contact-footer.js` is a self-contained IIFE. It calls
`document.body.insertAdjacentHTML('beforeend', ...)` synchronously, then
dispatches `contactFooterReady` on `document`. No `fetch`, no server-root
requirement, no MIME risk. Works on `file://` URLs. `#section-seven` is in
the DOM before the next line after the script tag runs.

---

## Per-page instructions

---

### beyond-home (`beyond-home/index.html`)

**Scroll type:** normal scroll (Pattern A — no GSAP scroll-jacking)

#### 1. HTML — remove and replace

In `index.html`, find and delete both of these blocks in full:

```html
<!-- ============ CONTACT ============ -->
<section class="contact" id="contact">
  ...
</section>

<!-- ============ FOOTER ============ -->
<footer class="footer" id="footer">
  ...
</footer>
```

In their place (just before `</main>`) add the injector script tag:

```html
    <script src="../shared/inject-contact-footer.js"></script>
```

The full script block at the bottom of `<body>` should then read:

```html
  <script src="../shared/inject-contact-footer.js"></script>
  <script src="hero3d.js"></script>
  <script src="hero-scroll.js"></script>
  <script src="script.js"></script>
  <script type="module" src="text-repel.js"></script>
```

#### 2. CSS — remove old rules from `styles.css`

Delete every rule whose selector starts with `.contact` or `.footer`.
Also delete the shared overrides at the bottom that reference them:

```css
/* delete this block (~line 927) */
.contact,
.footer { --u: calc(var(--vw, 100vw) / 1440); }
.contact__inner,
.footer__inner { width: 100%; }
```

Add the section height in the same file (or in a `<style>` block in `index.html`):

```css
#section-seven {
    height: 100vh;
    position: relative;
}
```

#### 3. JS — remove old logic from `script.js`

Delete the three blocks that reference the old contact/footer elements:

**Block 1 — menu-hidden toggle** (references `#contact`, ~line 118):
```js
const contact = document.getElementById('contact');
// ... scroll listener that calls body.classList.toggle('menu-hidden', ...)
```

**Block 2 — contact form validation** (references `#contactForm`, ~line 208):
```js
const form = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
// ... validation + submit handler
```

**Block 3 — compass + footer intersection observer** (references `#footer`, ~line 237):
```js
const compass  = document.getElementById('compass');
const rose     = document.getElementById('compassRose');
const footer   = document.getElementById('footer');
// ... geolocation, compass bearing, IntersectionObserver on footer
```

These are all tied to the old elements. The shared component has its own
contact form; no compass logic exists in it.

#### 4. Font

`beyond-home/fonts/` already contains the PartnerSerif files. Add `@font-face`
to `styles.css` if not already present:

```css
@font-face {
    font-family: 'PartnerSerif';
    src: url('fonts/PartnerSerif-Regular.otf') format('opentype');
    font-weight: 400;
}
@font-face {
    font-family: 'PartnerSerif';
    src: url('fonts/PartnerSerif-Bold.otf') format('opentype');
    font-weight: 700;
}
```

#### 5. No GSAP wiring needed

Normal scroll page — no `postHeroTl`, no `visibility` toggling, no entry
timelines. `#section-seven` sits in document flow at natural page height.

Entry animations (`.ft-left` slide, content fades) are built into the injector
as CSS transitions triggered by an IntersectionObserver. When 15% of the section
scrolls into view, the injector adds `.is-visible` to `#section-seven` and the
transitions fire automatically. The IntersectionObserver is only set up when
`gsap` is not present on the page, so Pattern B pages are unaffected.

Cloud drift animations in `.ft-left` are pure CSS keyframes.

---

### fifth ave (`projects page/fifth ave/index.html`)

**Scroll type:** GSAP scroll-jacked (Pattern B)

Already implemented. Reference state documented below for completeness
and for re-implementing if anything breaks.

#### HTML

Injector tag in `index.html` just before `site.js`:
```html
    <script src="../../shared/inject-contact-footer.js"></script>
    <script src="site.js"></script>
```

No `<section>` or `<footer>` markup for S7 — the injector creates it.

#### CSS override in `index.html` `<style>` block

```css
#section-seven {
    position: fixed;
    inset: 0;
    z-index: 7;
    visibility: hidden;
}
```

#### GSAP wiring in `site.js` — two-timeline system

`sectionSeven`, `s7SwapTl`, `s7EntryTl` are declared as `let` in the outer
closure. `initS7()` is called inside `document.fonts.ready` (element is
synchronously in the DOM so no `contactFooterReady` wait is needed).

**`s7SwapTl`** — page-swap. Always reverses on scroll-back.
Section-six is NOT in this timeline — it stays at `y:0` under section-seven
and is revealed by z-index when section-seven slides back down.

**`s7EntryTl`** — footer reveal. Never reverses. Resets to `progress(0)` only
inside `s7SwapTl.onReverseComplete` (after section has fully slid off-screen),
so footer content stays visible while animating out. For `isJumping`, both
timelines reset instantly in the `else if` branch.

**`initS7()` summary:**
```js
function initS7() {
    sectionSeven = document.getElementById('section-seven');
    // cache ft- elements ...
    // gsap.set initial states ...

    s7SwapTl = gsap.timeline({ paused: true })
        .fromTo(sectionSeven, { y: '100%' }, { y: 0, duration: 0.65, ease: 'power2.out' }, 0);

    s7SwapTl.eventCallback('onReverseComplete', () => {
        if (!s7Triggered) {
            gsap.set(sectionSeven, { visibility: 'hidden' });
            s7EntryTl.progress(0).pause();
        }
    });

    s7EntryTl = gsap.timeline({ paused: true })
        .fromTo(ftLeft, { x: '-100%' }, { x: 0, duration: 0.55, ease: 'power2.out' }, 0.65)
        // ... staggered content reveals at t=1.2–1.45
}
```

**onUpdate trigger block** (`S7_TRIGGER_T = 18.0`, `POST_TOTAL = 8200`):
```js
if (sectionSeven && s7SwapTl && s7EntryTl) {
    if (t >= S7_TRIGGER_T && !s7Triggered) {
        s7Triggered = true;
        gsap.set(sectionSeven, { y: '100%' });
        gsap.set(sectionSeven, { visibility: 'visible' });
        sectionSeven.classList.add('is-in');
        if (isJumping) {
            s7SwapTl.progress(1).pause();
            s7EntryTl.progress(1).pause();
        } else {
            s7SwapTl.play();
            s7EntryTl.play();
        }
    } else if (t < S7_TRIGGER_T && s7Triggered) {
        s7Triggered = false;
        sectionSeven.classList.remove('is-in');
        if (isJumping) {
            s7EntryTl.progress(0).pause();
            s7SwapTl.progress(0).pause();
            gsap.set(sectionSeven, { visibility: 'hidden' });
        } else {
            s7SwapTl.reverse();
        }
    }
}
```

---

### roots (`projects page/roots/index.html`)

**Scroll type:** Three.js + GSAP scroll-jacked (Pattern B — same as Fifth Ave)

Read `roots/context.md` before starting to understand the scroll system
(`postScroll`, `postHeroTl`, trigger thresholds, `isJumping` flag).

#### 1. HTML — remove and replace

Find and delete any existing contact `<section>` and footer `<footer>` in full.
Add the injector just before `site.js` (or the page's main script):

```html
    <script src="../../shared/inject-contact-footer.js"></script>
    <script src="site.js"></script>
```

#### 2. CSS override

Add to the page's `<style>` block:

```css
#section-seven {
    position: fixed;
    inset: 0;
    z-index: [N+1];     /* one above the last section's z-index */
    visibility: hidden;
}
```

#### 3. GSAP wiring

Follow the identical two-timeline pattern from Fifth Ave above.
Adjust `S7_TRIGGER_T` and `POST_TOTAL` to match roots' timeline values
(read `context.md` for current values).

---

### about prototype (`about prototype/index.html`)

**Scroll type:** normal scroll (Pattern A — no GSAP scroll-jacking)
Read `about prototype/context.md` before starting.

#### 1. HTML — remove and replace

Find and delete any existing contact `<section>` and footer `<footer>` in full.
Add the injector as the last script before `</body>`:

```html
    <script src="../shared/inject-contact-footer.js"></script>
</body>
```

#### 2. CSS

Add:
```css
#section-seven {
    height: 100vh;
    position: relative;
}
```

Remove all old contact/footer CSS rules.

#### 3. JS

Remove any JS that references old contact form elements (`#contactForm`,
`#submitBtn`, etc.) or the old footer element (`#footer`).

#### 4. No GSAP wiring needed

Same as beyond-home — Pattern A, normal scroll.

---

## General checklist (any new page)

1. **Identify scroll type** — normal scroll (Pattern A) or GSAP wheel-jacked (Pattern B).
2. **Delete old HTML** — remove the contact `<section>` and footer `<footer>` in full.
3. **Add script tag** — `<script src="[relative path]/shared/inject-contact-footer.js"></script>` before the page's main script.
4. **Add CSS** — Pattern A: `height: 100vh; position: relative`. Pattern B: `position: fixed; inset: 0; z-index: [N+1]; visibility: hidden`.
5. **Remove old CSS** — delete all rules scoped to the old contact/footer selectors.
6. **Remove old JS** — delete any JS referencing old contact form or footer elements.
7. **Font** — ensure `@font-face` for PartnerSerif 400 and 700 is present, paths relative to the page.
8. **Pattern B only** — wire up `initS7()` with the two-timeline system. Set `S7_TRIGGER_T` to the correct timeline position. Read the page's `context.md` for current `POST_TOTAL` and trigger values.

---

## Layout reference

### `#s7-contact` — top half (`height: 50%`, `background: #d2d2d2`)

Flexbox row, `padding: 0 6%`, `gap: 8%`, `align-items: center`.
Needs `pointer-events: auto` if any parent uses `pointer-events: none`.

| Zone | Content |
|---|---|
| `.ct-left` (`flex: 0 0 36%`) | title + sub-copy |
| `.ct-form` (`flex: 1`) | three-field form (name / email / note) |

Form fields (`.ct-field`): flex row, `border-bottom: 1px solid #0f0f0f`.
`.ct-label` + `.ct-input-wrap`. Inputs borderless/backgroundless.
SUBMIT button inverts on hover.

### `#s7-footer` — bottom half (`height: 50%`)

**`.ft-left`** (`flex: 0 0 64%`, `background: #878787`):
nav grid, weather readout, social icons, drifting cloud SVGs, credit line.

**`.ft-right`** (`flex: 1`, `background: #ffffff`):
tagline ("Towards / Thought-Led / Development") + address block.

---

## Gotchas

- **No fetch, no server required** — the injector is a self-contained IIFE with
  a template literal. Works on `file://` and any server root.

- **Pattern A animations are built into the injector** — CSS transitions +
  IntersectionObserver are inside the IIFE. No extra JS needed. The IO is
  guarded by `typeof gsap === 'undefined'` so it never runs on Pattern B pages.

- **`s7EntryTl` resets in `onReverseComplete`, not on scroll-back** — keeps
  footer content visible while section slides out. For `isJumping`, reset both
  timelines instantly in the `else if` branch.

- **Don't put section-six (or any outgoing section) in `s7SwapTl`** — it stays
  at `y:0` under section-seven and is revealed by z-index. Mixing it in creates
  a reversal conflict.

- **Cloud SVG viewBox values are corrected** — baked into the injector.
  sun `0 0 371 371`, cloud2 `0 -47 462 190`, cloud1 `-470 -62 635 256`.

- **`@property --fw` is registered on `#section-seven`** — kept harmlessly for
  the `.is-in` class toggle. The wipe system it powered has been removed.

- **`#section-seven` is a unique ID** — only include the injector once per page.
