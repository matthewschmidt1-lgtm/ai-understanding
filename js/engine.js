// The storytelling engine. A screen is an async function that receives a `ctx` and
// scripts its beats in order: say(), wait(), choose(), button(). When the visitor
// leaves a screen, the signal aborts and every pending beat rejects with Aborted,
// so a screen never keeps running behind the one that replaced it.
import { h } from './ui.js';
import { state } from './state.js';
import { learn as learnConcept } from './knowledge.js';

export class Aborted extends Error {}

const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
export const motion = {
  reduced: mq.matches,
  // Pauses shrink under reduced motion so the story stays quick but never vanishes.
  get k() {
    return this.reduced ? 0.3 : 1;
  },
};
function syncMotion() {
  document.documentElement.dataset.motion = motion.reduced ? 'reduced' : 'full';
}
syncMotion();
mq.addEventListener('change', (e) => {
  motion.reduced = e.matches;
  syncMotion();
});

export function keyboardMode() {
  return document.documentElement.dataset.input === 'keyboard';
}

const liveRegion = () => document.getElementById('sr-live');

// New content below the fold scrolls gently into view; nothing above it moves.
// Keeping new content in view. Every screen has a "pinned" figure (its first element unless the screen
// chooses another, or false once it lets go): scrolling for new text never pushes the pinned figure under
// the header. Buttons and choices ignore the pin, because a next step must never be out of reach.
let pinned = null;
let skipAll = () => {};
export const skipPause = () => skipAll();

const HEADER = 84;
const FOOTER = 70;
function scrollNeeded(el, ignorePin) {
  const r = el.getBoundingClientRect();
  if (r.bottom <= window.innerHeight - FOOTER) return 0;
  let delta = r.bottom - window.innerHeight + FOOTER + 40;
  if (!ignorePin && pinned && pinned.isConnected && pinned !== el) delta = Math.min(delta, pinned.getBoundingClientRect().top - HEADER);
  return delta > 4 ? delta : 0;
}
function keepInView(el, ignorePin = false) {
  requestAnimationFrame(() => {
    const delta = scrollNeeded(el, ignorePin);
    if (!delta) return;
    window.scrollBy({ top: delta, behavior: motion.reduced ? 'auto' : 'smooth' });
    // Smooth scrolling can be interrupted or throttled, so check again and finish the job.
    if (!motion.reduced) {
      setTimeout(() => {
        const again = scrollNeeded(el, ignorePin);
        if (again) window.scrollBy({ top: again, behavior: 'auto' });
      }, 1000);
    }
  });
}

