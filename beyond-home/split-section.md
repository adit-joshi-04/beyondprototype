# Split Section — Archived Code

Removed from main flow on 2026-10-28 due to browser freeze and visual issues.
To be reimplemented from scratch.

---

## Design Intent

Two full-viewport panels (FIFTH AVENUE left, ROOTS right) that slide in from their respective
screen edges like doors as the user scrolls through a 200vh pin track.
Once fully open, hovering a panel shifts a centre divider toward that side, revealing more
of the hovered project and fading the opposite content.

---

## HTML (`index.html`, between `#about-section` and `.s6`)

```html
<!-- Split project navigator — entrance: panels slide in from left/right like doors -->
<div class="split-pin" id="splitPin">
  <section class="split" id="split">
    <div class="sp-panel sp-left" data-side="left">
      <h2 class="sp-fifth rv">FIFTH<br>AVENUE</h2>
      <p class="sp-floors rv" style="--d:1">45 Residential Floors.<br><b>An Architectural<br>Marvel.</b></p>
      <a class="sp-explore sp-explore-left" href="#">Explore Project
        <svg width="96" height="8" viewBox="0 0 96 8" aria-hidden="true"><path d="M0 4H95M91 1l4 3-4 3" fill="none" stroke="currentColor" stroke-width="1"/></svg>
      </a>
    </div>
    <div class="sp-panel sp-right" data-side="right">
      <div class="sp-right-shift">
        <p class="sp-villa rv">A sustainable villa<br>community <b>rooted in<br>the future.</b></p>
        <h2 class="sp-roots rv" style="--d:1">ROOTS</h2>
      </div>
      <a class="sp-explore sp-explore-right" href="#">Explore Project
        <svg width="96" height="8" viewBox="0 0 96 8" aria-hidden="true"><path d="M0 4H95M91 1l4 3-4 3" fill="none" stroke="currentColor" stroke-width="1"/></svg>
      </a>
      <p class="sp-status"><span class="sp-dot"></span>150 days until completion</p>
    </div>
    <span class="sp-divider"></span>
    <span class="sp-frame"></span>
  </section>
</div>
```

---

## CSS (`styles.css`, the full split block)

