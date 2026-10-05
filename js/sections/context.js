// Section: meaning depends on context. Same word, three sentences, three different representations.
// The arcs show which neighboring words pull on "dog" in each one.
import { h } from '../ui.js';
import { DOG_CONTEXTS, FACETS, glowColor } from '../model.js';

function build() {
  const glow = h('div', { class: 'glow', 'aria-hidden': 'true' });
  const word = h('div', { class: 'ctx-word', 'aria-hidden': 'true' }, 'dog');
  const sentence = h('p', { class: 'ctx-sentence', 'aria-live': 'polite' });
  const arcs = h('svg', { class: 'ctx-arcs', 'aria-hidden': 'true' });
  const sentWrap = h('div', { class: 'ctx-sent' }, arcs, sentence);
  const bars = FACETS.map((f) => {
    const fill = h('span', { class: 'fill' });
    const val = h('span', { class: 'val' }, '0.00');
    return { id: f.id, fill, val, row: h('div', { class: 'facet' }, h('span', { class: 'lab' }, f.label), h('span', { class: 'track' }, fill), val) };
  });
  const panel = h('div', { class: 'facets', role: 'img', 'aria-label': 'Illustrative facets of the word dog in each sentence' }, ...bars.map((b) => b.row));
  const stage = h('div', { class: 'ctx' }, glow, word, sentWrap);
  return { stage, glow, sentence, sentWrap, arcs, bars, panel };
}

// Curved lines from each pulling word to "dog".
function drawPulls(ui) {
  const box = ui.sentWrap.getBoundingClientRect();
  ui.arcs.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
  ui.arcs.replaceChildren();
  const dog = ui.sentence.querySelector('mark');
  if (!dog) return;
  const d = dog.getBoundingClientRect();
  const dx = d.left + d.width / 2 - box.left;
  ui.sentence.querySelectorAll('.pull').forEach((el, k) => {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2 - box.left;
    const sameRow = Math.abs(r.top - d.top) < 8;
    let path;
    if (sameRow) {
      const top = r.top - box.top - 3;
      const lift = 16 + Math.min(34, Math.abs(x - dx) * 0.16);
      path = `M${x} ${top} C ${x} ${top - lift}, ${dx} ${top - lift}, ${dx} ${top}`;
    } else if (r.top > d.top) {
      path = `M${x} ${r.top - box.top - 3} C ${x} ${d.bottom - box.top + 18}, ${dx} ${d.bottom - box.top + 18}, ${dx} ${d.bottom - box.top + 2}`;
    } else {
      path = `M${x} ${r.bottom - box.top + 3} C ${x} ${d.top - box.top - 18}, ${dx} ${d.top - box.top - 18}, ${dx} ${d.top - box.top - 2}`;
    }
    ui.arcs.append(h('path', { d: path, class: 'ctx-arc', pathLength: 1, style: { 'animation-delay': `${0.5 + k * 0.35}s` } }));
  });
}

function setContext(ui, data) {
  const [r, g, b] = glowColor(data.facets);
  for (const [k, v] of [['--gr', r], ['--gg', g], ['--gb', b]]) ui.stage.style.setProperty(k, v);
  ui.bars.forEach((bar) => {
    const v = data.facets[bar.id];
    bar.fill.style.transform = `scaleX(${v})`;
    bar.val.textContent = v.toFixed(2);
  });
  ui.sentence.replaceChildren(
    ...data.text.split(/(\s+)/).map((part) => {
      const bare = part.replace(/[.,]/g, '');
      if (bare === 'dog') return h('mark', {}, part);
      if (data.pulls.includes(bare)) return h('span', { class: 'pull' }, part.replace(/[.,]$/, ''), /[.,]$/.test(part) ? part.slice(-1) : '');
      return part;
    }),
  );
  ui.sentence.classList.remove('swap');
  void ui.sentence.offsetWidth;
  ui.sentence.classList.add('swap');
  requestAnimationFrame(() => drawPulls(ui));
}

export default async function run(ctx) {
  const ui = build();
  await ctx.add(ui.stage, { hold: 900 });
  await ctx.add(ui.panel, { hold: 100 });
  // The honesty note stays on screen for the whole demo instead of arriving as its own timed beat.
  await ctx.say('Simplified: the five facets are labels for illustration. In a real model the dimensions are not this tidy or named.', { cls: 'caption', hold: 0 });
  ctx.learn('context');
  ctx.on(window, 'resize', () => drawPulls(ui));
  for (const c of DOG_CONTEXTS) {
    setContext(ui, c);
    await ctx.wait(2100);
  }
  ui.arcs.replaceChildren();
  await ctx.say('The word didn’t change. Its context did.', { cls: 'big', hold: 1200 });
  await ctx.say('So a model has to keep updating a word’s representation based on the words around it.', { cls: 'mid', hold: 2800 });
}
