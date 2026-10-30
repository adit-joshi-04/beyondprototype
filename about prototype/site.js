// Hero entrance animation
// 1. Heading spans fade in one by one, spread across 1.5s total
// 2. Then subtitle, image, and caption fade in together

const spans = document.querySelectorAll('.hero-left h1 span');
const subtitle = document.querySelector('.hero-left .subtitle');
const img = document.querySelector('.hero-img-placeholder');
const caption = document.querySelector('.hero-right .img-caption');

const totalHeadingDuration = 3000; // ms
const spanInterval = totalHeadingDuration / spans.length;

spans.forEach((span, i) => {
    setTimeout(() => {
        span.classList.add('visible');
    }, i * spanInterval);
});

// after last span starts fading in, wait for its 1s fade + 400ms pause
const afterHeading = (spans.length - 1) * spanInterval + 1000 + 400;

setTimeout(() => {
    subtitle.classList.add('visible');
    img.classList.add('visible');
    caption.classList.add('visible');
}, afterHeading);


// ─── Philosophy section entrance ───────────────────────────────────────────

const philSection  = document.querySelector('.philosophy');
const philCenter   = document.querySelector('.phil-center');
const philBlockA   = document.querySelector('.phil-block-a');
const philBlockB   = document.querySelector('.phil-block-b');
const philBlockC   = document.querySelector('.phil-block-c');

let philTimeout = null;

const philObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // 1. Center fades in
            philCenter.classList.add('phil-in');

            // 2. After center is mostly visible, blocks fly in
            philTimeout = setTimeout(() => {
                philBlockA.classList.add('phil-in');
                philBlockB.classList.add('phil-in');
                philBlockC.classList.add('phil-in');
            }, 700);
        } else {
            // Reset when section leaves view so animation replays on return
            clearTimeout(philTimeout);
            philCenter.classList.remove('phil-in');
            philBlockA.classList.remove('phil-in');
            philBlockB.classList.remove('phil-in');
            philBlockC.classList.remove('phil-in');
        }
    });
}, { threshold: 0.5 });

philObserver.observe(philSection);


// ─── Team section entrance ──────────────────────────────────────────────────

const teamCols = document.querySelectorAll('.leader-col');

const teamObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            teamCols.forEach((col, i) => {
                setTimeout(() => col.classList.add('team-col-in'), i * 150);
            });
        } else {
            teamCols.forEach(col => col.classList.remove('team-col-in'));
        }
    });
}, { threshold: 0.3 });

teamObserver.observe(document.querySelector('.team'));


// ─── Sustainability section entrance ───────────────────────────────────────

const sustSection    = document.querySelector('.sustainability');
const sustHeading    = document.querySelector('.sust-top h2');
const sustImgWrap    = document.querySelector('.sust-img-wrap');
const sustImgCurrent = document.querySelector('.sust-img-current');
const sustImgNext    = document.querySelector('.sust-img-next');
const sustStrike     = document.querySelector('.sust-strike-word');
const sustFloatTexts = document.querySelectorAll('.sust-float-text');

const sustSubtitleLines = document.querySelectorAll('.sust-state-1 .subtitle .sust-line');
const sustBodyLines     = document.querySelectorAll('.sust-body .sust-line');

let sustTimeouts = [];

const sustObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            let t = 0;

            // 1. Heading
            sustTimeouts.push(setTimeout(() => sustHeading.classList.add('sust-in'), t));
            t += 700;

            // 2. Subtitle lines, one by one
            sustSubtitleLines.forEach(line => {
                sustTimeouts.push(setTimeout(() => line.classList.add('sust-in'), t));
                t += 600;
            });

            // 3. Strikethrough on "practices." — fires while last subtitle line is still settling
            const strikeAt = t + 400;
            sustTimeouts.push(setTimeout(() => sustStrike.classList.add('striking'), strikeAt));

            // 4. Body lines, image, and float texts all start together
            t = strikeAt + 500 + 200;
            const bodyStartT = t;

            sustBodyLines.forEach(line => {
                sustTimeouts.push(setTimeout(() => line.classList.add('sust-in'), t));
                t += 600;
            });

            // image and float texts fire at the same time as the first body line
            sustTimeouts.push(setTimeout(() => sustImgWrap.classList.add('sust-in'), bodyStartT));

            sustFloatTexts.forEach((el, i) => {
                sustTimeouts.push(setTimeout(() => el.classList.add('sust-in'), bodyStartT + i * 300));
            });

        } else {
            sustTimeouts.forEach(clearTimeout);
            sustTimeouts = [];
            sustHeading.classList.remove('sust-in');
            sustImgWrap.classList.remove('sust-in');
            sustStrike.classList.remove('striking');
            sustSubtitleLines.forEach(l => l.classList.remove('sust-in'));
            sustBodyLines.forEach(l => l.classList.remove('sust-in'));
            sustFloatTexts.forEach(el => el.classList.remove('sust-in'));
        }
    });
}, { threshold: 0.3 });

