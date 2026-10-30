/**
 * inject-header.js
 *
 * Self-contained: injects the shared Beyond Concrete header CSS + markup directly.
 * No fetch, no parsing — edit the template literal below to update content.
 * Fires 'headerReady' on document when done.
 *
 * Usage: <script src="[path]/shared/inject-header.js"></script>
 * Place before site.js in <body>.
 */

(function () {
    // Resolve all paths relative to this script file, not the loading page
    const _dir  = (document.currentScript || { src: '' }).src.replace(/\/[^/]+$/, '');
    const _root = _dir.replace(/\/shared$/, '');   // Beyond Concrete root
    const _logo      = _dir  + '/graphics/beyond.png';
    const _home      = _root + '/beyond-home/index.html';
    const _pillars   = _root + '/about prototype/index.html';
    const _fifthAve  = _root + '/projects page/fifth ave/index.html';
    // const _roots     = _root + '/projects page/roots/index.html';
    const _roots     = '';

    document.body.insertAdjacentHTML('afterbegin', `
<style>
    /* ── Header shell ─────────────────────────────────────────────────────── */
    #main-header {
        position: fixed;
        top: 16px;
        left: 16px;
        right: 16px;
        z-index: 100;
        background: #ffffff;
        box-sizing: border-box;
        overflow: hidden;
        height: 60px;
        transition: height 0.55s cubic-bezier(0.76, 0, 0.24, 1);
    }

    #main-header.is-open {
        height: 50vh;
    }

    /* ── Top bar (always visible) ─────────────────────────────────────────── */
    .header-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 60px;
        padding: 0 28px;
        flex-shrink: 0;
    }

    .header-logo img {
        height: 28px;
        width: auto;
        display: block;
    }

    .header-hamburger {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 5px;
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        width: 22px;
        height: 14.5px;   /* 3×1.5px bars + 2×5px gaps */
        position: relative;
    }

    .header-hamburger span {
        display: block;
        width: 22px;
        height: 1.5px;
        background: #0f0f0f;
        transition: transform 0.4s cubic-bezier(0.76, 0, 0.24, 1),
                    opacity   0.3s ease;
        transform-origin: center;
    }

    /* Animate to X when open */
    #main-header.is-open .header-hamburger span:nth-child(1) {
        transform: translateY(6.5px) rotate(45deg);
    }
    #main-header.is-open .header-hamburger span:nth-child(2) {
        opacity: 0;
        transform: scaleX(0);
    }
    #main-header.is-open .header-hamburger span:nth-child(3) {
        transform: translateY(-6.5px) rotate(-45deg);
    }

    /* ── Nav content ──────────────────────────────────────────────────────── */
    .header-nav {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: calc(50vh - 60px);
        padding: 0 28px 28px;
        opacity: 0;
        transition: opacity 0.3s ease 0.1s;
    }

    #main-header.is-open .header-nav {
        opacity: 1;
        transition: opacity 0.35s ease 0.28s;
    }

    /* 4-column nav grid */
    .header-nav-grid {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        padding: 24px 42px;
    }

    .nav-col > a,
    .nav-col > span {
        font-family: 'PartnerSerif', serif;
        font-size: clamp(36px, 3.7vw, 72px);
        font-weight: 400;
        color: #0f0f0f;
        text-decoration: none;
        line-height: 1;
        display: block;
        margin-bottom: 16px;
    }

    .nav-col > a:hover { opacity: 0.5; }

    .nav-sub {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 4px;
    }

    .nav-sub a,
    .nav-sub span {
        font-family: 'PartnerSerif', serif;
        font-size: 16px;
        font-weight: 400;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #0f0f0f;
        text-decoration: none;
    }

    .nav-sub a:hover { opacity: 0.5; }

    /* Bottom rule + footer row */
    .header-nav-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 40px;
        border-top: 1px solid #d0d0d0;
        padding-top: 16px;
        padding: 16px 24px;
    }

    .nav-tagline {
        font-family: 'Nunito Sans', sans-serif;
        font-size: 16px;
        color: #0f0f0f;
        line-height: 1.55;
        max-width: 65%;
    }

    .nav-workroom {
        font-family: 'PartnerSerif', serif;
        font-size: 16px;
        color: #aaa;
        white-space: nowrap;
    }

    /* ── Overlay ──────────────────────────────────────────────────────────── */
    #nav-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        z-index: 99;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.45s ease;
    }

    #nav-overlay.is-visible {
        opacity: 1;
        pointer-events: auto;
    }
</style>

<div id="nav-overlay"></div>

<header id="main-header">
    <div class="header-bar">
        <a class="header-logo" href="/">
            <img src="${_logo}" alt="Beyond Concrete">
        </a>
        <button class="header-hamburger" aria-label="Toggle menu">
            <span></span>
            <span></span>
            <span></span>
        </button>
    </div>

    <nav class="header-nav" aria-hidden="true">
        <div class="header-nav-grid">
            <div class="nav-col">
                <a href="${_home}">Home</a>
            </div>
            <div class="nav-col">
                <a href="${_pillars}">Our Pillars</a>
            </div>
            <div class="nav-col">
                <span>Projects</span>
                <div class="nav-sub">
                    <a href="${_fifthAve}">Fifth Avenue</a>
                    <span>Roots</span>
                </div>
            </div>
            <div class="nav-col">
                <a href="#" class="nav-connect">Connect</a>
            </div>
        </div>
        <div class="header-nav-footer">
            <p class="nav-tagline">What if your next-door neighbour was 50 years old? A 50-year-old peepal tree, carefully transplanted to put down roots alongside you.</p>
            <span class="nav-workroom">Work room</span>
        </div>
    </nav>
</header>
`);

    // ── Toggle logic ───────────────────────────────────────────────────────
    const header  = document.getElementById('main-header');
    const overlay = document.getElementById('nav-overlay');
    const btn     = header.querySelector('.header-hamburger');
    const nav     = header.querySelector('.header-nav');

    function openMenu() {
        header.classList.add('is-open');
        overlay.classList.add('is-visible');
        nav.setAttribute('aria-hidden', 'false');
    }

    function closeMenu() {
        header.classList.remove('is-open');
        overlay.classList.remove('is-visible');
        nav.setAttribute('aria-hidden', 'true');
    }

    btn.addEventListener('click', () => header.classList.contains('is-open') ? closeMenu() : openMenu());
    overlay.addEventListener('click', closeMenu);

    // ── Connect — scroll to footer on current page ─────────────────────────
    header.querySelector('.nav-connect').addEventListener('click', (e) => {
        e.preventDefault();
        closeMenu();
        // scrollState-based pages (fifth ave, roots) expose window.scrollState
        if (window.scrollState && window.scrollState.jumpTo) {
            window.scrollState.jumpTo(window.scrollState.POST_TOTAL);
            return;
        }
        // fallback: reveal section-seven if it exists
        const s7 = document.getElementById('section-seven');
        if (s7) s7.scrollIntoView({ behavior: 'smooth' });
    });

    document.dispatchEvent(new CustomEvent('headerReady'));
})();
