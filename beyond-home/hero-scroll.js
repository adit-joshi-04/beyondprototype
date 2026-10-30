// script.js — scroll + interaction logic

// --- HERO SCROLL PHASES ---
//
//  0.00 – 0.18   camera dollies in
//  0.06 – 0.18   tagline fades in   (TOWARDS / THOUGHT-LED / DEVELOPMENT)
//  0.18 – 0.28   tagline holds
//  0.28 – 0.35   tagline fades out
//  0.35 – 0.85   stanza sequence (7 stanzas, equal slices)
//  0.85 – 1.00   walls explode
//
// hero-sequence height: 1400vh

const heroSeq       = document.getElementById('hero-sequence');
const taglineEl     = document.getElementById('hero-tagline');
const tagSpans      = taglineEl.querySelectorAll('span');
const heroTextScroll = document.getElementById('hero-text-scroll');

// Phase boundaries (fraction of total scroll)
const P_TAG_IN_END   = 0.18;
const P_TAG_OUT_S    = 0.28;
const P_TAG_OUT_E    = 0.35;
const P_TEXT_START   = 0.35;
const P_TEXT_END     = 0.85;
const P_EXPLODE      = 0.85;
const P_FLY_START    = 0.93; // roof detaches and flies off

function updateHero () {
  const seqTop  = heroSeq.offsetTop;
  const vh      = window.innerHeight;
  const scrolled = window.scrollY - seqTop;

  // Animations complete after 1300vh of scroll — same timing as before.
  // The extra 800vh (total 2200vh section) is a hold phase: house stays
  // exploded, user rotates the cube, label stays visible.
  const animPx = 13 * vh;  // 1300vh
  const holdPx =  8 * vh;  // 800vh hold
  const raw    = Math.max(0, Math.min(1, scrolled / animPx));

  // exitProgress: 0 during animations + hold, ramps 0→1 in the last 400vh
  const exitP  = Math.max(0, Math.min(1, (scrolled - animPx - holdPx * 0.5) / (holdPx * 0.5)));
  window.setHeroExit(exitP);

  // tagline: fade in 0.06→0.18, hold, fade out 0.28→0.35
  const tagIn  = Math.min(1, Math.max(0, (raw - 0.06) / 0.12));
  const tagOut = Math.min(1, Math.max(0, (raw - P_TAG_OUT_S) / (P_TAG_OUT_E - P_TAG_OUT_S)));
  tagSpans.forEach(s => s.style.opacity = tagIn * (1 - tagOut));

  // scroll text: translateY from +100vh (below) to -160vh (above)
  const textP = Math.max(0, Math.min(1, (raw - P_TEXT_START) / (P_TEXT_END - P_TEXT_START)));
  const ty    = 100 - textP * 260;
  heroTextScroll.style.transform = `translateX(-50%) translateY(${ty}vh)`;

  // approach: camera dollies from START → FAR over the full pre-explosion scroll
  const approachP = Math.min(1, raw / P_EXPLODE);
  window.setHeroCameraApproach(approachP);

  // explosion + camera zoom happen together
  const explodeP = Math.max(0, (raw - P_EXPLODE) / (1 - P_EXPLODE));
  window.setHeroExplode(explodeP);
  window.setHeroCameraZoom(explodeP);

  // roof flies off once explosion is well underway
  const flyP = Math.max(0, Math.min(1, (raw - P_FLY_START) / (1 - P_FLY_START)));
  window.setRoofFly(flyP);
}

// --- ABOUT SECTION SCROLL ---

const aboutSection = document.getElementById('about-section');

function updateAbout () {
  const seqTop     = aboutSection.offsetTop;
  const scrollable = aboutSection.offsetHeight - window.innerHeight;
  const raw        = Math.max(0, Math.min(1, (window.scrollY - seqTop) / scrollable));
  window.setWallExpand(raw);
}

// --- SPLIT ENTRANCE ---

const splitPin = document.getElementById('splitPin');
const splitEl  = document.getElementById('split');
const s6El     = document.getElementById('s6');
let splitOpenTimer   = null;
let splitLeaveTimer  = null;
let splitUnlockTimer = null;
let splitEnterSource = null; // 'above' | 'below' — which direction the panels entered from
let prevScrollY      = window.scrollY;

// --- SCROLL LOCK ---
// Prevents the page from scrolling during the 900ms panel entrance/exit animations.
// Without this, fast scrolling lets S6 peek into the viewport while panels are mid-slide.

let scrollLocked = false;

window.addEventListener('wheel', e => {
  if (scrollLocked) e.preventDefault();
}, { passive: false });

window.addEventListener('touchmove', e => {
  if (scrollLocked) e.preventDefault();
}, { passive: false });

// Snap scroll to y and lock. Updates prevScrollY so direction tracking stays consistent.
function lockScrollAt(y) {
  scrollLocked = true;
  window.scrollTo({ top: y, behavior: 'instant' });
  prevScrollY = y;
}

function unlockScroll() {
  scrollLocked = false;
  splitUnlockTimer = null;
}

