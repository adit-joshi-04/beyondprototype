import * as THREE from 'three';

// ─── Three.js Setup ────────────────────────────────────────────────────────────

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
);
camera.position.set(11.15, 2.33, -16.31);

// Separate lookAt target so GSAP can tween it independently
const cameraTarget = { x: -7.08, y: -2.49, z: 1.24 };
camera.lookAt(cameraTarget.x, cameraTarget.y, cameraTarget.z);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.domElement.id = 'three-canvas';
document.body.insertBefore(renderer.domElement, document.body.firstChild);

// Lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambient);

// Key light — positioned on the camera's side (-z) so visible faces are well lit
const sun = new THREE.DirectionalLight(0xfff5e0, 2.2);
sun.position.set(10, 40, -60);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 500;
sun.shadow.camera.left = -100;
sun.shadow.camera.right = 100;
sun.shadow.camera.top = 100;
sun.shadow.camera.bottom = -100;
scene.add(sun);

// Fill light — from the left side to soften shadows on secondary faces
const fill = new THREE.DirectionalLight(0xffffff, 0.6);
fill.position.set(-40, 20, -30);
scene.add(fill);

// ─── Placeholder building ──────────────────────────────────────────────────────
//
// Box body + flat roof slab. Same auto-scale / auto-centre logic as the GLTF
// path so all camera coordinates and clone spacing remain identical.

const bodyMat = new THREE.MeshStandardMaterial({ color: 0xb2b2b2 });
const roofMat = new THREE.MeshStandardMaterial({ color: 0x888888 });

// Body — bottom sits at local y = 0
const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.42, 0.7), bodyMat);
bodyMesh.position.set(0, 0.21, 0);
bodyMesh.castShadow = true;
bodyMesh.receiveShadow = true;

// Pyramid roof — ConeGeometry(4 sides) rotated 45° so base edges align with body
// Base sits flush on top of body (y = 0.42); cone is centred at y + halfHeight
const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(0.78, 0.42, 4), roofMat);
roofMesh.rotation.y = Math.PI / 4;
roofMesh.position.set(0, 0.42 + 0.21, 0);
roofMesh.visible = false;

const model = new THREE.Group();
model.add(bodyMesh, roofMesh);

// Auto-scale to 20 units max dim, then centre at world origin —
// identical to the GLTF onLoad path so spacing / camera coords are unchanged.
const box    = new THREE.Box3().setFromObject(model);
const centre = box.getCenter(new THREE.Vector3());
const size   = box.getSize(new THREE.Vector3());
const maxDim = Math.max(size.x, size.y, size.z);
const scale  = 25 / maxDim;

model.scale.setScalar(scale);
model.position.sub(centre.multiplyScalar(scale));

scene.add(model);

// 4 copies on the left (scroll direction), 2 on the right
const scaledWidth = size.x * scale;
const spacing     = scaledWidth + 8;

for (let i = 1; i <= 4; i++) {
    const leftClone = model.clone();
    leftClone.position.x -= spacing * i;
    scene.add(leftClone);
}

for (let i = 1; i <= 2; i++) {
    const rightClone = model.clone();
    rightClone.position.x += spacing * i;
    scene.add(rightClone);
}

// ─── Platform base ─────────────────────────────────────────────────────────
// Single flat slab that all 7 houses sit on (4 left + original + 2 right).
// model.position.y is the world y of the house floor (local y=0 after centring).
const PLAT_THICKNESS = 1.5;
const PLAT_MARGIN    = 12; // overhang beyond outermost house on each x side
const PLAT_DEPTH_PAD = 8;  // overhang beyond house footprint on each z side

const houseHalfW = (size.x * scale) / 2;
const leftEdge   = model.position.x - 4 * spacing - houseHalfW;
const rightEdge  = model.position.x + 2 * spacing + houseHalfW;

const platformMesh = new THREE.Mesh(
    new THREE.BoxGeometry(
        (rightEdge - leftEdge) + PLAT_MARGIN * 2,
        PLAT_THICKNESS,
        size.z * scale + PLAT_DEPTH_PAD * 2
    ),
    new THREE.MeshStandardMaterial({ color: 0x9a9a9a })
);
platformMesh.position.set(
    (leftEdge + rightEdge) / 2,
    model.position.y - PLAT_THICKNESS / 2,
    model.position.z
);
platformMesh.receiveShadow = true;
scene.add(platformMesh);

