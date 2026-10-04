// Screen 6, open the black box. The same five words go in; a stack of operations comes out.
import { h } from '../ui.js';
import { motion } from '../engine.js';
import { VIZ, WATCH } from '../layerviz.js';

export const meta = { title: 'Open the black box' };

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
      h('div', { class: 'lay-panel-in' }, h('div', { class: 'lay-card' }, VIZ[l.id](), h('p', { class: 'lay-note' }, l.note), h('p', { class: 'lay-watch' }, WATCH[l.id]))),
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
  await ctx.add(box, { hold: 1200 });
  await ctx.say('Something happens in here.', { cls: 'quiet', hold: 600 });
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
  await ctx.wait(500);
  holder.classList.add('open');
  await ctx.wait(2600);
  open('tokens', { count: false });
  await ctx.say('Choose a layer to see what it does. Open a few.', { cls: 'caption', hold: 400 });

  // Let curiosity run: Continue appears once they have opened a few layers, and they choose when to leave.
  await ctx.guard(
    new Promise((resolve) => {
      stackEl.addEventListener('click', () => visited.size >= 3 && resolve());
      setTimeout(resolve, 45000 * motion.k);
    }),
  );
  await ctx.button('Continue', { variant: 'ghost' });
  await ctx.clear({ keep: [box] });
  await ctx.say('There isn’t a little person inside the AI reading the sentence.', { cls: 'mid', hold: 2300 });
  await ctx.say('There is a huge sequence of numerical transformations.', { cls: 'big', hold: 1800 });
  await ctx.say('Simplified: this is the shape of a decoder-only Transformer, not a literal wiring diagram.', { cls: 'caption', hold: 500 });
  await ctx.button('Run the machine');
}
