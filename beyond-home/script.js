/* =====================================================================
   Beyond Concrete — S6 interactions
   ===================================================================== */

/* -----------------------------------------------------------------------
   Split hover — divider shifts toward the hovered panel
   ----------------------------------------------------------------------- */
(() => {
  const split  = document.getElementById('split');
  const panels = [...split.querySelectorAll('.sp-panel')];

  // Mirror the --u formula: min(100vw/1440, 100vh/900)
  const u = () => Math.min(window.innerWidth / 1440, window.innerHeight / 900);

  function setX(px) {
    split.style.setProperty('--sp-x', px + 'px');
  }
  function resetX() {
    setX(split.clientWidth / 2);
  }

  // Initialise and keep in sync with resize
  resetX();
  window.addEventListener('resize', resetX);

  panels.forEach(panel => {
    panel.addEventListener('pointerenter', () => {
      if (!split.classList.contains('is-open')) return;
      const side = panel.dataset.side;
      split.classList.remove('hover-left', 'hover-right');
      split.classList.add('hover-' + side);
      if (side === 'left')  setX(split.clientWidth - 156 * u());
      if (side === 'right') setX(155 * u());
    });
  });

  split.addEventListener('pointerleave', () => {
    split.classList.remove('hover-left', 'hover-right');
    resetX();
  });
})();

/* -----------------------------------------------------------------------
   S6 card hover + glow cursor
   ----------------------------------------------------------------------- */