```css
@property --dx {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}

.split-pin {
  position: relative;
  z-index: 3;
  height: calc(var(--vh) * 2);   /* 100vh sticky + 100vh entrance scroll */
}

.split {
  position: sticky;
  top: 0;
  height: var(--vh);
  overflow: hidden;
  background: var(--bg);
  transition: --dx 0.9s cubic-bezier(0.65, 0, 0.35, 1);
}

/* Panels — scroll-scrubbed entrance via --entrance-p (set by hero-scroll.js) */
.sp-panel {
  position: absolute;
  inset: 0;
}
.sp-left  { transform: translateX(calc((var(--entrance-p, 0) - 1) * 100%)); }
.sp-right { transform: translateX(calc((1 - var(--entrance-p, 0)) * 100%)); }

/* After entrance completes: clip to divider position for hover effect */
.split.is-open .sp-left  { clip-path: inset(0 calc(100% - var(--dx)) 0 0); }
.split.is-open .sp-right { clip-path: inset(0 0 0 var(--dx)); }

/* Divider line */
.sp-divider {
  position: absolute;
  top: 0; bottom: 0;
  left: var(--dx);
  width: 1px;
  background: var(--ink);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.5s var(--ease);
}
.split.is-open .sp-divider { opacity: 1; transition-delay: 0.2s; }

/* Frame border */
.sp-frame {
  position: absolute;
  inset: 0;
  border: 1px solid var(--ink);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.5s var(--ease);
}
.split.is-in .sp-frame { opacity: 1; }

/* Typography (design-px converted to --u) */
.sp-fifth,
.sp-roots {
  position: absolute;
  margin: 0;
  font-size: calc(128 * var(--u));
  line-height: calc(126 * var(--u));
  font-weight: 700;
  white-space: nowrap;
  font-family: var(--serif);
}
.sp-fifth { left: calc(44 * var(--u));  top: calc(131 * var(--u)); }
.sp-roots { right: calc(43 * var(--u)); bottom: calc(26 * var(--u)); }

.sp-floors,
.sp-villa {
  position: absolute;
  font-size: calc(24 * var(--u));
  line-height: calc(24 * var(--u));
  white-space: nowrap;
  font-family: var(--serif);
}
.sp-floors { left: calc(48 * var(--u));  bottom: calc(39 * var(--u)); }
.sp-villa  { right: calc(43 * var(--u)); top: calc(140 * var(--u)); text-align: right; }

/* Fade-up reveal — fires when .is-in is added */
.split .rv {
  opacity: 0;
  transform: translateY(calc(24 * var(--u)));
  transition: opacity 0.5s var(--ease), transform 0.7s var(--ease);
}
.split.is-in .rv {
  opacity: 1;
  transform: none;
  transition-duration: 1s, 1.2s;
  transition-delay: calc(0.35s + var(--d, 0) * 130ms);
}

/* Hover: shift divider toward hovered side */
.sp-right-shift {
  position: absolute;
  inset: 0;
  transition: transform 0.9s cubic-bezier(0.65, 0, 0.35, 1),
              opacity 0.4s var(--ease);
}
.split.hover-left .sp-fifth {
  transform: scale(0.9375);
  transform-origin: left center;
  transition: transform 0.9s cubic-bezier(0.65, 0, 0.35, 1);
}
.split.hover-right .sp-right-shift { transform: translateX(calc(-33 * var(--u))); }
.split.hover-left  .sp-right-shift { opacity: 0; }
.split.hover-right .sp-left .rv    { opacity: 0; transition-duration: 0.4s; transition-delay: 0s; }

/* Explore links */
.sp-explore {
  position: absolute;
  display: flex;
  align-items: center;
  gap: calc(25 * var(--u));
  font-size: calc(24 * var(--u));
  line-height: calc(30 * var(--u));
  color: var(--ink);
  text-decoration: none;
  white-space: nowrap;
  opacity: 0;
  transform: translateX(calc(-8 * var(--u)));
  pointer-events: none;
  transition: opacity 0.35s var(--ease), transform 0.5s var(--ease);
}
.sp-explore svg { flex: none; margin-top: calc(1 * var(--u)); }
.sp-explore-left  { right: calc(230 * var(--u)); bottom: calc(40 * var(--u)); }
.sp-explore-right { left: calc(189 * var(--u));  top: calc(138 * var(--u)); }
.split.hover-left  .sp-explore-left,
.split.hover-right .sp-explore-right {
  opacity: 1;
  transform: none;
  pointer-events: auto;
  transition-duration: 0.8s, 0.9s;
  transition-delay: 0.3s;
}
.sp-explore:hover svg { transform: translateX(calc(6 * var(--u))); transition: transform 0.4s var(--ease); }
.sp-explore svg       { transition: transform 0.4s var(--ease); }

/* Status badge */
.sp-status {
  position: absolute;
  left: calc(213 * var(--u));
  bottom: calc(44 * var(--u));
  font-size: calc(16 * var(--u));
  line-height: calc(20 * var(--u));
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.35s var(--ease);
  font-family: var(--serif);
}
.sp-dot {
  position: absolute;
  left: calc(-15 * var(--u));
  top: calc(9.5 * var(--u));
  width: calc(4 * var(--u));
  height: calc(4 * var(--u));
  border-radius: 50%;
  background: var(--ink);
}
.split.hover-right .sp-status { opacity: 1; transition-duration: 0.8s; transition-delay: 0.45s; }
```

---

## JS — Scroll entrance (`hero-scroll.js`, `updateSplit` function + related vars)

