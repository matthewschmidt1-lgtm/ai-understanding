// Section: open the black box, then run words through it. The same five words go in; a stack of operations comes out.
import { h } from '../ui.js';
import { motion } from '../engine.js';
import { VIZ, WATCH } from '../layerviz.js';

const WORDS = ['The', 'dog', 'chased', 'the', 'ball'];

const LAYERS = [
  { id: 'tokens', name: 'Tokens', note: 'Break the input into pieces the model can process.' },
  { id: 'embeddings', name: 'Embeddings', note: 'Turn those pieces into numerical representations.' },
  { id: 'attention', name: 'Attention', note: 'Move useful information between parts of the context.' },
  { id: 'mlp', name: 'MLPs', note: 'Transform the representations.' },
  { id: 'residual', name: 'Residual stream', note: 'Carry the evolving information forward.' },
  { id: 'layers', name: 'More layers', note: 'Repeat these transformations again and again.' },
  { id: 'final', name: 'Final representation', note: 'The last state: everything the model will use to score the next token.' },
];

function closed() {
  const chips = h('div', { class: 'chips' }, ...WORDS.map((w) => h('span', { class: 'chip token' }, w)));
  const unknown = () => h('div', { class: 'qq', 'aria-hidden': 'true' }, '???');
  return h(
    'div',
    { class: 'bb' },
    chips,
    h('div', { class: 'bb-closed' }, h('span', { class: 'arrow', 'aria-hidden': 'true' }, '↓'), unknown(), h('span', { class: 'arrow', 'aria-hidden': 'true' }, '↓'), unknown()),
  );
}

// Each layer is an accordion row: opening it plays that layer's looping figure right under the button.
function stack(onToggle) {
  const rows = LAYERS.map((l, i) => {
    const panel = h(
      'div',
      { class: 'lay-panel', id: `lp-${l.id}` },
      h('div', { class: 'lay-panel-in' }, h('div', { class: 'lay-card' }, VIZ[l.id](), h('p', { class: 'lay-note' }, l.note), h('p', { class: 'lay-watch' }, `${WATCH[l.id]} Simplified illustration.`))),
    );
    const btn = h(
      'button',
      { class: 'lay-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': `lp-${l.id}`, 'data-id': l.id, onClick: () => onToggle(l) },
      h('span', { class: 'lay-name' }, l.name),
      l.id === 'layers' ? h('span', { class: 'lay-x', 'aria-hidden': 'true' }, '× dozens') : null,
    );
    return h('li', { class: `lay lay-${l.id}`, style: { '--i': i } }, btn, panel);
  });
  return h('ol', { class: 'stack', 'aria-label': 'Inside the model, top to bottom' }, h('span', { class: 'spine', 'aria-hidden': 'true' }), ...rows);
}

export default async function run(ctx) {
  const box = closed();
  await ctx.add(box, { hold: 800 });
  ctx.pin(box);
  await ctx.say('Something happens in here.', { cls: 'quiet', hold: 400 });
  await ctx.button('Open the box');
  await ctx.clear({ keep: [box] });

  const visited = new Set();
  let stackEl;
  const open = (id, { count = true } = {}) => {
    const row = stackEl.querySelector(`.lay-${id}`);
    const willOpen = !row.classList.contains('open');
    stackEl.querySelectorAll('.lay').forEach((r) => {
      const on = r === row && willOpen;
      r.classList.toggle('open', on);
      r.querySelector('.lay-btn').setAttribute('aria-expanded', String(on));
    });
    stackEl.classList.toggle('stream-on', willOpen && id === 'residual');
    if (willOpen && count) visited.add(id);
    if (willOpen) setTimeout(() => row.scrollIntoView({ block: 'nearest', behavior: motion.reduced ? 'auto' : 'smooth' }), 650);
  };
  stackEl = stack((layer) => open(layer.id));
  box.classList.add('open');
  const holder = h('div', { class: 'stack-wrap' }, stackEl);
  box.append(holder);
  ctx.learn('transformer');
  await ctx.wait(300);
  holder.classList.add('open');
  await ctx.wait(1700);
  open('tokens', { count: false });
  await ctx.say('Choose a layer to see what it does. Open a few.', { cls: 'caption', hold: 400 });

  // Let curiosity run: Continue appears once they have opened a few layers, and they choose when to leave.
  await ctx.guard(
    new Promise((resolve) => {
      stackEl.addEventListener('click', () => visited.size >= 2 && resolve());
      setTimeout(resolve, 30000);
    }),
  );
  await ctx.button('Run the words through it');
  ctx.pin(null); // from here the closing lines, not the box, are what the visitor needs to see
  await ctx.clear({ keep: [box] });

  // Collapse the layers, then send one pulse down the whole stack: the old "machine runs" page, in place.
  stackEl.querySelectorAll('.lay').forEach((r) => {
    r.classList.remove('open');
    r.querySelector('.lay-btn').setAttribute('aria-expanded', 'false');
  });
  stackEl.classList.remove('stream-on');
  const counter = h('p', { class: 'line caption layer-run', 'aria-hidden': 'true' }, 'layer 0 of 32');
  await ctx.add(counter, { hold: 400 });
  ctx.live('Your words pass through many layers of attention and transformation.');
  const rows = [...stackEl.querySelectorAll('.lay')];
  const dur = 2600 * motion.k;
  const t0 = performance.now();
  await ctx.guard(
    new Promise((resolve) => {
      ctx.loop(() => {
        const p = Math.min((performance.now() - t0) / dur, 1);
        const at = Math.min(rows.length - 1, Math.floor(p * rows.length));
        rows.forEach((r, i) => r.classList.toggle('run', i === at && p < 1));
        counter.textContent = `layer ${Math.max(1, Math.round(p * 32))} of 32`;
        if (p >= 1) {
          resolve();
          return false;
        }
      });
    }),
  );
  await ctx.clear(); // the box has done its job; give the closing lines a clean, roomy stage
  await ctx.say('The words have become a new internal state.', { cls: 'mid', hold: 1000 });
  await ctx.say('There isn’t a little person inside the AI reading the sentence. There is a huge sequence of numerical transformations.', { cls: 'big', hold: 1000 });
  await ctx.say('So what does it do with that state?', { cls: 'quiet', hold: 500 });
  await ctx.say('Simplified: this is the shape of a decoder‑only Transformer, not a literal wiring diagram. Real models have dozens of layers (this run shows 32), and the final state is thousands of numbers.', { cls: 'caption', hold: 400 });
  await ctx.button('Next');
}