(() => {
  const s6          = document.getElementById('s6');
  const glow        = document.getElementById('glow');
  const cards       = [...document.querySelectorAll('.card')];
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  let px = -9999, py = -9999, hasPointer = false;
  let glowX = 0, glowY = 0, glowTX = 0, glowTY = 0, glowOn = false;
  let hoveredCard = null;

  function resolve() {
    if (!hasPointer) return;
    const el = document.elementFromPoint(px, py);

    // S6: glow + card hover
    const overS6 = !!el?.closest('.s6');
    if (overS6) {
      const r = s6.getBoundingClientRect();
      glowTX = px - r.left;
      glowTY = py - r.top;
      if (!glowOn) { glowX = glowTX; glowY = glowTY; }
    }
    glowOn = overS6 && finePointer;
    glow.classList.toggle('is-visible', glowOn);

    const hit  = el?.closest('.card__hit');
    const card = hit ? hit.parentElement : null;
    if (card !== hoveredCard) {
      hoveredCard?.classList.remove('is-hover');
      card?.classList.add('is-hover');
      hoveredCard = card;
      const idx = card ? card.dataset.i : null;
      document.querySelectorAll('.s6__note').forEach(n =>
        n.classList.toggle('is-active', n.dataset.note === idx));
    }
  }

  window.addEventListener('mousemove', e => {
    px = e.clientX; py = e.clientY; hasPointer = true;
    resolve();
  }, { passive: true });
  window.addEventListener('scroll', resolve, { passive: true });
  document.addEventListener('mouseleave', () => {
    glow.classList.remove('is-visible');
    glowOn = false;
    hoveredCard?.classList.remove('is-hover');
    hoveredCard = null;
  });

  // touch: tap a card to tilt it
  if (!finePointer) {
    cards.forEach(c => c.querySelector('.card__hit').addEventListener('click', () => {
      cards.forEach(o => o !== c && o.classList.remove('is-hover'));
      c.classList.toggle('is-hover');
    }));
  }

  (function loop() {
    glowX += (glowTX - glowX) * 0.22;
    glowY += (glowTY - glowY) * 0.22;
    glow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0)`;
    requestAnimationFrame(loop);
  })();
})();


/* -----------------------------------------------------------------------
   S7 Podcast Carousel
   ----------------------------------------------------------------------- */
(function () {
  const fan = document.querySelector('.s7__fan');
  if (!fan) return;

  const copy      = document.querySelector('.s7__copy');
  const episodeEl = document.querySelector('.s7__episode');
  const labelEl   = document.querySelector('.s7__card-label');

  const cardEls = [...fan.querySelectorAll('.s7__card')];
  const N = cardEls.length; // 5

  // Slot geometry in Figma px units (slot index 0..4 = pos −2..+2)
  const WIDTHS  = [140, 160, 500, 160, 140]; // 140+10+160+10+500+10+160+10+140 = 1140
  const HEIGHTS = [100, 116, 356, 116, 100];
  const GAP     = 10;

  // Precompute left offset for each slot (activated cascade)
  const LEFTS = WIDTHS.reduce((acc, w, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + WIDTHS[i - 1] + GAP);
    return acc;
  }, []); // [0, 165, 350, 560, 745]
  const CONTAINER_W = LEFTS[4] + WIDTHS[4]; // 900

  // Uniform state — equal widths, slightly descending heights toward edges
  const UNIFORM_W       = 220; // 5×220 + 4×10 = 1140 exactly
  const UNIFORM_HEIGHTS = [88, 104, 116, 104, 88];
  const UNIFORM_LEFTS   = [0, 1, 2, 3, 4].map(i => i * (UNIFORM_W + GAP));

  const getU = () => Math.min(window.innerWidth / 1440, window.innerHeight / 900);

  // Inject a play button into every card
  cardEls.forEach(card => {
    const btn = document.createElement('button');
    btn.className = 's7__play';
    btn.setAttribute('aria-label', 'Play podcast episode');
    btn.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon points="6,3 20,12 6,21"/></svg>';
    card.appendChild(btn);
  });

  // slotOf[i] = current slot index (0–4) of cardEls[i]
  let slotOf = [0, 1, 2, 3, 4];
  let busy = false;
  let activated = false; // is-center suppressed until first click

  function updateCopyState() {
    const centerIdx  = slotOf.findIndex(s => s === 2);
    const centerCard = cardEls[centerIdx];
    copy.classList.add('is-activated');
    if (episodeEl) episodeEl.textContent = centerCard.dataset.title || '';
    if (labelEl) {
      labelEl.innerHTML = (centerCard.dataset.label || '').replace(' × ', '<br>');
      labelEl.classList.add('is-visible');
    }
  }

  function place(card, slot, instant) {
    const pu = getU();
    if (instant) { card.style.transition = 'none'; card.offsetHeight; }
    card.style.left   = ((activated ? LEFTS[slot]    : UNIFORM_LEFTS[slot]) * pu) + 'px';
    card.style.width  = ((activated ? WIDTHS[slot]   : UNIFORM_W)           * pu) + 'px';
    card.style.height = ((activated ? HEIGHTS[slot]  : UNIFORM_HEIGHTS[slot]) * pu) + 'px';
    if (activated) card.classList.toggle('is-center', slot === 2);
    if (instant) card.offsetHeight;
  }

  // Initial placement with no animation
  slotOf.forEach((slot, i) => place(cardEls[i], slot, true));
  requestAnimationFrame(() => cardEls.forEach(c => c.style.transition = ''));

  function shiftTo(clickedIdx) {
    if (busy) return;
    const clickedSlot = slotOf[clickedIdx];
    if (clickedSlot === 2) {
      if (!activated) {
        activated = true;
        // Animate all cards from uniform to cascade sizes; centre gets the play button
        slotOf.forEach((slot, i) => place(cardEls[i], slot, false));
        updateCopyState();
      }
      return;
    }

    busy = true;
    activated = true;
    setTimeout(() => { busy = false; }, 620);

    const delta     = clickedSlot - 2;
    const newSlotOf = slotOf.map(s => ((s - delta) % N + N) % N);
    const pu        = getU();

    cardEls.forEach((card, i) => {
      const rawNew  = slotOf[i] - delta;
      const newSlot = newSlotOf[i];

      if (rawNew < 0) {
        // Was left of visible range → wrap: appear from the right edge
        card.style.transition = 'none';
        card.offsetHeight;
        card.style.left   = ((CONTAINER_W + GAP) * pu) + 'px';
        card.style.width  = (WIDTHS[newSlot]  * pu) + 'px';
        card.style.height = (HEIGHTS[newSlot] * pu) + 'px';
        card.classList.toggle('is-center', newSlot === 2);
        card.offsetHeight;
        requestAnimationFrame(() => {
          card.style.transition = '';
          card.style.left = (LEFTS[newSlot] * pu) + 'px';
        });
      } else if (rawNew >= N) {
        // Was right of visible range → wrap: appear from the left edge
        card.style.transition = 'none';
        card.offsetHeight;
        card.style.left   = ((-WIDTHS[newSlot] - GAP) * pu) + 'px';
        card.style.width  = (WIDTHS[newSlot]  * pu) + 'px';
        card.style.height = (HEIGHTS[newSlot] * pu) + 'px';
        card.classList.toggle('is-center', newSlot === 2);
        card.offsetHeight;
        requestAnimationFrame(() => {
          card.style.transition = '';
          card.style.left = (LEFTS[newSlot] * pu) + 'px';
        });
      } else {
        // Normal slide — CSS transition handles it
        place(card, newSlot, false);
      }
    });

    slotOf = newSlotOf;
    updateCopyState();
  }

  function deactivate() {
    if (!activated) return;
    busy = false;
    activated = false;
    copy.classList.remove('is-activated');
    if (episodeEl) episodeEl.textContent = '';
    if (labelEl) { labelEl.textContent = ''; labelEl.classList.remove('is-visible'); }
    cardEls.forEach(c => c.classList.remove('is-center'));
    slotOf.forEach((slot, i) => place(cardEls[i], slot, false));
    requestAnimationFrame(() => cardEls.forEach(c => c.style.transition = ''));
  }

  cardEls.forEach((card, i) => card.addEventListener('click', () => shiftTo(i)));

  document.querySelector('.s7').addEventListener('click', e => {
    if (!e.target.closest('.s7__card')) deactivate();
  });

  // Re-place on resize (instant, no animation)
  window.addEventListener('resize', () => {
    slotOf.forEach((slot, i) => place(cardEls[i], slot, true));
    requestAnimationFrame(() => cardEls.forEach(c => c.style.transition = ''));
  });
})();

