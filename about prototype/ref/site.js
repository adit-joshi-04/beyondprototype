// ─── Three.js Setup ───────────────────────────────────────────────────────────

const canvas = document.getElementById('three-canvas');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0); // fully transparent — page background shows through

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 0, 5);

// Separate look-at target so GSAP can tween it independently of camera.position
const cameraLookAt = { x: 0, y: 0, z: 0 };

// ─── Lighting ─────────────────────────────────────────────────────────────────

// Soft ambient base
const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambientLight);

// Key light — upper-left-front, creates gentle shadow on right side of box
const keyLight = new THREE.DirectionalLight(0xffffff, 0.55);
keyLight.position.set(-3, 8, 6);
scene.add(keyLight);

// Subtle fill from right-rear to give the side face a slight brightness difference
const fillLight = new THREE.DirectionalLight(0xffffff, 0.18);
fillLight.position.set(5, 2, -4);
scene.add(fillLight);

// ─── Building ─────────────────────────────────────────────────────────────────
//
const building = new THREE.Group();
building.position.set(2.2, -1.3, 0);
building.rotation.y = 0.12 + Math.PI / 2; // slight angle + 90° rotation
scene.add(building);

const buildingMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 6, 1.8),
    new THREE.MeshStandardMaterial({ color: 0xa8a8a8 })
);
building.add(buildingMesh);

// ─── GSAP ─────────────────────────────────────────────────────────────────────

gsap.registerPlugin(ScrollTrigger);

// ─── Hero Element Positioning (all via JS, no CSS text-align) ─────────────────
//
// Using absolute left/top/bottom values so future animations can tween
// positions smoothly — avoids the jarring jump of toggling text-align.

function positionHeroElements() {
    const heroTitle = document.getElementById('hero-title');
    const heroDesc  = document.getElementById('hero-desc');
    const heroLine  = document.getElementById('hero-line');

    // Title: top-left, below header
    heroTitle.style.left   = '45px';
    heroTitle.style.top    = '115px';

    // Description: bottom-left
    heroDesc.style.left    = '45px';
    heroDesc.style.bottom  = '52px';

    // Black line: bottom-centre (placeholder position — will be animated later)
    heroLine.style.left    = '95%';
    // heroLine.style.bottom  = '0px';
}

positionHeroElements();

// ─── Camera Pan + Text — Scroll Animation ────────────────────────────────────
//
// Wrapped in fonts.ready so element widths are correct (font affects them).
// Text slides right until each element's right edge lands at (viewport - margin).
// hero-line translates past the right viewport edge and disappears.

