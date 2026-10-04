// Screen 7, the machine runs. The parts collapse into one machine and a pulse passes through every layer.
import { h } from '../ui.js';
import { motion } from '../engine.js';

export const meta = { title: 'The machine runs' };

const WORDS = ['The', 'dog', 'chased', 'the', 'ball'];
const SHOWN = 5;
const TOTAL = 32;

function machine() {
  const rows = Array.from({ length: SHOWN }, (_, i) =>
    h('div', { class: 'mrow', 'data-i': i }, h('span', {}, 'attention'), h('span', { class: 'ar', 'aria-hidden': 'true' }, '→'), h('span', {}, 'transform')),
  );
  const counter = h('span', { class: 'layer-no', 'aria-hidden': 'true' }, 'layer 0');
  const bars = Array.from({ length: 16 }, (_, i) => h('span', { class: 'rb', style: { '--i': i } }));
  const out = h('div', { class: 'rep', role: 'img', 'aria-label': 'A new internal state, drawn as a row of bars' }, ...bars);
  const m = h(
    'div',
    { class: 'machine' },
    h('div', { class: 'm-in' }, h('span', { class: 'cap' }, 'YOUR WORDS'), h('div', { class: 'chips' }, ...WORDS.map((w) => h('span', { class: 'chip token' }, w)))),
    h('span', { class: 'arrow', 'aria-hidden': 'true' }, '↓'),
    h('div', { class: 'm-body' }, ...rows, h('div', { class: 'mrow dots', 'aria-hidden': 'true' }, '⋮'), counter),
    h('span', { class: 'arrow', 'aria-hidden': 'true' }, '↓'),
    h('div', { class: 'm-out' }, h('span', { class: 'cap' }, 'FINAL REPRESENTATION'), out),
  );
  return { m, rows, counter, bars };
}

export default async function run(ctx) {
  const ui = machine();
  await ctx.add(ui.m, { hold: 900 });
  ctx.live('Your words pass through many layers of attention and transformation.');

  // One pulse down the machine; the counter races up to a mid-sized model's depth.
  const dur = 5200 * motion.k;
  const t0 = performance.now();
  await ctx.guard(
    new Promise((resolve) => {
      ctx.loop(() => {
        const p = Math.min((performance.now() - t0) / dur, 1);
        const row = Math.min(SHOWN - 1, Math.floor(p * SHOWN));
        ui.rows.forEach((r, i) => r.classList.toggle('on', i === row && p < 1));
        ui.counter.textContent = `layer ${Math.max(1, Math.round(p * TOTAL))} of ${TOTAL}`;
        ui.bars.forEach((b, i) => b.style.setProperty('--v', (0.2 + 0.8 * Math.abs(Math.sin(i * 1.7 + 1))) * p));
        if (p >= 1) {
          resolve();
          return false;
        }
      });
    }),
  );
  ui.m.classList.add('done');
  await ctx.wait(900);
  await ctx.say('The model has transformed the input into a new internal state.', { cls: 'mid', hold: 2400 });
  await ctx.say('And now:', { cls: 'quiet', hold: 700 });
  await ctx.say('So what does it do with that state?', { cls: 'big', hold: 800 });
  await ctx.say('Simplified: a real model has dozens of layers (this one pretends to have 32) and the final state is thousands of numbers.', { cls: 'caption', hold: 500 });
  await ctx.button('Next');
}