sustObserver.observe(sustSection);


// ─── Sustainability scroll state swap ──────────────────────────────────────

const sustState1Els       = document.querySelectorAll('.sust-state-1');
const sustSubtitle2       = document.querySelector('.sust-top .sust-state-2');
const sustQContainer      = document.querySelector('.sust-questions');
const sustQItems          = document.querySelectorAll('.sust-questions li');
const sustQItemsOriginal  = Array.from(sustQItems); // preserve original DOM order for reset
const sustImgLabels       = document.querySelectorAll('.sust-img-label');

const TICK_DURATION  = 400;   // ms for scroll + fade animation
const TICK_INTERVAL  = 1200;  // ms between each tick

// Labels paired to each question (same order as .sust-questions li)
const Q_LABELS = [
    ['POROTHEM BRICKS',   'RECLAIMED TIMBER'],
    ['RAINWATER HARVEST', 'GREYWATER REUSE'],
    ['ZERO LANDFILL',     'SITE COMPOSTING'],
    ['PASSIVE SOLAR',     'NATURAL VENTILATION'],
];

// Images per question — add 3.png and 4.png once ready
const Q_IMAGES = ['1.png', '2.png', '3.png', '4.png'];

// Label positions per question — [labelA, labelB], each with top/bottom/left/right ('auto' clears)
const Q_POSITIONS = [
    [{ top: 'calc(14% + 120px)', left: '6%',  bottom: 'auto', right: 'auto' },
     { top: 'auto',              left: 'auto', bottom: '10%', right: '4%'   }],
    [{ top: '18%',               left: 'auto', bottom: 'auto', right: '8%'  },
     { top: 'auto',              left: '5%',   bottom: '22%',  right: 'auto'}],
    [{ top: 'auto',              left: '8%',   bottom: '30%',  right: 'auto'},
     { top: '15%',               left: 'auto', bottom: 'auto', right: '6%'  }],
    [{ top: '35%',               left: '4%',   bottom: 'auto', right: 'auto'},
     { top: 'auto',              left: 'auto', bottom: '18%',  right: '10%' }],
];

let tickIndex  = 0;
let swapTimeouts = [];
let swapped = false;
let tickInterval = null;

function updateSustImg(src) {
    // Load next image, crossfade it in over current — no blank frame
    sustImgNext.style.transition = 'none';
    sustImgNext.style.opacity = '0';
    sustImgNext.src = src;
    requestAnimationFrame(() => requestAnimationFrame(() => {
        sustImgNext.style.transition = 'opacity 0.6s ease';
        sustImgNext.style.opacity = '1';
        setTimeout(() => {
            // Swap: promote next to current, reset next
            sustImgCurrent.src = src;
            sustImgNext.style.transition = 'none';
            sustImgNext.style.opacity = '0';
            sustImgNext.src = '';
        }, 650);
    }));
}

function updateImgLabels(index) {
    const labels    = Q_LABELS[index % Q_LABELS.length];
    const positions = Q_POSITIONS[index % Q_POSITIONS.length];
    // Fade out
    sustImgLabels.forEach(el => el.classList.remove('sust-label-in'));
    // Swap text + position while invisible, then fade in
    setTimeout(() => {
        sustImgLabels.forEach((el, i) => {
            el.querySelector('.sust-img-label-text').textContent = labels[i] || '';
            const pos = positions[i];
            el.style.top    = pos.top;
            el.style.bottom = pos.bottom;
            el.style.left   = pos.left;
            el.style.right  = pos.right;
        });
        sustImgLabels.forEach(el => el.classList.add('sust-label-in'));
    }, 420);
}