document.fonts.ready.then(() => {
    const heroTitle  = document.getElementById('hero-title');
    const heroDesc   = document.getElementById('hero-desc');
    const heroLine   = document.getElementById('hero-line');
    const sectionTwo    = document.getElementById('section-two');
    const s2Inner       = document.getElementById('s2-inner');
    const s2LinesInner  = document.getElementById('s2-lines-inner');
    const s2TetherLines = document.querySelectorAll('.s2-tether-line');
    const s2Headings    = document.querySelectorAll('.s2-heading');
    const s2Bodies      = document.querySelectorAll('.s2-body');

    const sectionThree = document.getElementById('section-three');
    const s3Left       = document.getElementById('s3-left');
    const s3Right      = document.getElementById('s3-right');
    const sectionFour  = document.getElementById('section-four');
    const s4Accordion  = document.getElementById('s4-accordion');
    const s4Items      = document.querySelectorAll('.s4-item');
    const s4Item0Grey  = s4Items[0].querySelector('.s4-item-grey');
    const sectionSix   = document.getElementById('section-six');
    const sectionSeven = document.getElementById('section-seven');
    const s5Box        = document.getElementById('s5-box');
    const s5Label      = document.getElementById('s5-label');
    const s5TitleTop   = document.getElementById('s5-title-top');
    const s5TitleBot   = document.getElementById('s5-title-bottom');
    const s5Body       = document.getElementById('s5-body');

    // Collapsed row height (px) — enough to show just the label
    const S4_COLLAPSED_H = 64;
    // Active accordion index — shared between onUpdate, onReverseComplete, and hover listeners
    let s4ActiveItem = 0;

    function computeS4ExpandedH() {
        return window.innerHeight - 116 - S4_COLLAPSED_H * (s4Items.length - 1);
    }

    // Initialise heights: item 0 (Clubhouse) expanded, rest collapsed
    s4Items.forEach((item, i) => {
        gsap.set(item, { height: i === 0 ? computeS4ExpandedH() : S4_COLLAPSED_H });
        gsap.set(item.querySelector('.s4-item-grey'), { top: i === 0 ? 0 : S4_COLLAPSED_H });
    });

    // Section Seven — starts off-screen below (same entry pattern as section-six)
    gsap.set(sectionSeven, { y: '100%' });

    // Section Five — starts as a zero-scale point at the viewport centre
    gsap.set(s5Box, { scale: 0, transformOrigin: 'center center' });
    // Perspective baked into each title so fixed stacking context isn't affected
    gsap.set([s5TitleTop, s5TitleBot], { transformPerspective: 900 });

    // ─── Hero Timeline (wheel-triggered) ──────────────────────────────────────
    // Plays once on first scroll, stays in its end state permanently after.

    const rightMargin = 45;
    const lineEndX    = window.innerWidth - heroLine.offsetLeft + 100;

    const heroTl = gsap.timeline({ paused: true });

    heroTl
        .to(camera.position, { x: 7,   y: 0, z: 2,  duration: 1.4, ease: 'power2.inOut' }, 0)
        .to(cameraLookAt,    { x: 4.5, y: 0, z: -1, duration: 1.4, ease: 'power2.inOut' }, 0);

    [...heroTitle.children, ...heroDesc.children].forEach(el => {
        const endX = window.innerWidth - rightMargin - el.getBoundingClientRect().left - el.offsetWidth;
        heroTl.to(el, { x: endX, duration: 1.4, ease: 'power2.inOut' }, 0);
    });

    heroTl.to(heroLine, { x: lineEndX, duration: 1.4, ease: 'power2.inOut' }, 0);

    // ─── Post-Hero Timeline (scroll-progress driven) ───────────────────────────
    //
    // One timeline covers everything after the hero pan.
    // Its progress is tweened by accumulated wheel deltaY — scroll speed
    // directly determines how fast progress advances, no fixed steps.
    //
    // ease: 'none' on every tween — the progress tween provides all smoothing.
    // Double-easing (tween ease × progress ease) creates weird non-linear feels.
    //
    // Timeline layout (total duration = 6.5):
    //   0.0 → 1.5  Phase 1 — camera zooms in, building flattens, hero fades, content fades in
    //   1.5 → 5.0  Phase 2 — camera drifts down the building face, content scrolls
    //   5.0 → 6.5  Phase 3 — canvas + section-two exit upward, section-three enters

    const postHeroTl = gsap.timeline({ paused: true });

    postHeroTl
        // Phase 1 — zoom in
        .to(camera.position,                { x: 3.35, y: 1.12, z: 2.6, duration: 1.5, ease: 'none' }, 0)
        .to(cameraLookAt,                   { x: 3.35, y: 1.12, z: 0.6, duration: 1.5, ease: 'none' }, 0)
        .to(building.rotation,              { y: 0,              duration: 1.5, ease: 'none' }, 0)
        .to([heroTitle, heroDesc, heroLine], { opacity: 0,        duration: 1.0, ease: 'none' }, 0)
        .to(sectionTwo,                     { opacity: 1,        duration: 1.0, ease: 'none' }, 0.5)
        // Phase 2 — camera drifts down building.
        // Both #s2-inner (text) and #s2-lines-inner (tether lines) get the same
        // translateY so lines and headings stay locked to each other.
        .to(camera.position,                { y: -3.5, duration: 3.5, ease: 'none' }, 1.5)
        .to(cameraLookAt,                   { y: -3.5, duration: 3.5, ease: 'none' }, 1.5)
        .to([s2Inner, s2LinesInner], {
            y: () => -(window.innerHeight - 167) * 3,
            duration: 3.5,
            ease: 'none',
        }, 1.5)
        // ─── Reveal animations (line draws → heading → body) ──────────────────
        // Fires as each item's content enters the clip window from below.
        // fromTo ensures clean reversal when scrolling back.
        //
        // Item 1 — reveals as section-two fades in (t=0.7)
        .fromTo(s2TetherLines[0], { scaleX: 0 }, { scaleX: 1, duration: 0.25, ease: 'none' }, 0.7)
        .fromTo(s2Headings[0],    { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'none' }, 0.85)
        .fromTo(s2Bodies[0],      { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'none' }, 0.95)
        // Item 2 — content enters clip bottom at t≈2.08, reveal starts at t=2.0
        .fromTo(s2TetherLines[1], { scaleX: 0 }, { scaleX: 1, duration: 0.25, ease: 'none' }, 2.0)
        .fromTo(s2Headings[1],    { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'none' }, 2.15)
        .fromTo(s2Bodies[1],      { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'none' }, 2.25)
        // Item 3 — content enters clip bottom at t≈3.25, reveal starts at t=3.15
        .fromTo(s2TetherLines[2], { scaleX: 0 }, { scaleX: 1, duration: 0.25, ease: 'none' }, 3.15)
        .fromTo(s2Headings[2],    { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'none' }, 3.3)
        .fromTo(s2Bodies[2],      { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'none' }, 3.4)
        // Item 4 — content enters clip bottom at t≈4.42, reveal starts at t=4.3
        .fromTo(s2TetherLines[3], { scaleX: 0 }, { scaleX: 1, duration: 0.25, ease: 'none' }, 4.3)
        .fromTo(s2Headings[3],    { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'none' }, 4.45)
        .fromTo(s2Bodies[3],      { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'none' }, 4.55)
        // ─── Phase 3 — canvas + section-two exit upward, section-three enters ──
        // Both fixed elements slide up by one full viewport height over 1.5 units.
        // s3EntryTl fires separately via onUpdate (not scrubbed) once threshold is crossed.
        .fromTo([sectionTwo, canvas], { y: 0 }, { y: -window.innerHeight, duration: 1.5, ease: 'none' }, 5)
        .to({}, { duration: 1.5 }, 6.5); // pads to t=8.0 for s4 trigger window

    // Phase 5 — section-four elements split apart, section-five grey box expands from centre.
    // Label wraps + right columns exit right; grey boxes exit left; s5-box scales up from centre.
    const s4LineTop = document.getElementById('s4-line-top');

    postHeroTl
        .fromTo(s4Items,   { x: 0 }, { x:  window.innerWidth, duration: 1.5, ease: 'none' }, 10.0)
        .fromTo(s4LineTop, { x: 0 }, { x:  window.innerWidth, duration: 1.5, ease: 'none' }, 10.0)
        .fromTo(s5Box,     { scale: 0 }, { scale: 1, duration: 3.0, ease: 'none' }, 11.1)
        // Text appears when s5-box reaches 5% scale (t = 11.1 + 0.05*3.0 = 11.25)
        .fromTo([s5TitleTop, s5TitleBot, s5Body],
            { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'none' }, 11.25)
        // 3D flip — top title rotates upward, bottom rotates downward.
        // Starts when box hits ~43% scale (t=12.4), runs to timeline end (t=14.1).
        // rotateX negative = top edge goes back into screen (flips up).
        // rotateX positive = bottom edge goes back into screen (flips down).
        .fromTo(s5TitleTop, { rotateX: 0, y: 0 }, { rotateX:  85, y: -70, opacity: 0, duration: 1.0, ease: 'none' }, 12.4)
        .fromTo(s5TitleBot, { rotateX: 0, y: 0 }, { rotateX: -85, y:  70, opacity: 0, duration: 1.0, ease: 'none' }, 12.4)
        .to({}, { duration: 2.4 }, 14.1) // pads to t=16.5 for s6 dwell window
        .to({}, { duration: 2.0 }, 16.5); // pads to t=18.5 for footer dwell

    // ─── Section Three Entry Timeline ─────────────────────────────────────────
    //
    // Plays once (not scrubbed) when phase 3 threshold is crossed.
    // fromTo on both panels ensures clean reversal when scrolling back up.
    // Header chrome fades simultaneously so the s3 brand mark takes over.

    gsap.set(s3Left,  { x: '-100%' });
    gsap.set(s3Right, { x:  '100%' });

    const s3EntryTl = gsap.timeline({ paused: true });
    s3EntryTl
        .fromTo(s3Left,  { x: '-100%' }, { x: 0, duration: 0.85, ease: 'power2.out' }, 0)
        .fromTo(s3Right, { x:  '100%' }, { x: 0, duration: 0.85, ease: 'power2.out' }, 0);

    // Re-hide once fully reversed off-screen.
    // Guard with !s3Triggered so a fast re-scroll forward doesn't hide it mid-entry.
    s3EntryTl.eventCallback('onReverseComplete', () => {
        if (!s3Triggered) gsap.set(sectionThree, { visibility: 'hidden' });
    });

    // ─── Section Four Entry Timeline ──────────────────────────────────────────
    //
    // #s3-right IS the grey box — the same element moves from the right panel
    // to the center clip position. No new box is created.
    //
    // Before play():
    //   - section-three is raised to z-index 4 so both s3-right (grey box) and
    //     s3-left (text) remain visible above section-four's white backdrop.
    //   - s3-right is taken out of flex flow with position:fixed, locked to its
    //     current visual position (left:50%, right:0, top:0, bottom:0), then
    //     animated to the center clip bounds (left:28%, right:28%, top:116px,
    //     bottom:28vh). width:auto and height:auto let left+right+top+bottom
    //     fully define the box so the inherited CSS width/height don't conflict.
    //   - section-four (z-index 3) provides the white backdrop and new text.
    //
    // On reverse: all tweens wind back, then onReverseComplete clears the inline
    // styles from s3-right (restoring it to its flex-child state) and resets
    // stacking order.

    // ─── Section Four Entry Timeline ──────────────────────────────────────────
    //
    // s3-right (grey box) moves from the right panel to the center strip, aligning
    // with the first accordion item's grey box position. The accordion fades in on
    // top of it, then s3-right fades out — seamless because they share the same
    // colour and position. s3-left exits left simultaneously.

    const s4EntryTl = gsap.timeline({ paused: true });
    const s4BottomClip = S4_COLLAPSED_H * (s4Items.length - 1); // 192px — area items 1-3 occupy
    s4EntryTl
        // s3-right moves to center strip (position/size only — bottom and opacity handled separately)
        .fromTo(s3Right,
            { top: 0, left: '50%', right: 0 },
            { top: 116, left: '28%', right: '28%',
              duration: 0.85, ease: 'power2.out' }, 0)
        .fromTo(s3Left,
            { x: 0 },
            { x: '-100%', duration: 0.85, ease: 'power2.out' }, 0)
        // item 0 slides in from right (text/label — grey is handled by s3-right)
        .fromTo(s4Items[0],
            { x: window.innerWidth },
            { x: 0, duration: 0.85, ease: 'power2.out' }, 0)
        // items 1-3 rise from below; clip-path on s3-right tracks the same distance+easing
        // so s3-right's bottom edge and items' top edge are always at the same position
        .fromTo(Array.from(s4Items).slice(1),
            { y: s4BottomClip },
            { y: 0, duration: 0.85, ease: 'power2.out' }, 0)
        .fromTo(s3Right,
            { clipPath: 'inset(0 0 0px 0)' },
            { clipPath: `inset(0 0 ${s4BottomClip}px 0)`, duration: 0.85, ease: 'power2.out' }, 0)
        // once items are in place and clip is done, fade s3-right out and reveal item 0 grey
        .fromTo(s3Right, { opacity: 1 }, { opacity: 0, duration: 0.2, ease: 'power2.in' }, 0.85)
        .fromTo(s4Item0Grey, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.in' }, 0.85);

    s4EntryTl.eventCallback('onReverseComplete', () => {
        if (!s4Triggered) {
            // Restore s3-right to its original flex-child state.
            gsap.set(s3Right, { clearProps: 'position,top,left,right,bottom,width,height,opacity,clipPath' });
            gsap.set(s4Items, { clearProps: 'x,y' });
            gsap.set(s4Item0Grey, { clearProps: 'opacity' });
            gsap.set(sectionThree, { zIndex: 2 });
            gsap.set(sectionFour,  { visibility: 'hidden' });
            // Reset accordion to Clubhouse-open state for next entry
            s4Items.forEach((item, i) => {
                gsap.set(item, { height: i === 0 ? computeS4ExpandedH() : S4_COLLAPSED_H });
                gsap.set(item.querySelector('.s4-item-grey'), { top: i === 0 ? 0 : S4_COLLAPSED_H });
            });
            s4ActiveItem = 0;
        }
    });

    // ─── Section Six Entry Timeline ───────────────────────────────────────────
    //
    // Slides up from below once the grey box has filled the viewport.
    // Same play/reverse pattern as s3 and s4.

    gsap.set(sectionSix, { y: '100%' });

    const s6EntryTl = gsap.timeline({ paused: true });
    s6EntryTl
        .fromTo(sectionSix, { y: '100%' }, { y: 0, duration: 0.85, ease: 'power2.out' }, 0);

    s6EntryTl.eventCallback('onReverseComplete', () => {
        if (!s6Triggered) gsap.set(sectionSix, { visibility: 'hidden' });
    });

    // ─── Section Seven Entry Timeline ─────────────────────────────────────────
    //
    // Section-six exits upward while section-seven rises from below — a clean
    // page-swap (no overlay). toggling .is-in on #section-seven starts the CSS
    // --fw transition that sweeps the black panel left→right.

    const s7EntryTl = gsap.timeline({ paused: true });
    s7EntryTl
        .fromTo(sectionSix,   { y: 0 },      { y: '-100%', duration: 0.85, ease: 'power2.inOut' }, 0)
        .fromTo(sectionSeven, { y: '100%' }, { y: 0,        duration: 0.85, ease: 'power2.out'   }, 0);

    s7EntryTl.eventCallback('onReverseComplete', () => {
        if (!s7Triggered) gsap.set(sectionSeven, { visibility: 'hidden' });
    });

    // Trigger thresholds (t = postScroll / 400, ratio kept at 400 deltaY per timeline unit).
    let s3Triggered = false;
    let s4Triggered = false;
    let s6Triggered = false;
    let s7Triggered = false;
    const POST_TOTAL_DURATION = 18.5; // postHeroTl total duration (padded to t=18.5 for footer)
    const S3_TRIGGER_T = 5.5;        // timeline-time at which s3 panels enter
    const S4_TRIGGER_T = 7.5;        // timeline-time at which s4 enters (after s3 has dwelled)
    const S6_TRIGGER_T = 14.5;       // timeline-time at which s6 slides in (after grey box fills)
    const S7_TRIGGER_T = 16.0;       // timeline-time at which footer slides in (after s6 dwell)

    postHeroTl.eventCallback('onUpdate', () => {
        const t = postHeroTl.progress() * POST_TOTAL_DURATION;
        if (t >= S3_TRIGGER_T && !s3Triggered) {
            s3Triggered = true;
            // Snap panels to off-screen before visibility flips — eliminates the
            // one-frame flash caused by GSAP's RAF delay on play().
            gsap.set(s3Left,  { x: '-100%' });
            gsap.set(s3Right, { x:  '100%' });
            gsap.set(sectionThree, { visibility: 'visible' });
            s3EntryTl.play();
        } else if (t < S3_TRIGGER_T && s3Triggered) {
            s3Triggered = false;
            s3EntryTl.reverse();
        }
        if (t >= S4_TRIGGER_T && !s4Triggered) {
            s4Triggered = true;
            gsap.set(sectionThree, { zIndex: 4 });
            gsap.set(s3Right, { position: 'fixed', top: 0, left: '50%', right: 0, bottom: 0,
                                width: 'auto', height: 'auto', clipPath: 'inset(0 0 0px 0)' });
            // Reset accordion to default state (Clubhouse open) before the entry plays
            s4Items.forEach((item, i) => {
                gsap.set(item, { height: i === 0 ? computeS4ExpandedH() : S4_COLLAPSED_H });
                gsap.set(item.querySelector('.s4-item-grey'), { top: i === 0 ? 0 : S4_COLLAPSED_H });
            });
            s4ActiveItem = 0;
            gsap.set(s4Items[0], { x: window.innerWidth });
            gsap.set(Array.from(s4Items).slice(1), { y: s4BottomClip });
            gsap.set(s4Item0Grey, { opacity: 0 });
            gsap.set(sectionFour, { visibility: 'visible' });
            s4EntryTl.play();
        } else if (t < S4_TRIGGER_T && s4Triggered) {
            s4Triggered = false;
            s4EntryTl.reverse();
        }
        if (t >= S6_TRIGGER_T && !s6Triggered) {
            s6Triggered = true;
            gsap.set(sectionSix, { y: '100%' });
            gsap.set(sectionSix, { visibility: 'visible' });
            s6EntryTl.play();
        } else if (t < S6_TRIGGER_T && s6Triggered) {
            s6Triggered = false;
            s6EntryTl.reverse();
        }
        if (t >= S7_TRIGGER_T && !s7Triggered) {
            s7Triggered = true;
            gsap.set(sectionSix,   { y: 0 });          // ensure s6 is at rest before exit tween
            gsap.set(sectionSeven, { y: '100%' });
            gsap.set(sectionSeven, { visibility: 'visible' });
            // .is-in starts the CSS --fw transition (0.45s delay built in, so
            // the black wipe begins after the section is mostly slid into view)
            sectionSeven.classList.add('is-in');
            s7EntryTl.play();
        } else if (t < S7_TRIGGER_T && s7Triggered) {
            s7Triggered = false;
            sectionSeven.classList.remove('is-in');
            s7EntryTl.reverse();
        }
    });

    // ─── Wheel Handler ─────────────────────────────────────────────────────────
    //
    // One check only: has the hero pan played?
    //   No  → play / reverse heroTl as before
    //   Yes → accumulate raw deltaY and tween postHeroTl.progress to match
    //
    // Tweening progress (not calling play/reverse) means the timeline scrubs
    // proportionally to scroll speed in both directions — no snapping, no
    // direction-change artefacts.

    let postScroll = 0;
    const POST_TOTAL = 7400; // 18.5 timeline units × 400 deltaY/unit

    window.addEventListener('wheel', (e) => {
        if (heroTl.progress() < 1 || (e.deltaY < 0 && postScroll <= 0)) {
            if (e.deltaY > 0) heroTl.play();
            else              heroTl.reverse();
            return;
        }

        postScroll = Math.max(0, Math.min(POST_TOTAL, postScroll + e.deltaY));

        gsap.to(postHeroTl, {
            progress: postScroll / POST_TOTAL,
            duration: 0.6,
            ease: 'power2.out',
            overwrite: 'auto',
        });
    }, { passive: true });

    // ─── Section Three — Accordion Hover ──────────────────────────────────────
    //
    // Each item shifts the right panel to a slightly different grey, hinting
    // that hovering selects different content (image placeholder for now).
    // Reverts to the base colour on mouseleave.

    const accItems = document.querySelectorAll('.s3-acc-item');
    const s3PanelTints = ['#c8c8c8', '#d8d8d8', '#bebebe']; // Layout / Materials / Surroundings

    accItems.forEach((item, i) => {
        item.addEventListener('mouseenter', () => {
            s3Right.style.background = s3PanelTints[i];
        });
        item.addEventListener('mouseleave', () => {
            s3Right.style.background = '#d2d2d2';
        });
    });

    // ─── Section Four — Accordion Hover ──────────────────────────────────────
    //
    // Hovering an item expands it to fill all available height; the others collapse
    // to their label-only row. overflow:hidden on each item clips the grey box and
    // right content — no opacity tricks needed, the height IS the reveal.

    function openS4Item(index) {
        if (index === s4ActiveItem) return;
        const expandedH = computeS4ExpandedH();
        s4Items.forEach((item, i) => {
            gsap.to(item, {
                height: i === index ? expandedH : S4_COLLAPSED_H,
                duration: 0.45,
                ease: 'power2.inOut',
                overwrite: 'auto',
            });
            gsap.to(item.querySelector('.s4-item-grey'), {
                top: i === index ? 0 : S4_COLLAPSED_H,
                duration: 0.45,
                ease: 'power2.inOut',
                overwrite: 'auto',
            });
        });
        s4ActiveItem = index;
    }

    s4Items.forEach((item, i) => {
        item.addEventListener('mouseenter', () => openS4Item(i));
    });

    renderMap = initS6Map();
});

// ─── Resize ───────────────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    positionHeroElements();
});

