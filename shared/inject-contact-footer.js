/**
 * inject-contact-footer.js
 *
 * Self-contained: injects section-seven CSS + markup directly.
 * No fetch, no parsing — edit the template literal below to update content.
 * Fires 'contactFooterReady' on document when done.
 */

(function () {
    document.body.insertAdjacentHTML('beforeend', `
<style>
    @property --fw {
        syntax: '<length>';
        inherits: true;
        initial-value: 0px;
    }

    #section-seven {
        background: #ffffff;
        --fw: 0px;
        transition: --fw 1.6s cubic-bezier(0.65, 0, 0.35, 1);
    }

    #section-seven.is-in {
        --fw: calc(100vw - 392.5px);
        transition-delay: 0.45s;
    }

    #s7-contact {
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 50%;
        display: flex;
        align-items: center;
        padding: 0 6%;
        gap: 8%;
        background: #d2d2d2;
        border-bottom: 1px solid #c4c4c4;
    }

    .ct-left {
        flex: 0 0 36%;
        height: inherit;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .ct-title {
        font-family: 'PartnerSerif', serif;
        font-weight: 500;
        font-size: clamp(26px, 1.4vw, 46px);
        line-height: 1.15;
        color: #0f0f0f;
        margin-bottom: 22px;
    }

    .ct-sub {
        font-family: 'PartnerSerif', serif;
        font-size: 14px;
        line-height: 1.65;
        color: #555;
        margin-bottom: 24px;
    }

    .ct-form {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .ct-field {
        display: flex;
        align-items: baseline;
        padding: 16px 0;
        border-bottom: 1px solid #0f0f0f;
    }

    .ct-label {
        font-family: 'PartnerSerif', serif;
        font-size: 12px;
        letter-spacing: 0.06em;
        color: #666;
        flex: 0 0 72px;
    }

    .ct-input-wrap { flex: 1; }

    .ct-input {
        display: block;
        width: 100%;
        border: none;
        background: transparent;
        font-family: 'PartnerSerif', serif;
        font-size: 14px;
        color: #0f0f0f;
        padding: 0;
        outline: none;
    }

    .ct-input::placeholder {
        color: #aaa;
        font-style: italic;
    }

    .ct-submit {
        align-self: flex-end;
        margin-top: 24px;
        padding: 9px 26px;
        background: #ffffff;
        color: #0f0f0f;
        font-family: 'PartnerSerif', serif;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        border: none;
        cursor: pointer;
        transition: background 0.4s;
    }

    .ct-submit:hover {
        background: #0f0f0f;
        color: #ffffff;
    }

    #s7-footer {
        position: absolute;
        bottom: 0; left: 0; right: 0;
        height: 50%;
        display: flex;
    }

    .ft-left {
        flex: 0 0 64%;
        background: #878787;
        position: relative;
        display: flex;
        flex-direction: column;
        padding: 28px 4% 22px;
        overflow: hidden;
        color: #ffffff;
    }

    .ft-nav-grid { display: flex; gap: 52px; }

    .ft-nav-col {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .ft-nav-col > a,
    .ft-nav-col > span {
        font-family: 'PartnerSerif', serif;
        font-size: 13px;
        letter-spacing: 0.04em;
        color: #ffffff;
        text-decoration: none;
        line-height: 1;
    }

    .ft-nav-col > a:hover {
        text-decoration: underline;
        text-underline-offset: 3px;
    }

    .ft-projects {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .ft-projects > span {
        font-family: 'PartnerSerif', serif;
        font-size: 13px;
        letter-spacing: 0.04em;
        color: #ffffff;
        text-decoration: none;
        line-height: 1;
    }

    .ft-nav-sub {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .ft-nav-sub a,
    .ft-nav-sub span {
        font-family: 'PartnerSerif', serif;
        font-size: 12px;
        color: rgba(255,255,255,0.65);
        text-decoration: none;
    }

    .ft-nav-sub a:hover { color: #ffffff; }

    .ft-weather {
        position: absolute;
        top: 28px;
        right: 4%;
    }

    .ft-weather-temp {
        font-family: 'Nunito Sans', sans-serif;
        font-size: clamp(36px, 2.8vw, 56px);
        font-weight: 500;
        color: #ffffff;
        line-height: 1;
        letter-spacing: -0.01em;
        margin-bottom: 6px;
    }

    .ft-weather-city {
        font-family: 'Nunito Sans', sans-serif;
        font-size: 14px;
        letter-spacing: 0.1em;
        color: rgba(255,255,255,0.7);
        text-transform: uppercase;
        margin-bottom: 6px;
    }

    .ft-weather-rule {
        border: none;
        border-top: 1px solid rgba(255,255,255,0.3);
        margin: 0 0 6px;
    }

    .ft-weather-stats p {
        font-family: 'Nunito Sans', sans-serif;
        font-size: 11px;
        letter-spacing: 0.05em;
        color: rgba(255,255,255,0.75);
        line-height: 1.2;
        text-transform: uppercase;
    }

    .ft-clouds { flex: 1; }

    .ft-clouds svg {
        position: absolute;
    }

    @keyframes ft-drift1 {
        0%   { transform: translateX(0); }
        50%  { transform: translateX(18px); }
        100% { transform: translateX(0); }
    }

    @keyframes ft-drift2 {
        0%   { transform: translateX(0); }
        50%  { transform: translateX(-12px); }
        100% { transform: translateX(0); }
    }

    .ft-clouds .fc-cloud1 {
        animation: ft-drift1 14s ease-in-out infinite;
    }

    .ft-clouds .fc-cloud2 {
        animation: ft-drift2 20s ease-in-out infinite;
    }

    .ft-clouds .fc-sun {
        top: 10%;
        right: 12%;
        width: 80px;
        height: auto;
    }

    .ft-clouds .fc-cloud2 {
        bottom: 0;
        left: 0;
        width: 55%;
        height: auto;
    }

    .ft-clouds .fc-cloud1 {
        bottom: 8%;
        right: 4%;
        width: 28%;
        height: auto;
    }

    .ft-bottom {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
    }

    .ft-all-social {
        display: flex;
        gap: 24px;
        margin-top: 24px;
    }

    .ft-social {
        display: flex;
        gap: 20px;
        align-items: center;
    }

    .ft-social a {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        text-decoration: none;
    }

    .ft-social svg {
        width: 22px;
        height: 22px;
        fill: #ffffff;
    }

    .ft-credit {
        font-family: 'Nunito Sans', sans-serif;
        font-size: 12px;
        
        color: rgba(255,255,255,0.75);
        text-transform: uppercase;
    }

    .ft-right {
        flex: 1;
        background: #ffffff;
        display: flex;
        flex-direction: column;
    }

    .ft-head {
        flex: 1;
        margin: 0;
        padding: 22px 8% 16px 0;
        font-family: 'PartnerSerif', serif;
        font-size: clamp(28px, 3vw, 54px);
        font-weight: 500;
        line-height: 1.05;
        color: #aaaaaa;
    }

    .ft-address-block { padding: 16px; }

    .ft-email {
        font-family: 'Nunito Sans', sans-serif;
        font-size: 11px;
        font-weight: 500;
        color: #3F3E3E;
        text-transform: uppercase;
        margin-bottom: 6px;
    }

    .ft-address {
        font-family: 'Nunito Sans', sans-serif;
        font-size: 11px;
        line-height: 1.24;
        color: #8E8E8E;
        text-transform: uppercase;
        letter-spacing: 0.03em;
    }

    /* ── Pattern A entry animations (CSS only, no GSAP) ──────────────────────
       Initial states are set here in CSS.
       On Pattern B pages GSAP overrides these via inline styles before the
       section is ever visible, so there is no conflict.
       The .is-visible class is added by an IntersectionObserver inside the
       IIFE — only when gsap is not present on the page.
    ── */
    .ft-left {
        transform: translateX(-100%);
        transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
    }
    #section-seven.is-visible .ft-left {
        transform: translateX(0);
    }

    .ft-nav-grid,
    .ft-weather,
    .ft-social,
    .ft-bottom,
    .ft-head,
    .ft-address-block {
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    .ft-clouds { opacity: 0; transition: opacity 0.4s ease; }

    #section-seven.is-visible .ft-nav-grid      { opacity: 1; transition-delay: 0.55s; }
    #section-seven.is-visible .ft-weather       { opacity: 1; transition-delay: 0.55s; }
    #section-seven.is-visible .ft-head          { opacity: 1; transition-delay: 0.55s; }
    #section-seven.is-visible .ft-social        { opacity: 1; transition-delay: 0.65s; }
    #section-seven.is-visible .ft-clouds        { opacity: 1; transition-delay: 0.70s; }
    #section-seven.is-visible .ft-bottom        { opacity: 1; transition-delay: 0.80s; }
    #section-seven.is-visible .ft-address-block { opacity: 1; transition-delay: 0.80s; }

    /* Instant reset when leaving viewport — suppresses reverse transition so
       the next entry always animates from the start */
    #section-seven.s7-reset * { transition-duration: 0s !important; }
</style>

<section id="section-seven">

    <div id="s7-contact">
        <div class="ct-left">
            <h2 class="ct-title">A thoughtful choice deserves a thoughtful conversation.</h2>
            <p class="ct-sub">Leave your details and our Customer Delight Manager will take it from here.</p>
        </div>
        <form class="ct-form" onsubmit="return false">
            <div class="ct-field">
                <label class="ct-label" for="ct-name">NAME:</label>
                <div class="ct-input-wrap">
                    <input class="ct-input" id="ct-name" name="name" autocomplete="name">
                </div>
            </div>
            <div class="ct-field">
                <label class="ct-label" for="ct-email">EMAIL:</label>
                <div class="ct-input-wrap">
                    <input class="ct-input" id="ct-email" name="email" type="email" autocomplete="email" placeholder="This will help us get in touch with you">
                </div>
            </div>
            <div class="ct-field">
                <label class="ct-label" for="ct-note">NOTE:</label>
                <div class="ct-input-wrap">
                    <input class="ct-input" id="ct-note" name="note" placeholder="What would you like to discuss?">
                </div>
            </div>
            <button type="submit" class="ct-submit">SUBMIT</button>
        </form>
    </div>

    <div id="s7-footer">

        <div class="ft-left">
            <div class="ft-nav-grid">
                <div class="ft-nav-col">
                    <a href="../beyond-home/">HOME</a>
                    <a href="../about prototype/">OUR PILLARS</a>
                    <a href="#">CONNECT</a>
                    <p class="ft-email">HELLO@BEYONDCONCRETE.IN</p>
                </div>
                <div class="ft-nav-col">
                    <span>WORK ROOM</span>
                    <div class="ft-projects">
                        <span>PROJECTS</span>
                        <div class="ft-nav-sub">
                            <a href="../projects page/fifth ave/">Fifth Avenue</a>
                            <span>Roots</span>
                        </div>
                    </div>
                    <div class="ft-social">
                        <a href="#" aria-label="YouTube">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/></svg>
                        </a>
                        <a href="#" aria-label="LinkedIn">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.4 20.4h-3.6v-5.6c0-1.3 0-3-1.8-3-1.9 0-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6h.1c.5-.9 1.6-1.8 3.3-1.8 3.5 0 4.2 2.3 4.2 5.4v6.2zM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2zM7.1 20.4H3.5V9h3.6v11.4zM22.2 0H1.8C.8 0 0 .8 0 1.7v20.5C0 23.2.8 24 1.8 24h20.4c1 0 1.8-.8 1.8-1.8V1.7C24 .8 23.2 0 22.2 0z"/></svg>
                        </a>
                        <a href="#" aria-label="Instagram">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 3.3.2 4.8 1.7 5 5 .1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.2 3.3-1.7 4.8-5 5-1.3.1-1.6.1-4.9.1s-3.6 0-4.8-.1c-3.3-.2-4.8-1.7-5-5C2.1 15.6 2 15.2 2 12s0-3.6.1-4.8c.2-3.3 1.7-4.8 5-5C8.4 2.2 8.8 2.2 12 2.2zm0-2.2C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12c0 3.3 0 3.7.1 4.9.2 4.4 2.6 6.8 7 7C8.3 24 8.7 24 12 24s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9 0-3.3 0-3.7-.1-4.9C23.7 2.7 21.3.3 16.9.1 15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 12 5.8zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z"/></svg>
                        </a>
                    </div>
                </div>
            </div>
            <div class="ft-all-social">
                
                
            </div>
            <div class="ft-weather">
                <p class="ft-weather-temp">25°C</p>
                <p class="ft-weather-city">Hyderabad</p>
                <hr class="ft-weather-rule">
                <div class="ft-weather-stats">
                    <p>Humidity: 55%</p>
                    <p>AQI: Fair (58)</p>
                </div>
            </div>
            <div class="ft-clouds">
                <svg class="fc-sun" viewBox="0 0 371 371" fill="none" xmlns="http://www.w3.org/2000/svg"><circle opacity="0.38" cx="185.223" cy="185.223" r="185.223" fill="url(#paint0_radial_981_1777)"/><defs><radialGradient id="paint0_radial_981_1777" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(185.223 185.223) rotate(90) scale(185.223)"><stop stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></radialGradient></defs></svg>
                <svg class="fc-cloud2" viewBox="0 -47 462 190" fill="none" xmlns="http://www.w3.org/2000/svg"><path opacity="0.33" d="M456.631 138.329H0C18.4081 81.6921 99.7032 89.9515 138.05 101.161C136.634 71.4266 168.138 46.2948 184.067 37.4456C303.004 -43.2607 375.215 25.0563 396.454 69.3031C458.754 63.6394 462.53 112.96 456.631 138.329Z" fill="url(#paint0_linear_981_1781)"/><defs><linearGradient id="paint0_linear_981_1781" x1="146.041" y1="-29.2732" x2="427.619" y2="167.602" gradientUnits="userSpaceOnUse"><stop stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0.1"/></linearGradient></defs></svg>
                <svg class="fc-cloud1" viewBox="-470 -62 635 256" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M162.648 191.196H-468.5C-443.057 112.914 -330.692 124.33 -277.689 139.823C-279.647 98.7248 -236.102 63.988 -214.085 51.7568C-49.6929 -59.7943 50.1168 34.6324 79.4726 95.7897C165.583 87.9615 170.802 156.132 162.648 191.196Z" fill="url(#paint0_linear_981_1776)"/><defs><linearGradient id="paint0_linear_981_1776" x1="-266.644" y1="-40.461" x2="122.548" y2="231.657" gradientUnits="userSpaceOnUse"><stop stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0.1"/></linearGradient></defs></svg>
            </div>
            <div class="ft-bottom">
                <span class="ft-credit">DESIGN: STUDIO PING PONG</span>
            </div>
        </div>

        <div class="ft-right">
            <h2 class="ft-head">Towards<br>Thought-Led<br>Development</h2>
            <div class="ft-address-block">
                
                <p class="ft-address">BEYOND CONCRETE HQ,<br>MALLESHWARAM, NEW OLD ROAD,<br>HYDERABAD — 457367</p>
            </div>
        </div>

    </div>

</section>
`);

    // Pattern A (no GSAP on the page): trigger CSS entry animations via
    // IntersectionObserver. Pattern B pages have GSAP in <head> so the guard
    // skips this — GSAP drives initS7() instead.
    if (typeof gsap === 'undefined') {
        const s7 = document.getElementById('section-seven');
        // Give the section real dimensions so the IO fires only when the user
        // actually scrolls to it (absolute children would otherwise collapse it to 0)
        s7.style.position = 'relative';
        s7.style.height   = '100vh';
        const io = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                s7.classList.remove('s7-reset');
                s7.classList.add('is-visible');
            } else {
                // Snap back instantly so the next entry always plays fresh
                s7.classList.add('s7-reset');
                s7.classList.remove('is-visible');
                requestAnimationFrame(() => s7.classList.remove('s7-reset'));
            }
        }, { threshold: 0, rootMargin: '0px 0px 80px 0px' });
        io.observe(s7);
    }

    document.dispatchEvent(new CustomEvent('contactFooterReady'));
})();
