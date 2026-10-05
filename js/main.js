// Boot, routing and the shared atmosphere. Screens are loaded on demand, one module each.
import { h, clamp } from './ui.js';
import { state } from './state.js';
import { Aborted, createContext, motion, skipPause } from './engine.js';
import { initKnowledge, prime, resetKnowledge, setOpen } from './knowledge.js';

const LOADERS = [
  () => import('./screens/s00.js'),
  () => import('./screens/s01.js'),
  () => import('./screens/s02.js'),
  () => import('./screens/s03.js'),
  () => import('./screens/s04.js'),
  () => import('./screens/s05.js'),
  () => import('./screens/s06.js'),
  () => import('./screens/s07.js'),
  () => import('./screens/s08.js'),
  () => import('./screens/s09.js'),
  () => import('./screens/s10.js'),
  () => import('./screens/s11.js'),
  () => import('./screens/s12.js'),
  () => import('./screens/s13.js'),
  () => import('./screens/s14.js'),
];
const LAST = LOADERS.length - 1;

// How far human (clay) and machine (slate) have blended by each screen.
const MIX = [0, 0.04, 0.1, 0.18, 0.28, 0.38, 0.48, 0.58, 0.68, 0.76, 0.84, 1, 1, 1, 1];

const stage = document.getElementById('stage');
let token = 0;
let controller = null;

function screenFromHash() {
  const m = /^#\/(\d+)$/.exec(location.hash);
  return m ? clamp(Number(m[1]), 0, LAST) : 0;
}

async function go(n, { push = true, initial = false } = {}) {
  const mine = ++token;
  n = clamp(n, 0, LAST);
  controller?.abort();

  const old = stage.querySelector('.screen');
  if (old && !initial) {
    old.classList.add('leaving');
    await new Promise((r) => setTimeout(r, 600 * motion.k));
    if (mine !== token) return;
  }

  const mod = await LOADERS[n]();
  if (mine !== token) return;
  if (LOADERS[n + 1]) setTimeout(() => LOADERS[n + 1](), 400); // warm the next screen

  // The arrival screen is server-rendered in index.html so first paint is the title, not a blank page.
  const adopt = initial && n === 0 ? document.getElementById('arrival') : null;
  stage.querySelectorAll('.screen').forEach((el) => el !== adopt && el.remove());
  const root = adopt || h('section', { class: 'screen' });
  if (!adopt) stage.append(root);
  let col = root.querySelector('.col');
  if (!col) root.append((col = h('div', { class: 'col' })));
  root.removeAttribute('id');
  root.dataset.screen = n;
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', mod.meta.title);
  root.tabIndex = -1;

  prime(n);
  document.body.dataset.screen = n;
  document.documentElement.style.setProperty('--mix', MIX[n]);
  document.body.dataset.theme = 'paper';
  setOpen(false);
  window.scrollTo(0, 0);

  if (push) history.pushState({ n }, '', `#/${n}`);
  else if (initial) history.replaceState({ n }, '', `#/${n}`);
  if (!initial) root.focus({ preventScroll: true });

  controller = new AbortController();
  const ctx = createContext({ root, col, signal: controller.signal });
  try {
    await mod.default(ctx);
    if (mine === token && n < LAST) go(n + 1);
  } catch (e) {
    if (!(e instanceof Aborted)) console.error(e);
  }
}

function restart() {
  state.reset();
  resetKnowledge();
  go(0);
}

// ---------- atmosphere ----------
// A soft light that follows the pointer, and a flag for whether the visitor is on the keyboard.
let raf = 0;
window.addEventListener('pointermove', (e) => {
  document.documentElement.dataset.input = 'pointer';
  if (motion.reduced || raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    const s = document.documentElement.style;
    s.setProperty('--mx', `${e.clientX}px`);
    s.setProperty('--my', `${e.clientY}px`);
  });
});
const speedHint = document.getElementById('speed');
window.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') document.documentElement.dataset.input = 'keyboard';
  // One shortcut for impatient readers: space or the right arrow cuts the current pause short.
  const free = document.activeElement === document.body || document.activeElement === stage || document.activeElement?.classList.contains('screen');
  if ((e.key === ' ' || e.key === 'ArrowRight') && free && document.body.dataset.screen !== '0') {
    e.preventDefault();
    skipPause();
    speedHint.classList.add('gone');
  }
});
// Tapping empty space or the story text does the same.
stage.addEventListener('pointerup', (e) => {
  if (document.body.dataset.screen === '0') return;
  if (e.target === stage || e.target.classList.contains('screen') || e.target.classList.contains('col') || e.target.classList.contains('line')) {
    skipPause();
    speedHint.classList.add('gone');
  }
});

window.addEventListener('popstate', () => {
  if (history.state?.n === undefined && !/^#\/\d+$/.test(location.hash)) return; // some other fragment, such as the skip link
  go(history.state?.n ?? screenFromHash(), { push: false });
});
document.querySelector('.skip').addEventListener('click', (e) => {
  e.preventDefault();
  stage.focus();
});
document.getElementById('restart').addEventListener('click', restart);
document.getElementById('brand').addEventListener('click', (e) => {
  e.preventDefault();
  restart();
});

// The "more below" cue.
const more = document.getElementById('more');
function checkMore() {
  const left = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
  more.hidden = document.body.dataset.screen === '0' || left < 120;
}
window.addEventListener('scroll', checkMore, { passive: true });
window.addEventListener('resize', checkMore);
new ResizeObserver(checkMore).observe(stage);
more.addEventListener('click', () => window.scrollBy({ top: window.innerHeight * 0.7, behavior: motion.reduced ? 'auto' : 'smooth' }));

initKnowledge();
go(screenFromHash(), { push: false, initial: true });
