// Screen 4, meaning depends on context. Same word, three sentences, three different representations.
import { h } from '../ui.js';
import { DOG_CONTEXTS, FACETS, glowColor } from '../model.js';

export const meta = { title: 'Context' };

function build() {
  const glow = h('div', { class: 'glow', 'aria-hidden': 'true' });
  const word = h('div', { class: 'ctx-word', 'aria-hidden': 'true' }, 'dog');
  const sentence = h('p', { class: 'ctx-sentence', 'aria-live': 'polite' });
  const bars = FACETS.map((f) => {
    const fill = h('span', { class: 'fill' });
    const val = h('span', { class: 'val' }, '0.00');
    return { id: f.id, fill, val, row: h('div', { class: 'facet' }, h('span', { class: 'lab' }, f.label), h('span', { class: 'track' }, fill), val) };
  });
  const panel = h('div', { class: 'facets', role: 'img', 'aria-label': 'Illustrative facets of the word dog in each sentence' }, ...bars.map((b) => b.row));
  const stage = h('div', { class: 'ctx' }, glow, word, sentence);
  return { stage, glow, sentence, bars, panel };
}

function setContext(ui, data) {
  const [r, g, b] = glowColor(data.facets);
  for (const [k, v] of [['--gr', r], ['--gg', g], ['--gb', b]]) ui.stage.style.setProperty(k, v);
  ui.bars.forEach((bar) => {
    const v = data.facets[bar.id];
    bar.fill.style.transform = `scaleX(${v})`;
    bar.val.textContent = v.toFixed(2);
  });
  ui.sentence.replaceChildren(...data.text.split(/(dog)/).map((part) => (part === 'dog' ? h('mark', {}, part) : part)));
  ui.sentence.classList.remove('swap');
  void ui.sentence.offsetWidth;
  ui.sentence.classList.add('swap');
}

export default async function run(ctx) {
  const ui = build();
  await ctx.add(ui.stage, { hold: 1200 });
  await ctx.add(ui.panel, { hold: 200 });
  ctx.learn('context');
  for (const c of DOG_CONTEXTS) {
    setContext(ui, c);
    await ctx.wait(3400);
  }
  await ctx.say('The word didn’t change.', { cls: 'mid', hold: 1500 });
  await ctx.say('Its context did.', { cls: 'big', hold: 1900 });
  await ctx.say('An LLM has to continually update its representation based on what surrounds a word.', { cls: 'mid', hold: 600 });
  await ctx.say('Simplified: the five facets are labels for illustration. In a real model the dimensions are not this tidy or named.', { cls: 'caption', hold: 500 });
  await ctx.button('Follow the information');
}