console.log('Placeholder built. Size:', size, 'Scale:', scale, 'Spacing:', spacing);

// ─── Hero Layout ───────────────────────────────────────────────────────────────
//
// Every text element is individually position:absolute inside #hero.
// JS sets each element's top (for vertical stacking) and left (for flush-right).
// GSAP animates each element's `left` to MARGIN independently —
// each line travels a different distance because each has a different width.
// No text-align is ever used — pure left-position arithmetic.

const MARGIN       = 45;
const TITLE_TOP    = 115;
const DESC_BOTTOM  = 52;

let heroTl = null;

function layoutHero() {
    const hw1      = document.getElementById('hw-1');
    const hw2      = document.getElementById('hw-2');
    const subtitle = document.getElementById('hero-subtitle');
    const hd1      = document.getElementById('hd-1');
    const hd2      = document.getElementById('hd-2');
    const heroLine = document.getElementById('hero-line');

    // ── Vertical positions ──────────────────────────────────────────────────
    hd1.style.top = TITLE_TOP + 'px';
    hd2.style.top = (TITLE_TOP + hd1.offsetHeight) + 'px';

    const hw1Top      = window.innerHeight - DESC_BOTTOM - hw1.offsetHeight;
    const subtitleTop = hw1Top - subtitle.offsetHeight - 6;
    hw1.style.top      = hw1Top + 'px';
    hw2.style.top      = (hw1Top + hw1.offsetHeight) + 'px';
    subtitle.style.top = subtitleTop + 'px';

    // ── Horizontal positions — flush right ──────────────────────────────────
    const flushRight = el => window.innerWidth - MARGIN - el.offsetWidth;

    hw1.style.left      = flushRight(hw1)      + 'px';
    hw2.style.left      = flushRight(hw2)      + 'px';
    subtitle.style.left = flushRight(subtitle) + 'px';
    hd1.style.left      = flushRight(hd1)      + 'px';
    hd2.style.left      = flushRight(hd2)      + 'px';

    heroLine.style.left = (window.innerWidth * 0.1) + 'px';

    // Reveal everything now that positions are correct
    gsap.set([hw1, hw2, subtitle, hd1, hd2, heroLine], { opacity: 1 });

    // ── Hero timeline ────────────────────────────────────────────────────────
    if (heroTl) heroTl.kill();
    heroTl = gsap.timeline({ paused: true });

    [hw1, hw2, subtitle, hd1, hd2].forEach(el => {
        heroTl.to(el, { left: MARGIN, duration: 1.4, ease: 'power2.inOut' }, 0);
    });

    // Line animates off the left edge
    heroTl.to(heroLine, {
        left: -2,
        duration: 1.4,
        ease: 'power2.inOut'
    }, 0);

    // Camera pans to scroll-1 end
    heroTl.to(camera.position, {
        x: -10.22, y: 1.70, z: -16.65,
        duration: 1.4, ease: 'power2.inOut'
    }, 0);
    heroTl.to(cameraTarget, {
        x: 1.80, y: -0.72, z: -6.02,
        duration: 1.4, ease: 'power2.inOut'
    }, 0);
}

