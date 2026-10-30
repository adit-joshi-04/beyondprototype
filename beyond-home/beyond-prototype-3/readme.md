# Beyond Concrete — homepage prototype (scrolls 1–12 + footer)

Open index.html in a browser. Canvas is 1440×900 and scales to fit the window.

Controls: scroll / trackpad (one gesture = one scroll), swipe, arrow keys, PageUp/PageDown.
Prototype shortcuts: number keys 1–9 jump to a scroll (0 = scroll 10); open index.html#3 to start on scroll 3.

Tuning (js/main.js):
- answers.HOLD_MS — how long each ATF answer stays
- ring CFG — stepMs, holdMs, direction of the card ring
- ring IMAGES — drop project image paths in to replace the grey placeholders

Adding scrolls 4–12: add a <section class="scene"> in index.html; put [data-split] on text
to get the word reveal; add enter/leave hooks in `hooks` if it needs JS animation.

Scrolls 4–8 (js/main.js → chapter): WALLS_AFTER_MS sets when "Made to Matter" changes to
"Beyond the walls"; WIPE_MS sets the wipe speed. Panel geometry and copy live on each
.cat element in index.html (--bar-l/--bar-r column, --final-l stop position).

Scrolls 9–12 + footer (js/main.js → page): the line pushes the chapter out and becomes the
split's divider (stage --cx). Hovering a side moves the divider (.split --hs). Scrolls 10–12
and the footer sit on one track moved a screen at a time (OFFSET). Carousel speed: SPEED.
The footer's black panel width is --fw; the white copy is clipped to it, so text turns white
as the panel passes.

Menu: opens when the pointer reaches the hamburger (or click / Enter), closes from the X or
Escape. Links jump to Home (1), About → founder (11), Projects (9), Contact (12).