// Leave animation — snaps to snapTo, locks for 900ms, then unlocks
function triggerSplitLeave(snapTo) {
  if (splitOpenTimer)   { clearTimeout(splitOpenTimer);   splitOpenTimer   = null; }
  if (splitLeaveTimer)  { clearTimeout(splitLeaveTimer);  splitLeaveTimer  = null; }
  if (splitUnlockTimer) { clearTimeout(splitUnlockTimer); splitUnlockTimer = null; }
  lockScrollAt(snapTo);
  splitEl.classList.add('is-leaving');
  splitEl.classList.remove('is-open', 'is-entering', 'hover-left', 'hover-right');
  splitLeaveTimer  = setTimeout(() => splitEl.classList.remove('is-leaving'), 900);
  splitUnlockTimer = setTimeout(unlockScroll, 900);
}

function updateSplit() {
  if (!splitPin || !s6El) return;
  if (scrollLocked) return; // animation gate — let the lock play out

  const scrollY       = window.scrollY;
  const goingDown     = scrollY > prevScrollY;
  prevScrollY         = scrollY;

  // enterAt       — panels enter when scrolling DOWN past here
  // exitForwardAt — S6 top hits viewport top (forward exit, scrolling down)
  // exitReverseAt — S6 fully below viewport (reverse exit, scrolling up)
  const enterAt       = splitPin.offsetTop;
  const exitForwardAt = s6El.offsetTop;
  const exitReverseAt = exitForwardAt - window.innerHeight;

  // Let a leave animation play out uninterrupted
  if (splitEl.classList.contains('is-leaving')) return;

  const isActive = splitEl.classList.contains('is-entering') ||
                   splitEl.classList.contains('is-open');

  if (isActive) {
    if (splitEnterSource === 'above') {
      if (!goingDown && scrollY < enterAt) {
        // Scrolled back above entry — reverse exit, reveal 3D canvas
        splitEnterSource = null;
        triggerSplitLeave(enterAt);
      } else if (goingDown && scrollY >= exitForwardAt) {
        // S6 top hit viewport top — forward exit, reveal S6
        splitEnterSource = null;
        triggerSplitLeave(exitForwardAt);
      }
    } else if (splitEnterSource === 'below') {
      if (!goingDown && scrollY < exitReverseAt) {
        // S6 fully off bottom of viewport — reverse exit, reveal 3D canvas
        splitEnterSource = null;
        triggerSplitLeave(exitReverseAt);
      } else if (goingDown && scrollY >= exitForwardAt) {
        // Scrolled back down past S6 top — forward exit
        splitEnterSource = null;
        triggerSplitLeave(exitForwardAt);
      }
    }
  } else {
    if (goingDown && scrollY >= enterAt && scrollY < exitForwardAt) {
      // Entry from above: scrolling down into the split zone
      // Snap back to enterAt so S6 (200vh below) can't drift into view during the 900ms slide
      lockScrollAt(enterAt);
      splitEnterSource = 'above';
      splitEl.classList.add('is-entering');
      splitOpenTimer = setTimeout(() => {
        splitEl.classList.add('is-open');
        splitOpenTimer = null;
        unlockScroll();
      }, 900);
    } else if (!goingDown && scrollY < exitForwardAt && scrollY > exitReverseAt) {
      // Entry from below: scrolling up from S6, panels cover the transition back
      // Snap to exitForwardAt (S6 top at viewport top) — the invisible snap is covered by panels
      lockScrollAt(exitForwardAt);
      splitEnterSource = 'below';
      splitEl.classList.add('is-entering');
      splitOpenTimer = setTimeout(() => {
        splitEl.classList.add('is-open');
        splitOpenTimer = null;
        unlockScroll();
      }, 900);
    }
  }
}

// --- WALL CLICK ---

document.addEventListener('wall-click', e => {
  console.log('wall clicked:', e.detail.id);
  // hook up section navigation here as sections are added
});

// --- SKIP INTRO ---

const skipIntroEl   = document.getElementById('skip-intro');
const skipIntroLink = document.querySelector('.skip-intro__link');

if (skipIntroEl) {
  window.addEventListener('scroll', () => {
    skipIntroEl.classList.toggle('is-hidden', window.scrollY > 0);
  }, { passive: true });
}

if (skipIntroLink && splitPin) {
  skipIntroLink.addEventListener('click', e => {
    e.preventDefault();
    skipIntroEl && skipIntroEl.classList.add('is-hidden');

    // 1. Lock scroll at current position so nothing moves yet
    scrollLocked = true;

    // 2. Trigger panel entrance immediately — panels slide in over the 3D hero
    splitEnterSource = 'above';
    if (splitOpenTimer) { clearTimeout(splitOpenTimer); splitOpenTimer = null; }
    splitEl.classList.remove('is-leaving', 'is-open');
    splitEl.classList.add('is-entering');

    // 3. Once panels fully cover the viewport, instant-jump underneath them
    splitOpenTimer = setTimeout(() => {
      window.scrollTo({ top: splitPin.offsetTop, behavior: 'instant' });
      prevScrollY = splitPin.offsetTop;
      splitEl.classList.add('is-open');
      splitOpenTimer = null;
      unlockScroll();
    }, 900);
  });
}

// --- SINGLE SCROLL LISTENER ---

window.addEventListener('scroll', () => {
  updateHero();
  updateAbout();
  updateSplit();
}, { passive: true });

// init
updateHero();
updateAbout();
updateSplit();
