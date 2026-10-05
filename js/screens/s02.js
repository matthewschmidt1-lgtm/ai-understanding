// Screen 2, the surprise. A word becomes a token, a token becomes a list of numbers.
import { h } from '../ui.js';
import { embeddingFor } from '../model.js';

export const meta = { title: 'Numbers' };

const fmt = (v) => (v < 0 ? '−' : ' ') + Math.abs(v).toFixed(2);

function figure() {
  const vec = embeddingFor('dog', 14);
  const cells = vec.map((v, i) => h('span', { class: 'num', style: { '--i': i } }, fmt(v)));
  const fig = h(
    'figure',
    { class: 'xform', 'aria-label': 'The word dog is split into a token, which is looked up as a list of numbers beginning 0.21, minus 0.73, 0.48, 0.09.' },
    h('div', { class: 'xf-step' }, h('span', { class: 'chip word' }, 'dog')),
    h('div', { class: 'xf-arrow', 'aria-hidden': 'true' }, h('span', {}, 'split into a token'), h('i', { class: 'xf-dot' })),
    h('div', { class: 'xf-step' }, h('span', { class: 'chip token' }, 'dog', h('small', {}, 'token'))),
    h('div', { class: 'xf-arrow', 'aria-hidden': 'true' }, h('span', {}, 'look up its numbers'), h('i', { class: 'xf-dot', style: { '--d': '1.1s' } })),
    h('div', { class: 'xf-step' }, h('div', { class: 'vec', 'aria-hidden': 'true' }, h('span', { class: 'br' }, '['), ...cells.slice(0, 6), h('span', { class: 'dots' }, '…'), h('span', { class: 'br' }, ']'))),
  );
  return { fig, cells, vec };
}

// Numbers scramble and settle, then shimmer. The values never change: a token's vector is fixed.
function settle(ctx, cells, vec) {
  const t0 = performance.now();
  ctx.loop((now) => {
    const t = performance.now() - t0;
    cells.slice(0, 6).forEach((c, i) => {
      const lock = 700 + i * 260;
      if (t < lock) c.textContent = fmt((Math.random() * 2 - 1));
      else if (c.dataset.locked !== '1') {
        c.dataset.locked = '1';
        c.textContent = fmt(vec[i]);
        c.classList.add('locked');
      }
    });
  });
}

export default async function run(ctx) {
  await ctx.say('dog', { cls: 'hero-word', hold: 1400 });
  const { fig, cells, vec } = figure();
  await ctx.add(fig, { hold: 400 });
  ctx.learn('tokens');
  await ctx.wait(400);
  settle(ctx, cells, vec);
  await ctx.wait(2900);
  ctx.learn('embeddings');
  await ctx.say('An LLM doesn’t start with a concept called “dog.”', { cls: 'mid', hold: 2300 });
  await ctx.say('It starts with numbers.', { cls: 'big', hold: 2200 });
  await ctx.say('But something remarkable happens when you have lots of numbers representing lots of things.', { cls: 'mid', hold: 800 });
  await ctx.say('Simplified: a real model uses thousands of numbers per token, and it learns them during training. Nobody types them in.', { cls: 'caption', hold: 500 });
  await ctx.button('Show me');
}