function tickQuestions() {
    const items = Array.from(sustQContainer.querySelectorAll('li'));
    const slotH = items[0].offsetHeight + 4; // item height + gap

    // Advance label index and update labels + image in sync with the tick
    tickIndex = (tickIndex + 1) % Q_LABELS.length;
    updateImgLabels(tickIndex);
    updateSustImg(Q_IMAGES[tickIndex % Q_IMAGES.length]);

    // Scroll all items up + fade out the top one
    items.forEach((li, i) => {
        li.style.transition = `transform ${TICK_DURATION}ms cubic-bezier(0.22,1,0.36,1), opacity ${TICK_DURATION}ms ease`;
        li.style.transform = `translateY(-${slotH}px)`;
        if (i === 0) li.style.opacity = '0';
    });

    setTimeout(() => {
        const first = items[0];

        // Disable transitions for the seamless reorder
        items.forEach(li => {
            li.style.transition = 'none';
            li.style.transform = '';
        });

        // Move top item to bottom — nth-child colors update automatically
        sustQContainer.appendChild(first);
        first.style.opacity = '0';

        // Re-enable transition and fade the new bottom item in
        requestAnimationFrame(() => requestAnimationFrame(() => {
            first.style.transition = `opacity ${TICK_DURATION}ms ease`;
            first.style.opacity = '1';
        }));
    }, TICK_DURATION + 50);
}

function startTicker() {
    if (tickInterval) return;
    tickIndex = 0;
    updateImgLabels(tickIndex);
    updateSustImg(Q_IMAGES[tickIndex]);
    // Fire first tick immediately, then continue on interval
    tickQuestions();
    tickInterval = setInterval(tickQuestions, TICK_INTERVAL);
}

function stopTicker() {
    clearInterval(tickInterval);
    tickInterval = null;
    // Hide labels
    sustImgLabels.forEach(el => el.classList.remove('sust-label-in'));
    // Crossfade back to original image
    updateSustImg('sus.png');
    // Restore original DOM order and clear all inline styles
    sustQItemsOriginal.forEach(li => {
        li.style.transition = '';
        li.style.transform = '';
        li.style.opacity = '';
        sustQContainer.appendChild(li);
    });
}

function doSwapIn() {
    // 1. fade out all state-1 elements
    sustState1Els.forEach(el => el.classList.add('sust-out'));

    // 2. after state-1 is gone, fade in "isn't an arbitrary..." subtitle
    swapTimeouts.push(setTimeout(() => {
        sustSubtitle2.classList.add('sust-visible');
    }, 700));

    // 3. make questions container visible and stagger items in
    swapTimeouts.push(setTimeout(() => {
        sustQContainer.classList.add('sust-visible');
        sustQItems.forEach((li, i) => {
            swapTimeouts.push(setTimeout(() => {
                li.classList.add('sust-q-in');
            }, i * 150));
        });
    }, 1500));

    // 4. start ticker after all items are visible
    swapTimeouts.push(setTimeout(startTicker, 2000));
}

function doSwapOut() {
    swapTimeouts.forEach(clearTimeout);
    swapTimeouts = [];
    stopTicker();
    sustState1Els.forEach(el => el.classList.remove('sust-out'));
    sustSubtitle2.classList.remove('sust-visible');
    sustQContainer.classList.remove('sust-visible');
    sustQItems.forEach(li => li.classList.remove('sust-q-in'));
}

window.addEventListener('scroll', () => {
    const rect = sustSection.getBoundingClientRect();
    const scrolledPast = -rect.top;

    if (scrolledPast > window.innerHeight * 0.1) {
        if (!swapped) { swapped = true; doSwapIn(); }
    } else {
        if (swapped) { swapped = false; doSwapOut(); }
    }
});


// ─── Ekam section entrance ─────────────────────────────────────────────────

const ekamSection = document.querySelector('.ekam-section');
const ekamCard    = document.querySelector('.ekam-card');
const ekamStats   = document.querySelectorAll('.ekam-stat');

let ekamTimeouts = [];

const ekamObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            ekamCard.classList.add('ekam-in');
            ekamStats.forEach((stat, i) => {
                ekamTimeouts.push(setTimeout(() => {
                    stat.classList.add('ekam-stat-in');
                }, 400 + i * 180));
            });
        } else {
            ekamTimeouts.forEach(clearTimeout);
            ekamTimeouts = [];
            ekamCard.classList.remove('ekam-in');
            ekamStats.forEach(stat => stat.classList.remove('ekam-stat-in'));
        }
    });
}, { threshold: 0.25 });

ekamObserver.observe(ekamSection);






// ─── FAQ accordion ─────────────────────────────────────────────────────────

document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-question').addEventListener('click', () => {
        const isOpen = item.classList.contains('faq-open');

        // Close all instantly (grid-template-rows collapses with no transition override needed)
        document.querySelectorAll('.faq-item.faq-open').forEach(el => {
            el.classList.remove('faq-open');
            el.querySelector('.faq-toggle').textContent = '+';
        });

        // Open clicked if it was closed
        if (!isOpen) {
            item.classList.add('faq-open');
            item.querySelector('.faq-toggle').textContent = '×';
        }
    });
});
