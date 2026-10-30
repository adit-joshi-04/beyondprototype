# Beyond Concrete — Nav Menu Implementation Guide

Add the sliding nav panel to a Beyond Concrete page. The menu slides in from the left, covers 50% viewport width, and darkens the rest of the screen. The hamburger button in the fixed header opens it; an × button inside the panel and clicking the dark overlay close it.

---

## 1. CSS

Paste this block inside `<style>` (or your stylesheet), after the existing header styles.

```css
/* ─── Nav Panel ────────────────────────────────── */
#nav-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 199;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.55s cubic-bezier(0.76, 0, 0.24, 1);
}

#nav-overlay.is-open {
    opacity: 1;
    pointer-events: auto;
}

#nav-panel {
    position: fixed;
    top: 0;
    left: 0;
    width: 50vw;
    height: 100vh;
    background: #d2d2d2;
    z-index: 200;
    transform: translateX(-100%);
    transition: transform 0.55s cubic-bezier(0.76, 0, 0.24, 1);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 90px;
}

#nav-panel.is-open {
    transform: translateX(0);
}

#nav-close {
    position: absolute;
    top: 24px;
    left: 43px;
    font-size: 22px;
    font-weight: 300;
    line-height: 1;
    background: none;
    border: none;
    cursor: pointer;
    color: #0f0f0f;
    padding: 2px;
}

.nav-item {
    display: block;
    font-family: Georgia, serif;
    font-size: 32px;
    font-weight: 700;
    color: #0f0f0f;
    text-decoration: none;
    line-height: 1.35;
}

.nav-item.nav-current,
.nav-sub a.nav-current {
    color: #aaa;
}

.nav-sub {
    padding-left: 36px;
    margin-bottom: 2px;
}

.nav-sub a {
    display: block;
    font-family: Georgia, serif;
    font-size: 16px;
    color: #0f0f0f;
    text-decoration: none;
    line-height: 1.9;
}
```

---

## 2. HTML

### 2a. Header
The header needs a `.header-hamburger` div with three `<span>` bars. If it already exists, skip this. If not, add it as the first child of `<header id="main-header">`:

```html
<div class="header-hamburger">
    <span></span>
    <span></span>
    <span></span>
</div>
```

The hamburger CSS (should already be in the header styles):
```css
.header-hamburger {
    display: flex;
    flex-direction: column;
    gap: 5px;
    cursor: pointer;
}

.header-hamburger span {
    display: block;
    width: 24px;
    height: 2px;
    background: #0f0f0f;
}
```

### 2b. Nav overlay + panel
Paste this immediately **after** the closing `</header>` tag:

```html
<!-- Nav Overlay + Panel -->
<div id="nav-overlay"></div>
<div id="nav-panel">
    <button id="nav-close">&#x2715;</button>
    <nav>
        <a class="nav-item" href="https://beyond-concrete-prototype-1.netlify.app/">Home</a>
        <a class="nav-item" href="https://beyond-about.netlify.app/">About</a>
        <div class="nav-item">Work
            <div class="nav-sub">
                <a href="https://fifth-avenue-beyond.netlify.app/">Fifth Avenue</a>
                <a href="https://beyond-roots.netlify.app/">Roots</a>
            </div>
        </div>
        <a class="nav-item" href="#">Contact</a>
    </nav>
</div>
```

**Mark the current page** by adding `class="nav-current"` to the matching link:
- On the Home page → `<a class="nav-item nav-current" href="...">`
- On the About page → `<a class="nav-item nav-current" href="...">`
- On Fifth Avenue → `<a class="nav-current" href="...">Fifth Avenue</a>` (inside `.nav-sub`)
- On Roots → `<a class="nav-current" href="...">Roots</a>` (inside `.nav-sub`)

**Contact link behaviour** — two options:
- If the page has a contact section you want to scroll to, keep `href="#"` and add the JS handler below.
- If there's no contact section, link directly to the Fifth Avenue contact section: `href="https://fifth-avenue-beyond.netlify.app/#contact"` (or whichever page has it).

---

## 3. JavaScript

Paste this block at the bottom of your JS file (or in a `<script>` tag before `</body>`):

```js
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
```

### Optional: Contact scroll handler (Fifth Avenue only)
If the page uses a GSAP `postHeroTl` scroll system (like Fifth Avenue), add this too — it jumps straight to the contact section when the Contact link is clicked:

```js
document.getElementById('nav-contact').addEventListener('click', (e) => {
    e.preventDefault();
    closeNav();
    const { postHeroTl, heroTl, POST_TOTAL } = scrollState;
    if (!postHeroTl) return;
    if (heroTl && heroTl.progress() < 1) heroTl.progress(1);
    const target = POST_TOTAL;
    scrollState.postScroll = target;
    gsap.to(postHeroTl, { progress: target / POST_TOTAL, duration: 1.2, ease: 'power2.inOut', overwrite: 'auto' });
});
```

For this to work, `scrollState` must be a module-level object that exposes `postScroll`, `postHeroTl`, `heroTl`, and `POST_TOTAL` (as done in Fifth Avenue's `site.js`). For pages without this scroll system, skip this block and either remove the Contact link or point it to an anchor/URL.

---

## Summary checklist

- [ ] CSS block added to stylesheet
- [ ] `.header-hamburger` exists in `<header>`
- [ ] Nav overlay + panel HTML added after `</header>`
- [ ] Correct page marked with `nav-current`
- [ ] Contact link behaviour decided (scroll handler vs. direct URL)
- [ ] JS block added at bottom of script
