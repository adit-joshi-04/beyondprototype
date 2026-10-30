// text-repel.js — hero stanza text parts around the 3D house (ref: gionatannese.com/about)
//
// Pretext (github.com/chenglou/pretext) lays the copy out into lines without DOM
// reflow. Each line is split at the word gap nearest its middle; every frame the
// halves slide apart just enough to clear the house's projected silhouette
// (window.__houseScreen, published by hero3d.js), then ease back once it passes.

const FONT        = '16px Georgia, "Times New Roman", serif'; // keep in sync with #hero-text-scroll p
const LINE_H      = 27.2;   // 16px × 1.7
const PARA_GAP    = 32;     // p margin-bottom
const COL_W       = 440;    // #hero-text-scroll width
const PAD_X       = 26;     // breathing room beside the house (px)
const PAD_Y       = 14;     // extra reach above/below the house (px)
const EASE        = 0.16;   // how quickly lines follow (0–1)

// ---------- text measurement: Pretext, with a canvas fallback ----------
let PT = null;
for (const url of ['https://cdn.jsdelivr.net/npm/@chenglou/pretext/+esm', 'https://esm.sh/@chenglou/pretext']) {
  try { PT = await import(url); if (PT?.prepareWithSegments) break; PT = null; } catch (e) { PT = null; }
}

const ctx = document.createElement('canvas').getContext('2d');
ctx.font = FONT;

function measure (text) {
  if (!text) return 0;
  if (PT) return PT.measureNaturalWidth(PT.prepareWithSegments(text, FONT));
  return ctx.measureText(text).width;
}

function wrap (text) {
  if (PT) return PT.layoutWithLines(PT.prepareWithSegments(text, FONT), COL_W, LINE_H).lines.map(l => l.text.trim());
  const out = []; let line = '';
  for (const w of text.split(/\s+/)) {
    const next = line ? line + ' ' + w : w;
    if (line && ctx.measureText(next).width > COL_W) { out.push(line); line = w; } else line = next;
  }
  if (line) out.push(line);
  return out;
}

// ---------- build lines ----------
const scroller = document.getElementById('hero-text-scroll');
const source   = scroller.querySelector('.repel-source');
const lines    = [];
let y = 0;

source.querySelectorAll('p').forEach((p, pi, all) => {
  // hard breaks (<br>) become separate source lines
  const chunks = p.innerHTML.split(/<br\s*\/?>/i).map(h => {
    const d = document.createElement('div'); d.innerHTML = h; return d.textContent.replace(/\s+/g, ' ').trim();
  }).filter(Boolean);

  chunks.forEach(chunk => wrap(chunk).forEach(text => {
    const words = text.split(' ');
    const W = measure(text), space = measure('a b') - measure('ab');
    // split at the word gap closest to the line's middle
    let best = { k: 1, d: Infinity };
    for (let k = 1; k < words.length; k++) {
      const d = Math.abs(measure(words.slice(0, k).join(' ')) - W / 2);
      if (d < best.d) best = { k, d };
    }
    const a = words.length > 1 ? words.slice(0, best.k).join(' ') : text;
    const b = words.length > 1 ? words.slice(best.k).join(' ') : '';
    const wA = measure(a);
    const x0 = (COL_W - W) / 2;

    const el = document.createElement('div');
    el.className = 'repel-line';
    el.setAttribute('aria-hidden', 'true');
    el.style.top = y + 'px';
    el.style.width = COL_W + 'px';
    const sa = document.createElement('span'); sa.textContent = a; sa.style.left = x0 + 'px';
    const sb = document.createElement('span'); sb.textContent = b; sb.style.left = (x0 + wA + space) + 'px';
    el.append(sa, sb);
    scroller.appendChild(el);

    lines.push({ y, x0, wA, bStart: x0 + wA + space, single: !b, sa, sb, curA: 0, curB: 0 });
    y += LINE_H;
  }));
  if (pi < all.length - 1) y += PARA_GAP;
});

scroller.style.height = y + 'px';
scroller.classList.add('is-repel');

// ---------- per-frame repel ----------
function frame () {
  requestAnimationFrame(frame);
  const r = scroller.getBoundingClientRect();
  if (r.bottom < -50 || r.top > window.innerHeight + 50) return;   // off screen: nothing to do

  const h = window.__houseScreen;
  const cx = h ? h.cx - r.left : COL_W / 2;

  for (const L of lines) {
    let pushA = 0, pushB = 0;
    if (h) {
      const dy   = (r.top + L.y + LINE_H / 2) - h.cy;
      const reach = h.ry + PAD_Y;
      if (Math.abs(dy) < reach) {
        // elliptical silhouette: half-gap needed at this height
        const g = (h.rx + PAD_X) * Math.sqrt(1 - (dy / reach) ** 2);
        if (L.single) {
          // one-word line: slide the whole word to whichever side is closer
          const mid = L.x0 + L.wA / 2;
          if (mid < cx) pushA = -Math.max(0, (L.x0 + L.wA) - (cx - g));
          else          pushA =  Math.max(0, (cx + g) - L.x0);
        } else {
          pushA = -Math.max(0, (L.x0 + L.wA) - (cx - g));  // left half → left
          pushB =  Math.max(0, (cx + g) - L.bStart);       // right half → right
        }
      }
    }
    L.curA += (pushA - L.curA) * EASE;
    L.curB += (pushB - L.curB) * EASE;
    L.sa.style.transform = `translate3d(${L.curA.toFixed(2)}px,0,0)`;
    L.sb.style.transform = `translate3d(${L.curB.toFixed(2)}px,0,0)`;
  }
}
requestAnimationFrame(frame);