```js
const splitPin  = document.getElementById('splitPin');
const splitEl   = document.getElementById('split');
const heroCanvas = document.getElementById('hero-canvas');

function updateSplit () {
  if (!splitPin) return;
  const seqTop  = splitPin.offsetTop;
  const vh      = window.innerHeight;
  const scrolled = window.scrollY - seqTop;
  // 100vh of scroll drives the entrance (0 → 1)
  const raw = Math.max(0, Math.min(1, scrolled / vh));

  // Scroll-scrubbed: set CSS variable directly (no lerp)
  splitEl.style.setProperty('--entrance-p', raw);

  // Hide hero canvas once panels have fully closed
  const covered = raw >= 0.98;
  if (covered !== !!window.__heroPaused) {
    window.__heroPaused = covered;
    if (heroCanvas) heroCanvas.style.visibility = covered ? 'hidden' : '';
  }

  // Enable clip-path + divider once entrance is complete
  splitEl.classList.toggle('is-open', raw >= 0.98);
  // Trigger .rv reveals and frame border slightly after
  splitEl.classList.toggle('is-in', raw >= 0.99);
}
```

Also called in the scroll listener and init block:
```js
// In the scroll listener:
updateSplit();

// In init:
updateSplit();
```

---

## JS — Hover interaction (`script.js`, first IIFE)

```js
/* -----------------------------------------------------------------------
   Split hover — divider shifts toward the hovered panel.
   Enabled only after .is-open fires (entrance complete).
   ----------------------------------------------------------------------- */
(() => {
  const split  = document.getElementById('split');
  const panels = [...split.querySelectorAll('.sp-panel')];
  let hoveredSide = null;
  let isReady = false;

  // Mirror is-open state so hover only works after the door has fully closed
  const obs = new MutationObserver(() => {
    isReady = split.classList.contains('is-open');
    if (!isReady) {
      split.classList.remove('hover-left', 'hover-right');
      hoveredSide = null;
    } else {
      resetDx();
    }
  });
  obs.observe(split, { attributes: true, attributeFilter: ['class'] });

  // --dx is a registered <length> property so it transitions smoothly
  function setDx(pxFromLeft) {
    split.style.setProperty('--dx', pxFromLeft + 'px');
  }
  function resetDx() {
    setDx(split.clientWidth / 2);
  }
  window.addEventListener('resize', () => {
    if (split.classList.contains('is-open')) resetDx();
  });

  panels.forEach(panel => {
    panel.addEventListener('pointerenter', () => {
      hoveredSide = panel.dataset.side;
      if (!isReady) return;
      split.classList.remove('hover-left', 'hover-right');
      split.classList.add('hover-' + hoveredSide);
      // Mirror the CSS --u formula: min(100vw/1440, 100vh/900)
      const u = Math.min(window.innerWidth / 1440, window.innerHeight / 900);
      if (hoveredSide === 'left')  setDx(split.clientWidth - 156 * u);
      if (hoveredSide === 'right') setDx(155 * u);
    });
  });

  split.addEventListener('pointerleave', () => {
    hoveredSide = null;
    split.classList.remove('hover-left', 'hover-right');
    if (split.classList.contains('is-open')) resetDx();
  });
})();
```

---

## Known Issues (why this was pulled)

1. **Browser freeze** — `clip-path` applied to two full-viewport `position:absolute; inset:0` panels.
   When combined with a transitioning registered `@property` (`--dx`), and previously with
   `will-change: transform`, this forced full-screen CPU repaints every frame during the 0.9s
   `--dx` transition. Rapid `is-open` toggling near the scroll threshold made it worse.

2. **Visual broken on open** — `--dx` initial value is `0px` (from `@property`). When `is-open`
   fires, `--dx` is still `0px`, so the left panel is fully clipped (`clip-path: inset(0 100% 0 0)`)
   and the divider sits at the left edge. `resetDx()` was never called automatically on open.

## Reimplementation Notes

- Avoid `clip-path` on large elements for the divider hover effect. Consider a separate thin
  overlay element or a transform-based approach on a wrapper instead.
- Consider using GSAP ScrollTrigger instead of the manual scroll listener for the entrance,
  to get scrub + proper invalidation for free.
- The `--entrance-p` unregistered custom property driving `translateX` is fine for the entrance
  (no transition needed), but the hover divider needs a completely different mechanism.