export function createContext({ root, col, signal }) {
  pinned = null;
  const guard = (promise) =>
    new Promise((resolve, reject) => {
      if (signal.aborted) return reject(new Aborted());
      const onAbort = () => reject(new Aborted());
      signal.addEventListener('abort', onAbort, { once: true });
      promise.then(
        (v) => {
          signal.removeEventListener('abort', onAbort);
          resolve(v);
        },
        (e) => {
          signal.removeEventListener('abort', onAbort);
          reject(e);
        },
      );
    });

  // Pauses can be cut short by the visitor (see skipPause): every pending wait resolves at once.
  const waiters = new Set();
  skipAll = () => [...waiters].forEach((done) => done());
  const wait = (ms) =>
    guard(
      new Promise((resolve) => {
        const done = () => {
          clearTimeout(id);
          waiters.delete(done);
          resolve();
        };
        const id = setTimeout(done, ms * motion.k);
        waiters.add(done);
      }),
    );

  const reveal = (el) => requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));

  // Put an element on stage with the signature fade-and-focus entrance.
  async function add(el, { hold = 0, parent = col, ignorePin = false } = {}) {
    if (signal.aborted) throw new Aborted();
    el.classList.add('rv');
    parent.append(el);
    if (pinned === null || (pinned && !pinned.isConnected)) {
      if (parent === col && !ignorePin) pinned = el; // the first thing on a screen is its anchor
    }
    reveal(el);
    keepInView(el, ignorePin);
    if (hold) await wait(hold);
    return el;
  }

  const say = (content, { cls = '', hold = 1100, tag = 'p', id } = {}) => add(h(tag, { class: `line ${cls}`.trim(), id }, content), { hold });

  async function out(el, ms = 650) {
    el.classList.add('out');
    await wait(ms);
    el.remove();
  }

  // Fade everything off the stage (except `keep`) and wait for it to leave.
  async function clear({ keep = [], ms = 650 } = {}) {
    const gone = [...col.children].filter((c) => !keep.includes(c));
    gone.forEach((c) => c.classList.add('out'));
    await wait(ms);
    gone.forEach((c) => c.remove());
  }

  function focusSoon(el) {
    if (keyboardMode()) setTimeout(() => !signal.aborted && el.focus({ preventScroll: true }), 350);
  }

  function button(label, { variant = 'primary', parent = col } = {}) {
    const b = h('button', { class: `btn ${variant}`, type: 'button' }, h('span', { class: 'btn-label' }, label), h('span', { class: 'btn-arrow', 'aria-hidden': 'true' }, '→'));
    const clicked = new Promise((resolve) =>
      b.addEventListener('click', () => {
        b.disabled = true;
        b.classList.add('out');
        resolve();
      }, { once: true }),
    );
    add(b, { parent, ignorePin: true });
    focusSoon(b);
    return guard(clicked);
  }

  // Large choices. Resolves with the picked value after the pick has had a moment to land.
  function choose(options, { label = '', cls = '' } = {}) {
    const wrap = h('div', { class: `choices ${cls}`.trim(), role: 'group', 'aria-label': label });
    const picked = new Promise((resolve) => {
      options.forEach((o, i) => {
        const b = h(
          'button',
          {
            class: `choice ${o.cls || ''}`.trim(),
            type: 'button',
            style: { '--i': i },
            'data-value': o.value,
            onClick: () => {
              if (wrap.dataset.done) return;
              wrap.dataset.done = '1';
              wrap.querySelectorAll('button').forEach((x) => {
                x.disabled = true;
                x.classList.toggle('picked', x === b);
                x.classList.toggle('dim', x !== b);
              });
              setTimeout(() => resolve({ value: o.value, el: wrap, button: b }), 1000 * motion.k);
            },
          },
          o.icon ? h('span', { class: 'ch-ico', 'aria-hidden': 'true' }, o.icon) : null,
          h('span', { class: 'ch-label' }, o.label),
          o.sub ? h('span', { class: 'ch-sub' }, o.sub) : null,
        );
        wrap.append(b);
      });
    });
    add(wrap, { ignorePin: true });
    focusSoon(wrap.querySelector('button'));
    return guard(picked);
  }

  // An rAF loop that stops itself when the screen is left. Return false from fn to stop early.
  function loop(fn) {
    let id;
    let last = performance.now();
    const tick = (now) => {
      if (signal.aborted) return;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (!document.hidden && fn(now / 1000, dt) === false) return;
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    signal.addEventListener('abort', () => cancelAnimationFrame(id), { once: true });
  }

  // Listener that is removed when the screen is left.
  function on(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    signal.addEventListener('abort', () => target.removeEventListener(type, fn, opts), { once: true });
  }

  return {
    root,
    col,
    signal,
    h,
    state,
    wait,
    add,
    say,
    out,
    clear,
    button,
    choose,
    loop,
    on,
    guard,
    // pin(el) anchors a figure; pin(null) lets go so later text can scroll freely.
    pin(el) {
      pinned = el || false;
    },
    learn: (id) => learnConcept(id),
    live(text) {
      const region = liveRegion();
      if (region) region.textContent = text;
    },
    mix(v) {
      document.documentElement.style.setProperty('--mix', v);
    },
    theme(name) {
      document.body.dataset.theme = name;
    },
  };
}
