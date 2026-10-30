/* ==========================================================================
   Beyond Concrete — homepage prototype
   One fixed 1440×900 stage. Each "scroll" is a .scene; a wheel gesture,
   swipe or arrow key moves one scene at a time with a transition.
   ========================================================================== */
(() => {
  'use strict';

  const DESIGN_W = 1440;
  const DESIGN_H = 900;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const stage = document.getElementById('stage');
  const sceneEls = [...stage.querySelectorAll('.scene')];

  /* ---------- fit the canvas to the window ----------
     Scale so the 1440×900 design fits, then grow the canvas in design px to
     fill the rest of the window (wider screens get a wider canvas, taller ones
     a taller canvas). Edge-anchored pieces stick to their edge; centred
     compositions sit in a 1440×900 frame offset by --ox / --oy. */
  const layout = { W: DESIGN_W, H: DESIGN_H, ox: 0, oy: 0 };
  const layoutListeners = [];
  function fitStage() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const s = Math.min(vw / DESIGN_W, vh / DESIGN_H);
    layout.W = vw / s;
    layout.H = vh / s;
    layout.ox = (layout.W - DESIGN_W) / 2;
    layout.oy = (layout.H - DESIGN_H) / 2;
    stage.style.setProperty('--scale', s);
    stage.style.setProperty('--W', layout.W + 'px');
    stage.style.setProperty('--H', layout.H + 'px');
    stage.style.setProperty('--ox', layout.ox + 'px');
    stage.style.setProperty('--oy', layout.oy + 'px');
    layoutListeners.forEach((fn) => fn());
  }
  window.addEventListener('resize', fitStage);
  fitStage();

  /* ---------- split [data-split] text into word spans ---------- */
  function splitWords(root) {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement('span');
            s.className = 'w';
            s.style.setProperty('--i', i++);
            s.textContent = part;
            frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === Node.ELEMENT_NODE && n.tagName !== 'BR') {
          walk(n);
        }
      });
    };
    walk(root);
  }
  stage.querySelectorAll('[data-split]').forEach(splitWords);

  /* ==========================================================================
     Scroll 1 · looping answers
     ========================================================================== */
  const answers = {
    els: [...stage.querySelectorAll('.s1-answer')],
    index: 0,
    timer: null,
    HOLD_MS: 2800,          // time each answer stays on screen

    next() {
      const cur = this.els[this.index];
      this.index = (this.index + 1) % this.els.length;
      const nxt = this.els[this.index];
      cur.classList.remove('is-current');
      cur.classList.add('is-leaving');
      setTimeout(() => cur.classList.remove('is-leaving'), 900);
      nxt.classList.add('is-current');
    },
    start() {
      this.stop();
      if (reduceMotion) return;
      this.timer = setInterval(() => this.next(), this.HOLD_MS);
    },
    stop() {
      clearInterval(this.timer);
      this.timer = null;
    },
  };

  /* ==========================================================================
     Scroll 3 · ring of project cards
     Geometry from the Figma frames (design px):
       ring centre (720, 497), half-width 301.5, half-height 258
       path is a slightly squared ellipse (superellipse, n = 2.85) so the
       diagonal cards land where they sit in the reference
       card A: 115 along the ring × 160 toward the centre
       card B: 202 along the ring × 116 toward the centre
     Every loop step turns the ring 45°, i.e. one card slot.
     ========================================================================== */
  const ring = (() => {
    const CFG = {
      cx: 720, cy: 497, rx: 301.5, ry: 258, n: 2.85,
      stepDeg: 45,
      stepMs: 1700,          // duration of one 45° turn
      holdMs: 1600,          // pause between turns
      direction: 1,          // 1 = clockwise, -1 = anticlockwise
    };
    const SHAPES = [
      { w: 115, h: 160 },    // A — at top/right/bottom/left in the first frame
      { w: 202, h: 116 },    // B — on the diagonals in the first frame
    ];
    // Drop project image URLs in here later; empty = grey placeholder.
    const IMAGES = ['', '', '', '', '', '', '', ''];

    const container = document.getElementById('ring');
    const cards = [];

    for (let i = 0; i < 8; i++) {
      const el = document.createElement('div');
      el.className = 'card';
      const s = SHAPES[i % 2];
      el.style.width = s.w + 'px';
      el.style.height = s.h + 'px';
      el.style.marginLeft = -s.w / 2 + 'px';
      el.style.marginTop = -s.h / 2 + 'px';
      if (IMAGES[i]) el.style.backgroundImage = `url("${IMAGES[i]}")`;
      container.appendChild(el);
      cards.push({ el, base: -90 + 45 * i, p: 0, tween: null });
    }

    const ease = {
      outQuart: (t) => 1 - Math.pow(1 - t, 4),
      inCubic: (t) => t * t * t,
      inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    };

    function pointOnPath(deg) {
      CFG.cx = layout.W / 2;
      CFG.cy = 497 + layout.oy;
      const t = (deg * Math.PI) / 180;
      const c = Math.cos(t), s = Math.sin(t), e = 2 / CFG.n;
      return [
        CFG.rx * Math.sign(c) * Math.pow(Math.abs(c), e),
        CFG.ry * Math.sign(s) * Math.pow(Math.abs(s), e),
      ];
    }

    // rotation state
    let offset = 0;
    let spinning = false;
    let spinStart = 0;
    let spinBase = 0;

    // overall ring opacity (used for the fade into scroll 4)
    let alpha = 1;
    let alphaTween = null;

    function currentSpinOffset(now) {
      const period = CFG.holdMs + CFG.stepMs;
      const elapsed = now - spinStart;
      const k = Math.floor(elapsed / period);
      const phase = elapsed - k * period;
      const f = phase < CFG.holdMs ? 0 : ease.inOutCubic((phase - CFG.holdMs) / CFG.stepMs);
      return spinBase + CFG.direction * CFG.stepDeg * (k + f);
    }

    function tweenCard(card, to, dur, delay, easing, now) {
      card.tween = { from: card.p, to, start: now + delay, dur, easing };
    }

    function render(now) {
      if (spinning) offset = currentSpinOffset(now);
      if (alphaTween) {
        const t = Math.min(1, Math.max(0, (now - alphaTween.start) / alphaTween.dur));
        alpha = alphaTween.from + (alphaTween.to - alphaTween.from) * ease.inOutCubic(t);
        if (t >= 1) alphaTween = null;
      }

      for (const card of cards) {
        const tw = card.tween;
        if (tw) {
          const t = Math.min(1, Math.max(0, (now - tw.start) / tw.dur));
          card.p = tw.from + (tw.to - tw.from) * tw.easing(t);
          if (t >= 1) card.tween = null;
        }
        const p = card.p;
        const swirl = (1 - p) * -40;              // cards sweep in along the ring
        const spread = 1 + (1 - p) * 0.35;        // …from slightly further out
        const a = card.base + offset + swirl;
        const [x, y] = pointOnPath(a);
        const sc = 0.88 + 0.12 * p;
        card.el.style.opacity = (p * alpha).toFixed(3);
        card.el.style.transform =
          `translate(${CFG.cx + x * spread}px, ${CFG.cy + y * spread}px) rotate(${a + 90}deg) scale(${sc})`;
      }
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    return {
      enter(dir) {
        const now = performance.now();
        const landed = cards.every((c) => c.p > 0.99);
        // coming back from scroll 4: the ring never left, it only faded — fade it back
        if (dir < 0 && landed) {
          alphaTween = { from: alpha, to: 1, start: now + 250, dur: reduceMotion ? 1 : 1000 };
          return;
        }
        alpha = 1;
        alphaTween = null;
        cards.forEach((c) => { c.p = 0; c.tween = null; });
        // settle on a whole slot so the entry always resolves to a frame from the refs
        offset = Math.round(offset / CFG.stepDeg) * CFG.stepDeg;
        spinBase = offset;
        if (reduceMotion) {
          cards.forEach((c) => { c.p = 1; });
          return;
        }
        cards.forEach((c, i) => tweenCard(c, 1, 1400, 450 + i * 70, ease.outQuart, now));
        spinning = true;
        spinStart = now + 450 + 7 * 70 + 600;   // begin turning once all cards have landed
      },
      leave(dir) {
        const now = performance.now();
        // on to scroll 4: fade out in place while still turning
        if (dir > 0) {
          alphaTween = { from: alpha, to: 0, start: now, dur: reduceMotion ? 1 : 1300 };
          return;
        }
        if (spinning) offset = currentSpinOffset(now);
        spinning = false;
        cards.forEach((c, i) => tweenCard(c, 0, reduceMotion ? 1 : 650, i * 25, ease.inCubic, now));
      },
    };
  })();

  /* ==========================================================================
     Scrolls 4–8 · the chapter
     Scroll 4 (index 3): ring fades, "Made to Matter" in, bars rise from the
       bottom (Engineering first), then the copy changes to "Beyond the walls".
     Scrolls 5–8 (index 4–7): one category per scroll wipes left, led by a
       black line; each finished panel leaves a labelled strip on the left.
     ========================================================================== */
  const chapter = (() => {
    const FIRST = 3;                 // scene index of scroll 4
    const WALLS_AFTER_MS = 2700;     // "Made to Matter" → "Beyond the walls"
    const WIPE_MS = 1600;

    const root = document.getElementById('chapter');
    const matter = root.querySelector('.ch-matter');
    const walls = root.querySelector('.ch-walls');
    const cats = [...root.querySelectorAll('.cat')].map((el) => ({ el, up: false, open: false }));
    root.style.setProperty('--wipe-ms', WIPE_MS + 'ms');

    let wallsTimer = null;

    function showWalls() {
      clearTimeout(wallsTimer);
      if (matter.classList.contains('is-shown')) {
        matter.classList.remove('is-shown');
        matter.classList.add('is-gone');
      }
      walls.classList.add('is-shown');
    }
    function hideAll() {
      clearTimeout(wallsTimer);
      matter.classList.remove('is-shown', 'is-gone');
      walls.classList.remove('is-shown');
    }

    function set(scene, prev) {
      // copy
      if (scene < FIRST) {
        hideAll();
      } else if (scene === FIRST && prev < FIRST) {
        walls.classList.remove('is-shown');
        matter.classList.remove('is-gone');
        matter.classList.add('is-shown');
        clearTimeout(wallsTimer);
        wallsTimer = setTimeout(showWalls, reduceMotion ? 800 : WALLS_AFTER_MS);
      } else if (scene > FIRST) {
        showWalls();
      }

      // bars / panels
      const k = scene - (FIRST + 1);          // which category is current (-1 = none)
      cats.forEach((c, i) => {
        const up = scene >= FIRST;
        const open = i <= k;
        const stacked = i < k;

        if (up !== c.up) {
          // rise right-to-left (Engineering first); drop left-to-right
          const d = up ? 350 + (cats.length - 1 - i) * 110 : i * 60;
          c.el.style.setProperty('--rise-delay', d + 'ms');
          c.el.classList.toggle('is-up', up);
          c.up = up;
        }
        if (open !== c.open) {
          c.el.classList.add('is-wiping');
          clearTimeout(c.wipeTimer);
          c.wipeTimer = setTimeout(() => c.el.classList.remove('is-wiping'), WIPE_MS - 150);
          c.el.classList.toggle('is-open', open);
          c.open = open;
        }
        c.el.classList.toggle('is-stacked', stacked);
      });
    }

    return { set };
  })();

  /* ==========================================================================
     Scrolls 9–12 + footer
     Scroll 9 (index 8): a black line enters from the right and pushes the
       chapter out to the left (stage --cx), stopping as the centre divider.
     Scrolls 10–12 + footer: one tall page on a track, moved a screen at a time.
     ========================================================================== */
  const page = (() => {
    const SPLIT = 8;
    const FOOTER = 12;
    // track offset per scene (footer is 450 tall, so the last step is half a screen)
    const FOOTER_H = 450;
    const offsetFor = (scene) => {
      const H = layout.H;
      return { 8: 0, 9: H, 10: 2 * H, 11: 3 * H, 12: 3 * H + FOOTER_H }[scene] ?? 0;
    };
    let lastScene = -1;

    const track = document.getElementById('track');
    const sections = [...track.querySelectorAll('.tsec')];
    const split = document.getElementById('split');
    const footer = document.getElementById('footer');
    let readyTimer = null;

    function set(scene, prev) {
      const inPage = scene >= SPLIT;
      stage.classList.toggle('is-split', inPage);
      track.classList.toggle('is-shown', inPage);
      lastScene = scene;
      track.style.transform = `translateY(${-(inPage ? offsetFor(scene) : 0)}px)`;

      // a section plays its reveal when it arrives, and stays revealed while it
      // is still on screen (its own scroll and the next one)
      sections.forEach((sec) => {
        const at = Number(sec.dataset.at);
        const on = scene === at || scene === at + 1;
        if (on && !sec.classList.contains('is-in')) {
          // split waits for the line to arrive; others start as they scroll up
          const delay = sec === split && prev < SPLIT ? 1.35 : 0.35;
          sec.style.setProperty('--in-delay', delay + 's');
        }
        sec.classList.toggle('is-in', on);
      });

      footer.classList.toggle('is-in', scene === FOOTER);
      stage.classList.toggle('at-footer', scene === FOOTER);

      // split hover only once the divider has settled
      clearTimeout(readyTimer);
      split.classList.remove('is-ready', 'hover-left', 'hover-right');
      if (scene === SPLIT) {
        readyTimer = setTimeout(() => {
          split.classList.add('is-ready');
          if (hoveredSide) split.classList.add('hover-' + hoveredSide);
        }, prev < SPLIT ? 1700 : 600);
      }
    }

    // stack the sections one screen apart; re-run on resize
    function relayout() {
      sections.forEach((sec, i) => { sec.style.top = i * layout.H + 'px'; });
      if (lastScene >= SPLIT) {
        track.style.transition = 'none';
        track.style.transform = `translateY(${-offsetFor(lastScene)}px)`;
        void track.offsetWidth;
        track.style.transition = '';
      }
    }
    layoutListeners.push(relayout);
    relayout();

    // --- split hover ---
    let hoveredSide = null;
    split.querySelectorAll('.sp-panel').forEach((panel) => {
      panel.addEventListener('pointerenter', () => {
        hoveredSide = panel.dataset.side;
        if (!split.classList.contains('is-ready')) return;
        split.classList.remove('hover-left', 'hover-right');
        split.classList.add('hover-' + hoveredSide);
      });
    });
    split.addEventListener('pointerleave', () => {
      hoveredSide = null;
      split.classList.remove('hover-left', 'hover-right');
    });

    // --- scroll 10 carousel: drifts left, eases to a stop on hover ---
    const carousel = document.getElementById('carousel');
    const cards = [...carousel.querySelectorAll('.c-card')];
    const PITCH = 581 + 44;                  // card width + gap
    const LOOP = PITCH * cards.length;
    const SPEED = 28;                        // px per second
    let pos = -71;                           // first card starts cut off at the left, as in the ref
    let velocity = SPEED;
    let paused = false;
    let last = performance.now();

    cards.forEach((card) => {
      card.addEventListener('pointerenter', () => {
        paused = true;
        carousel.classList.add('has-hover');
        card.classList.add('is-hover');
      });
      card.addEventListener('pointerleave', () => {
        paused = false;
        carousel.classList.remove('has-hover');
        card.classList.remove('is-hover');
      });
    });

    function drift(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const target = paused || reduceMotion ? 0 : SPEED;
      velocity += (target - velocity) * Math.min(1, dt * 5);
      pos -= velocity * dt;
      cards.forEach((card, i) => {
        const x = ((((i * PITCH + pos + PITCH) % LOOP) + LOOP) % LOOP) - PITCH;
        card.style.transform = `translateX(${x.toFixed(2)}px)`;
      });
      requestAnimationFrame(drift);
    }
    requestAnimationFrame(drift);

    return { set };
  })();

  /* ==========================================================================
     Scene manager
     ========================================================================== */
  const hooks = {
    0: { enter: () => answers.start(), leave: () => answers.stop() },
    2: { enter: (d) => ring.enter(d), leave: (d) => ring.leave(d) },
  };

  const LOCK_MS = reduceMotion ? 300 : 1500;
  const LOCK_BY_SCENE = { 3: 2000, 8: 1700 };   // scroll 4 and 9 have the longest entrances
  let current = -1;
  let locked = false;

  // Put a scene into its start pose instantly, with no transition.
  function prime(el, cls) {
    el.classList.add('no-anim');
    el.classList.remove('is-active', 'out-next', 'out-prev');
    if (cls) el.classList.add(cls);
    void el.offsetWidth;
    el.classList.remove('no-anim');
  }

  let menuOpen = false;

  function goTo(next, { instant = false } = {}) {
    if (menuOpen) return;
    if (locked || next === current || next < 0 || next >= sceneEls.length) return;
    const dir = next > current ? 1 : -1;
    const to = sceneEls[next];

    if (current >= 0) {
      const from = sceneEls[current];
      from.classList.remove('is-active');
      from.classList.add(dir > 0 ? 'out-next' : 'out-prev');
      hooks[current]?.leave?.(dir);
    }

    // forward: come up from below; backward: come down from above
    prime(to, dir > 0 ? null : 'out-next');
    if (instant) to.classList.add('no-anim');
    requestAnimationFrame(() => {
      to.classList.remove('out-next', 'out-prev');
      to.classList.add('is-active');
      if (instant) requestAnimationFrame(() => to.classList.remove('no-anim'));
    });
    hooks[next]?.enter?.(dir);
    chapter.set(next, current);
    page.set(next, current);

    current = next;
    stage.dataset.scene = current;
    stage.classList.toggle('show-menu', current >= 1);

    locked = true;
    const lockMs = reduceMotion ? LOCK_MS : (LOCK_BY_SCENE[next] ?? LOCK_MS);
    setTimeout(() => { locked = false; }, instant ? 50 : lockMs);
  }

  /* ---------- menu ----------
     Opens when the pointer reaches the hamburger (or on click / Enter), closes
     from the X, Escape, or by choosing a link. */
  const menu = (() => {
    const btn = document.getElementById('menuBtn');
    const panel = document.getElementById('menuPanel');
    let openedAt = 0;

    function set(open) {
      if (open === menuOpen) return;
      menuOpen = open;
      openedAt = performance.now();
      stage.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      panel.setAttribute('aria-hidden', String(!open));
    }

    btn.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') set(true); });
    btn.addEventListener('click', () => {
      // a click right after the hover opened it is part of the same intent — keep it open
      if (menuOpen && performance.now() - openedAt < 700) return;
      set(!menuOpen);
    });
    panel.querySelectorAll('a[data-go]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const target = Number(a.dataset.go);
        set(false);
        setTimeout(() => { locked = false; goTo(target); }, 500);
      });
    });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });

    return { set };
  })();

  /* ---------- input ---------- */

  // One wheel/trackpad gesture = one scene.
  // Wheel input is ignored while a transition runs. Once it has finished, the
  // next *new* gesture moves on — including a new swipe that starts while the
  // previous swipe's momentum is still streaming in. A new gesture is:
  //   · the first event after a short pause, or
  //   · a change of direction, or
  //   · deltas getting bigger again (momentum only ever decays), or
  //   · a steady mouse-wheel notch (large, non-decaying delta).
  const WHEEL = { gapMs: 100, triggerAt: 25 };
  let wheelAcc = 0;
  let lastWheelTime = 0;
  let lastAbs = 0;
  let lastSign = 0;
  let armed = false;

  window.addEventListener('wheel', (e) => {
    e.preventDefault();
    const now = performance.now();
    // normalise line/page deltas (some mice on Firefox/Windows)
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
    const dy = e.deltaY * unit;
    if (dy === 0) return;

    const abs = Math.abs(dy);
    const sign = Math.sign(dy);
    const gap = now - lastWheelTime;

    const isNewGesture =
      gap > WHEEL.gapMs ||
      sign !== lastSign ||
      (abs > lastAbs * 1.3 && abs - lastAbs > 3) ||   // speeding up = fingers are moving again
      (abs >= 40 && abs >= lastAbs);                  // mouse wheel notches don't decay

    lastWheelTime = now;
    lastAbs = abs;
    lastSign = sign;

    if (locked) { armed = false; wheelAcc = 0; return; }
    if (isNewGesture && !armed) { armed = true; wheelAcc = 0; }
    if (!armed) return;

    wheelAcc += dy;
    if (Math.abs(wheelAcc) >= WHEEL.triggerAt) {
      armed = false;
      wheelAcc = 0;
      goTo(current + sign);
    }
  }, { passive: false });

  let touchY = null;
  window.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  window.addEventListener('touchend', (e) => {
    if (touchY === null) return;
    const dy = touchY - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 40) goTo(current + Math.sign(dy));
    touchY = null;
  });

  window.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select')) return;   // typing in the contact form
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); goTo(current + 1); }
    else if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); goTo(current - 1); }
    else if (e.key === 'Home') goTo(0);
    else if (e.key === 'End') goTo(sceneEls.length - 1);
    else if (/^[1-9]$/.test(e.key)) goTo(Number(e.key) - 1);   // prototype shortcut: jump to scroll n
    else if (e.key === '0') goTo(9);                            // …and 0 for scroll 10
  });

  /* ---------- start ---------- */
  // open a specific scroll directly with #3 etc.
  const fromHash = parseInt(location.hash.replace('#', ''), 10);
  const startAt = fromHash >= 1 && fromHash <= sceneEls.length ? fromHash - 1 : 0;

  requestAnimationFrame(() => {
    stage.classList.add('is-ready');
    setTimeout(() => goTo(startAt), 250);
  });
})();
