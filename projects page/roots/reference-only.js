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
// A Group acts as the transform anchor so GSAP can animate position/rotation
// before the async glTF finishes loading. The loaded model is added as a child.

const building = new THREE.Group();
building.position.set(2.2, -1.3, 0);
building.rotation.y = 0.12 + Math.PI / 2; // slight angle + 90° rotation
scene.add(building);

const gltfLoader = new THREE.GLTFLoader();
gltfLoader.load('modern_building_2_game-ready/scene.gltf', (gltf) => {
    gltf.scene.scale.setScalar(0.31);
    building.add(gltf.scene);
});

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

    const s3Left  = document.getElementById('s3-left');
    const s3Right = document.getElementById('s3-right');

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
    // Timeline layout (total duration = 5):
    //   0.0 → 1.5  Phase 1 — camera zooms in, building flattens, hero fades, content fades in
    //   1.5 → 5.0  Phase 2 — camera drifts down the building face, content scrolls

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
        .fromTo([sectionTwo, canvas], { y: 0 }, { y: -window.innerHeight, duration: 1.5, ease: 'none' }, 5);

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

    // Trigger s3EntryTl when canvas is ~33% out of frame (t=5.5 out of 6.5 total).
    // Reverse when scrolling back below threshold so the state resets cleanly.
    let s3Triggered = false;
    const POST_TOTAL_DURATION = 6.5; // postHeroTl total duration after phase 3
    const S3_TRIGGER_T = 5.5;        // timeline-time at which s3 entry fires

    postHeroTl.eventCallback('onUpdate', () => {
        const t = postHeroTl.progress() * POST_TOTAL_DURATION;
        if (t >= S3_TRIGGER_T && !s3Triggered) {
            s3Triggered = true;
            s3EntryTl.play();
        } else if (t < S3_TRIGGER_T && s3Triggered) {
            s3Triggered = false;
            s3EntryTl.reverse();
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
    const POST_TOTAL = 2600; // 6.5 timeline units × 400 deltaY/unit

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
});

// ─── Resize ───────────────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    positionHeroElements();
});

// ─── Render Loop ──────────────────────────────────────────────────────────────

function animate() {
    requestAnimationFrame(animate);
    camera.lookAt(cameraLookAt.x, cameraLookAt.y, cameraLookAt.z);
    renderer.render(scene, camera);
}

animate();