// Run after fonts are loaded so offsetWidth measurements are accurate
document.fonts.ready.then(() => {
    layoutHero();

    // ─── DOM refs ─────────────────────────────────────────────────────────────
    const hw1      = document.getElementById('hw-1');
    const hw2      = document.getElementById('hw-2');
    const subtitle = document.getElementById('hero-subtitle');
    const hd1      = document.getElementById('hd-1');
    const hd2      = document.getElementById('hd-2');
    const heroLine = document.getElementById('hero-line');

    const sectionTwo    = document.getElementById('section-two');
    const s2Inner       = document.getElementById('s2-inner');
    const s2TetherLines = document.querySelectorAll('.s2-tether-line');
    const s2Headings    = document.querySelectorAll('.s2-heading');
    const s2Bodies      = document.querySelectorAll('.s2-body');

    const sectionThree = document.getElementById('section-three');
    const s3Left       = document.getElementById('s3-left');
    const s3Right      = document.getElementById('s3-right');
    const sectionFour  = document.getElementById('section-four');
    const s4LineTop    = document.getElementById('s4-line-top');
    const s4Items      = document.querySelectorAll('.s4-item');
    const s4Item0Grey  = s4Items[0].querySelector('.s4-item-grey');
    const sectionSix   = document.getElementById('section-six');
    const sectionSeven = document.getElementById('section-seven');
    const s5Box        = document.getElementById('s5-box');
    const s5Label      = document.getElementById('s5-label');
    const s5TitleTop   = document.getElementById('s5-title-top');
    const s5TitleBot   = document.getElementById('s5-title-bottom');
    const s5Body       = document.getElementById('s5-body');

    // ─── Section Four init ────────────────────────────────────────────────────
    // Collapsed row height (px) — enough to show just the label
    const S4_COLLAPSED_H = 64;
    let s4ActiveItem = 0;

    function computeS4ExpandedH() {
        return window.innerHeight - 116 - S4_COLLAPSED_H * (s4Items.length - 1);
    }

    // Initialise heights: item 0 expanded, rest collapsed
    s4Items.forEach((item, i) => {
        gsap.set(item, { height: i === 0 ? computeS4ExpandedH() : S4_COLLAPSED_H });
        gsap.set(item.querySelector('.s4-item-grey'), { top: i === 0 ? 0 : S4_COLLAPSED_H });
    });

    // Section Seven — starts off-screen below
    gsap.set(sectionSeven, { y: '100%' });

    // Section Five — starts as a zero-scale point at viewport centre
    gsap.set(s5Box, { scale: 0, transformOrigin: 'center center' });
    // Perspective baked into each title so fixed stacking context isn't affected
    gsap.set([s5TitleTop, s5TitleBot], { transformPerspective: 900 });

    // ─── Post-Hero Timeline (scroll-progress driven) ──────────────────────────
    //
    // Phase 1  t: 0 → 1   camera pans to front of building
    // Phase 2  t: 1 → 6   camera drifts left x=-3 → x=-83, content strip scrolls
    // Phase 3  t: 6 → 7.5 canvas + section-two exit upward, section-three enters
    // Phase 4  t: 9 → ...  section-four items expand, section-five/six/seven follow
    //
    // ease: 'none' on all tweens — easing lives in the progress tween only.
    // No fromTo for camera — FROM values applied at creation time clobber heroTl.
    // fromTo IS used for HTML reveals — safe because CSS initial state matches FROM.

    const postHeroTl = gsap.timeline({ paused: true });

    postHeroTl
        // ── Phase 1 — pan to front of building ────────────────────────────────
        .to(camera.position, { x: -3.00, y: 2.66, z: -34.25, duration: 1, ease: 'none' }, 0)
        .to(cameraTarget,    { x: -10.92, y: -4.22, z: 92.18, duration: 1, ease: 'none' }, 0)

        // Fade hero text out as phase 1 plays
        .to([hw1, hw2, subtitle, hd1, hd2, heroLine], { opacity: 0, duration: 1.0, ease: 'none' }, 0)

        // Fade section-two in — starts at t=0.5, overlaps into phase 2 start
        .to(sectionTwo, { opacity: 1, duration: 1.0, ease: 'none' }, 0.5)

        // ── Phase 2 — drift left across 4 copies ──────────────────────────────
        .to(camera.position, { x: -83, duration: 5, ease: 'none' }, 1)
        .to(cameraTarget,    { x: -91, duration: 5, ease: 'none' }, 1)

        // Translate strip LEFT by 3 slot widths (4 items - 1).
        // Lines are inside items so they move with s2Inner automatically.
        // Items are 65vw wide — travel = 3 × 65vw to show all 4. Duration 7 feels slow.
        .to(s2Inner, {
            x: () => -(window.innerWidth * 0.65) * 4,
            duration: 7,
            ease: 'none',
        }, 1)

        // ── Reveal animations — tether draws → heading → body ─────────────────
        // Items 0.7 units apart — all 4 revealed by t=3.1, well before exit at t=6.
        // Item 1 — (t=0.8)
        .fromTo(s2TetherLines[0], { scaleY: 0 }, { scaleY: 1, duration: 0.2, ease: 'none' }, 0.80)
        .fromTo(s2Headings[0],    { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none' }, 0.95)
        .fromTo(s2Bodies[0],      { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none' }, 1.05)

        // Item 2 — (t=1.5)
        .fromTo(s2TetherLines[1], { scaleY: 0 }, { scaleY: 1, duration: 0.2, ease: 'none' }, 1.50)
        .fromTo(s2Headings[1],    { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none' }, 1.65)
        .fromTo(s2Bodies[1],      { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none' }, 1.75)

        // Item 3 — (t=2.2)
        .fromTo(s2TetherLines[2], { scaleY: 0 }, { scaleY: 1, duration: 0.2, ease: 'none' }, 2.20)
        .fromTo(s2Headings[2],    { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none' }, 2.35)
        .fromTo(s2Bodies[2],      { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none' }, 2.45)

        // Item 4 — (t=2.9)
        .fromTo(s2TetherLines[3], { scaleY: 0 }, { scaleY: 1, duration: 0.2, ease: 'none' }, 2.90)
        .fromTo(s2Headings[3],    { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none' }, 3.05)
        .fromTo(s2Bodies[3],      { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none' }, 3.15)

        // ── Phase 3 — canvas + section-two exit upward, section-three enters ──
        // Both fixed elements slide up by one full viewport height over 1.5 units.
        // s3EntryTl fires separately via onUpdate (not scrubbed) once threshold crossed.
        .fromTo([sectionTwo, renderer.domElement], { y: 0 }, { y: -window.innerHeight, duration: 1.5, ease: 'none' }, 6)
        .to({}, { duration: 1.5 }, 7.5) // pads to t=9.0 for s4 trigger window

        // ── Phase 5 — section-four elements split apart, section-five expands ──
        // Label wraps + right columns exit right; s5-box scales up from centre.
        .fromTo(s4Items,   { x: 0 }, { x:  window.innerWidth, duration: 1.5, ease: 'none' }, 11.0)
        .fromTo(s4LineTop, { x: 0 }, { x:  window.innerWidth, duration: 1.5, ease: 'none' }, 11.0)
        .fromTo(s5Box,     { scale: 0 }, { scale: 1, duration: 3.0, ease: 'none' }, 12.1)
        // Text appears when s5-box reaches ~5% scale (t = 12.1 + 0.05*3.0 = 12.25)
        .fromTo([s5TitleTop, s5TitleBot, s5Body],
            { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'none' }, 12.25)
        // 3D flip — top title rotates upward, bottom rotates downward.
        // rotateX negative = top edge goes back into screen (flips up).
        .fromTo(s5TitleTop, { rotateX: 0, y: 0 }, { rotateX:  85, y: -70, opacity: 0, duration: 1.0, ease: 'none' }, 13.4)
        .fromTo(s5TitleBot, { rotateX: 0, y: 0 }, { rotateX: -85, y:  70, opacity: 0, duration: 1.0, ease: 'none' }, 13.4)
        .to({}, { duration: 2.4 }, 15.1) // pads to t=17.5 for s6 dwell window
        .to({}, { duration: 2.0 }, 17.5); // pads to t=19.5 for footer dwell

    // ─── Section Three Entry Timeline ─────────────────────────────────────────
    //
    // Plays once (not scrubbed) when phase 3 threshold is crossed.
    // fromTo on both panels ensures clean reversal when scrolling back up.

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
    // s3-right (grey box) moves from the right panel to the center strip.
    // The accordion fades in on top, then s3-right fades out — seamless.

    const s4BottomClip = S4_COLLAPSED_H * (s4Items.length - 1); // 192px
    const s4EntryTl = gsap.timeline({ paused: true });
    s4EntryTl
        // s3-right moves to center strip
        .fromTo(s3Right,
            { top: 0, left: '50%', right: 0 },
            { top: 116, left: '28%', right: '28%',
              duration: 0.85, ease: 'power2.out' }, 0)
        .fromTo(s3Left,
            { x: 0 },
            { x: '-100%', duration: 0.85, ease: 'power2.out' }, 0)
        // item 0 slides in from right
        .fromTo(s4Items[0],
            { x: window.innerWidth },
            { x: 0, duration: 0.85, ease: 'power2.out' }, 0)
        // items 1-3 rise from below; clip-path on s3-right tracks the same distance
        .fromTo(Array.from(s4Items).slice(1),
            { y: s4BottomClip },
            { y: 0, duration: 0.85, ease: 'power2.out' }, 0)
        .fromTo(s3Right,
            { clipPath: 'inset(0 0 0px 0)' },
            { clipPath: `inset(0 0 ${s4BottomClip}px 0)`, duration: 0.85, ease: 'power2.out' }, 0)
        // once items are in place, fade s3-right out and reveal item 0 grey
        .fromTo(s3Right, { opacity: 1 }, { opacity: 0, duration: 0.2, ease: 'power2.in' }, 0.85)
        .fromTo(s4Item0Grey, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.in' }, 0.85);

    s4EntryTl.eventCallback('onReverseComplete', () => {
        if (!s4Triggered) {
            // Restore s3-right to its original flex-child state
            gsap.set(s3Right, { clearProps: 'position,top,left,right,bottom,width,height,opacity,clipPath' });
            gsap.set(s4Items, { clearProps: 'x,y' });
            gsap.set(s4Item0Grey, { clearProps: 'opacity' });
            gsap.set(sectionThree, { zIndex: 2 });
            gsap.set(sectionFour,  { visibility: 'hidden' });
            // Reset accordion to item 0 open state for next entry
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

    gsap.set(sectionSix, { y: '100%' });

    const s6EntryTl = gsap.timeline({ paused: true });
    s6EntryTl
        .fromTo(sectionSix, { y: '100%' }, { y: 0, duration: 0.85, ease: 'power2.out' }, 0);

    s6EntryTl.eventCallback('onReverseComplete', () => {
        if (!s6Triggered) gsap.set(sectionSix, { visibility: 'hidden' });
    });

    // ─── Section Seven Entry Timeline ─────────────────────────────────────────
    //
    // Section-six exits upward while section-seven rises from below.
    // .is-in on #section-seven starts the CSS --fw transition (black panel wipe).

    const s7EntryTl = gsap.timeline({ paused: true });
    s7EntryTl
        .fromTo(sectionSix,   { y: 0 },      { y: '-100%', duration: 0.85, ease: 'power2.inOut' }, 0)
        .fromTo(sectionSeven, { y: '100%' }, { y: 0,        duration: 0.85, ease: 'power2.out'   }, 0);

    s7EntryTl.eventCallback('onReverseComplete', () => {
        if (!s7Triggered) gsap.set(sectionSeven, { visibility: 'hidden' });
    });

    // ─── Trigger thresholds ───────────────────────────────────────────────────
    //
    // Working phase 2 ends at t=6 (vs ref t=5), so all thresholds shift +1.

    let s3Triggered = false;
    let s4Triggered = false;
    let s6Triggered = false;
    let s7Triggered = false;
    const POST_TOTAL_DURATION = 19.5;
    const S3_TRIGGER_T = 6.5;
    const S4_TRIGGER_T = 8.5;
    const S6_TRIGGER_T = 15.5;
    const S7_TRIGGER_T = 17.0;

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
            // Reset accordion to default state (item 0 open) before entry plays
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

    let postScroll = 0;
    const POST_TOTAL = 7800; // 19.5 timeline units × 400 deltaY per unit

    window.addEventListener('wheel', (e) => {
        if (heroTl.progress() < 1 || (e.deltaY < 0 && postScroll <= 0)) {
            if (e.deltaY < 0 && postScroll <= 0) {
                if (postHeroTl.progress() > 0) {
                    // Camera hasn't returned to scroll-1 end yet — let one tween
                    // run to completion; isTweening() gates restarts.
                    if (!gsap.isTweening(postHeroTl)) {
                        gsap.to(postHeroTl, {
                            progress: 0,
                            duration: 0.5,
                            ease: 'power2.out',
                        });
                    }
                    return;
                }
                gsap.killTweensOf(postHeroTl);
                postHeroTl.progress(0);
            }
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
    // Each item shifts the right panel to a slightly different grey,
    // hinting that hovering selects different content.

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
    // Hovering an item expands it to fill all available height; others collapse
    // to their label-only row. overflow:hidden on each item clips content.

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

    // ─── Contact nav link — jumps to section seven ───────────────────────────
    document.getElementById('nav-contact').addEventListener('click', (e) => {
        e.preventDefault();
        closeNav();
        if (heroTl.progress() < 1) heroTl.progress(1);
        postScroll = POST_TOTAL;
        gsap.to(postHeroTl, { progress: 1, duration: 1.2, ease: 'power2.inOut', overwrite: 'auto' });
    });

    renderMap = initS6Map();
});

// ─── Resize ────────────────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    layoutHero();
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

    // ── Helper — box at (x, z) ground-flush ───────────────────────────────────
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
    addBox( 0, -4, 28, 1.4, 0.04, matRoad);
    addBox( 0,  4, 28, 1.4, 0.04, matRoad);
    addBox(-4,  0, 1.4, 28, 0.04, matRoad);
    addBox( 4,  0, 1.4, 28, 0.04, matRoad);
    addBox( 0,  0, 0.7, 28, 0.03, matRoad);

    // ── Parks ──────────────────────────────────────────────────────────────────
    addBox(-7.5, -7.5, 5.5, 5.5, 0.06, matPark);
    addBox( 7.5,  7.5, 4.8, 4.8, 0.06, matPark);
    addBox( 7.5, -7.5, 4.0, 3.5, 0.06, matPark);

    // ── Buildings ──────────────────────────────────────────────────────────────
    addBox(-7.5,  0.5, 2.0, 1.5, 2.2, matFill, true);
    addBox(-6.8, -0.8, 1.2, 1.0, 1.6, matFill, true);
    addBox(-8.2,  1.2, 1.0, 0.8, 2.8, matFill, true);
    addBox(-1.2, -7.5, 1.4, 1.6, 3.2, matFill, true);
    addBox( 0.8, -7.2, 0.9, 1.0, 1.8, matFill, true);
    addBox(-0.4, -8.5, 1.0, 0.8, 2.0, matFill, true);
    addBox( 7.5,  0.0, 2.2, 2.0, 4.5, matFill, true);
    addBox( 6.5, -1.0, 1.0, 0.9, 2.5, matFill, true);
    addBox(-7.5,  7.5, 3.5, 3.0, 1.4, matFill, true);
    addBox(-6.5,  6.0, 1.0, 0.8, 1.0, matFill, true);
    addBox(-0.5,  7.5, 1.6, 1.4, 2.0, matFill, true);
    addBox( 1.2,  7.0, 0.8, 0.7, 1.5, matFill, true);
    addBox( 7.2, -7.5, 1.4, 1.2, 2.0, matFill, true);
    addBox( 8.0, -6.8, 0.8, 0.8, 1.4, matFill, true);
    addBox( 7.5, -8.4, 1.0, 0.7, 1.8, matFill, true);
    // Central block — the project; tallest, most prominent
    addBox( 0.3,  0.2, 2.4, 2.2, 5.5, matFill, true);
    addBox(-1.2,  0.5, 0.9, 0.8, 3.2, matFill, true);
    addBox( 1.4, -0.5, 0.7, 1.0, 4.0, matFill, true);

    // ── Mouse parallax ─────────────────────────────────────────────────────────
    const basePos      = { x: 14, y: 14, z: 12 };
    const targetOffset = { x: 0, z: 0 };
    const liveOffset   = { x: 0, z: 0 };
    const MAX_PAN      = 2.5;

    mapCanvas.addEventListener('mousemove', (e) => {
        const rect = mapCanvas.getBoundingClientRect();
        const nx = (e.clientX - rect.left)  / rect.width  * 2 - 1;
        const nz = (e.clientY - rect.top)   / rect.height * 2 - 1;
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

// ─── Render loop ───────────────────────────────────────────────────────────────

function animate() {
    requestAnimationFrame(animate);
    camera.lookAt(cameraTarget.x, cameraTarget.y, cameraTarget.z);
    renderer.render(scene, camera);
    if (renderMap) renderMap();
}
animate();