// ─── Section Six — Locality Map ───────────────────────────────────────────────

function initS6Map() {
    const mapCanvas = document.getElementById('s6-map');
    const wrap      = document.getElementById('s6-map-wrap');

    const W = wrap.clientWidth  || Math.round(window.innerWidth  * 0.88);
    const H = wrap.clientHeight || Math.round(window.innerHeight * 0.58);

    const mapRenderer = new THREE.WebGLRenderer({ canvas: mapCanvas, antialias: true });
    mapRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mapRenderer.setSize(W, H);
    mapRenderer.setClearColor(0xffffff, 1);

    const mapScene  = new THREE.Scene();
    const mapCamera = new THREE.PerspectiveCamera(40, W / H, 0.1, 200);

    // ── Materials ──────────────────────────────────────────────────────────────
    const matRoad = new THREE.MeshBasicMaterial({ color: 0xd0ccc6 });
    const matPark = new THREE.MeshBasicMaterial({ color: 0xbecfaa });
    const matFill = new THREE.MeshBasicMaterial({ color: 0xe6e2dc });
    const matEdge = new THREE.LineBasicMaterial({ color: 0x1c1c1c });

    // ── Ground ─────────────────────────────────────────────────────────────────
    const groundMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(28, 28),
        new THREE.MeshBasicMaterial({ color: 0xeeeae4 })
    );
    groundMesh.rotation.x = -Math.PI / 2;
    mapScene.add(groundMesh);

    // ── Helper ─────────────────────────────────────────────────────────────────
    // Adds a box at (x, z) ground-flush. withEdges=true overlays EdgesGeometry.
    function addBox(x, z, w, d, h, mat, withEdges) {
        const geo  = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, h / 2, z);
        mapScene.add(mesh);
        if (withEdges) {
            const lines = new THREE.LineSegments(new THREE.EdgesGeometry(geo), matEdge);
            lines.position.copy(mesh.position);
            mapScene.add(lines);
        }
    }

    // ── Roads ──────────────────────────────────────────────────────────────────
    addBox( 0, -4, 28, 1.4, 0.04, matRoad); // horizontal south
    addBox( 0,  4, 28, 1.4, 0.04, matRoad); // horizontal north
    addBox(-4,  0, 1.4, 28, 0.04, matRoad); // vertical west
    addBox( 4,  0, 1.4, 28, 0.04, matRoad); // vertical east
    addBox( 0,  0, 0.7, 28, 0.03, matRoad); // minor alley

    // ── Parks ──────────────────────────────────────────────────────────────────
    addBox(-7.5, -7.5, 5.5, 5.5, 0.06, matPark); // top-left
    addBox( 7.5,  7.5, 4.8, 4.8, 0.06, matPark); // bottom-right
    addBox( 7.5, -7.5, 4.0, 3.5, 0.06, matPark); // top-right

    // ── Buildings ──────────────────────────────────────────────────────────────

    // Block (-7.5, 0) — medium cluster
    addBox(-7.5,  0.5, 2.0, 1.5, 2.2, matFill, true);
    addBox(-6.8, -0.8, 1.2, 1.0, 1.6, matFill, true);
    addBox(-8.2,  1.2, 1.0, 0.8, 2.8, matFill, true);

    // Block (0, -7.5) — tall + short
    addBox(-1.2, -7.5, 1.4, 1.6, 3.2, matFill, true);
    addBox( 0.8, -7.2, 0.9, 1.0, 1.8, matFill, true);
    addBox(-0.4, -8.5, 1.0, 0.8, 2.0, matFill, true);

    // Block (7.5, 0) — single tall tower
    addBox( 7.5,  0.0, 2.2, 2.0, 4.5, matFill, true);
    addBox( 6.5, -1.0, 1.0, 0.9, 2.5, matFill, true);

    // Block (-7.5, 7.5) — low spread
    addBox(-7.5,  7.5, 3.5, 3.0, 1.4, matFill, true);
    addBox(-6.5,  6.0, 1.0, 0.8, 1.0, matFill, true);

    // Block (0, 7.5) — mid-rise pair
    addBox(-0.5,  7.5, 1.6, 1.4, 2.0, matFill, true);
    addBox( 1.2,  7.0, 0.8, 0.7, 1.5, matFill, true);

    // Block (7.5, -7.5) — low dense
    addBox( 7.2, -7.5, 1.4, 1.2, 2.0, matFill, true);
    addBox( 8.0, -6.8, 0.8, 0.8, 1.4, matFill, true);
    addBox( 7.5, -8.4, 1.0, 0.7, 1.8, matFill, true);

    // Central block (0, 0) — the project; tallest, most prominent
    addBox( 0.3,  0.2, 2.4, 2.2, 5.5, matFill, true);
    addBox(-1.2,  0.5, 0.9, 0.8, 3.2, matFill, true);
    addBox( 1.4, -0.5, 0.7, 1.0, 4.0, matFill, true);

    // ── Mouse parallax ─────────────────────────────────────────────────────────
    // Base camera sits at a fixed angle. Mouse position within the canvas
    // nudges the camera slightly in that direction — lerped for smoothness.

    const basePos      = { x: 14, y: 14, z: 12 };
    const targetOffset = { x: 0, z: 0 };
    const liveOffset   = { x: 0, z: 0 };
    const MAX_PAN      = 2.5; // world units of max camera shift

    mapCanvas.addEventListener('mousemove', (e) => {
        const rect = mapCanvas.getBoundingClientRect();
        const nx = (e.clientX - rect.left)  / rect.width  * 2 - 1; // -1..1
        const nz = (e.clientY - rect.top)   / rect.height * 2 - 1; // -1..1
        targetOffset.x = nx * MAX_PAN;
        targetOffset.z = nz * MAX_PAN;
    });

    mapCanvas.addEventListener('mouseleave', () => {
        targetOffset.x = 0;
        targetOffset.z = 0;
    });

    // ── Render ─────────────────────────────────────────────────────────────────
    function renderMap() {
        liveOffset.x += (targetOffset.x - liveOffset.x) * 0.04;
        liveOffset.z += (targetOffset.z - liveOffset.z) * 0.04;
        mapCamera.position.set(
            basePos.x + liveOffset.x,
            basePos.y,
            basePos.z + liveOffset.z
        );
        mapCamera.lookAt(0, 0, 0);
        mapRenderer.render(mapScene, mapCamera);
    }

    window.addEventListener('resize', () => {
        const nW = wrap.clientWidth;
        const nH = wrap.clientHeight;
        if (!nW || !nH) return;
        mapCamera.aspect = nW / nH;
        mapCamera.updateProjectionMatrix();
        mapRenderer.setSize(nW, nH);
    });

    return renderMap;
}

let renderMap = null;

// ─── Render Loop ──────────────────────────────────────────────────────────────

function animate() {
    requestAnimationFrame(animate);
    camera.lookAt(cameraLookAt.x, cameraLookAt.y, cameraLookAt.z);
    renderer.render(scene, camera);
    if (renderMap) renderMap();
}

// ─── Nav Panel ────────────────────────────────────────────────────────────────

const navPanel   = document.getElementById('nav-panel');
const navOverlay = document.getElementById('nav-overlay');
const navClose   = document.getElementById('nav-close');
const hamburger  = document.querySelector('.header-hamburger');

function openNav()  { navPanel.classList.add('is-open');    navOverlay.classList.add('is-open'); }
function closeNav() { navPanel.classList.remove('is-open'); navOverlay.classList.remove('is-open'); }

hamburger.addEventListener('click',  openNav);
navClose.addEventListener('click',   closeNav);
navOverlay.addEventListener('click', closeNav);

animate();
