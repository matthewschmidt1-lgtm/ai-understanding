// Screen 6, open the black box. The same five words go in; a stack of operations comes out.
import { h } from '../ui.js';
import { motion } from '../engine.js';

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

function stack(onPick) {
  const rows = LAYERS.map((l, i) =>
    h(
      'li',
      { class: `lay lay-${l.id}`, style: { '--i': i } },
      h('button', { class: 'lay-btn', type: 'button', 'aria-pressed': 'false', 'data-id': l.id, onClick: (e) => onPick(l, e.currentTarget) }, h('span', { class: 'lay-name' }, l.name), l.id === 'layers' ? h('span', { class: 'lay-x', 'aria-hidden': 'true' }, '× dozens') : null),
    ),
  );
  return h('ol', { class: 'stack', 'aria-label': 'Inside the model, top to bottom' }, h('span', { class: 'spine', 'aria-hidden': 'true' }), ...rows);
}

export default async function run(ctx) {
  const box = closed();
  await ctx.add(box, { hold: 1200 });
  await ctx.say('Something happens in here.', { cls: 'quiet', hold: 600 });
  await ctx.button('Open the box');
  await ctx.clear({ keep: [box] });

  const visited = new Set();
  const desc = h('p', { class: 'lay-desc', 'aria-live': 'polite' }, 'Choose a layer.');
  const stackEl = stack((layer, btn) => {
    stackEl.querySelectorAll('.lay-btn').forEach((b) => {
      b.setAttribute('aria-pressed', String(b === btn));
      b.classList.toggle('on', b === btn);
    });
    stackEl.classList.toggle('stream-on', layer.id === 'residual');
    desc.textContent = layer.note;
    visited.add(layer.id);
  });
  box.classList.add('open');
  const holder = h('div', { class: 'stack-wrap' }, stackEl);
  box.append(holder);
  ctx.learn('transformer');
  await ctx.wait(500);
  holder.classList.add('open');
  await ctx.wait(2600);
  await ctx.add(desc, { hold: 1200 });
  await ctx.say('Each part can be opened. Try a few.', { cls: 'caption', hold: 400 });

  // Let curiosity run: continue once they have looked at a few, or after a while.
  await ctx.guard(
    new Promise((resolve) => {
      const check = () => visited.size >= 3 && resolve();
      stackEl.addEventListener('click', check);
      setTimeout(resolve, 24000 * motion.k);
    }),
  );
  await ctx.clear({ keep: [box] });
  await ctx.say('There isn’t a little person inside the AI reading the sentence.', { cls: 'mid', hold: 2300 });
  await ctx.say('There is a huge sequence of numerical transformations.', { cls: 'big', hold: 1800 });
  await ctx.say('Simplified: this is the shape of a decoder-only Transformer, not a literal wiring diagram.', { cls: 'caption', hold: 500 });
  await ctx.button('Run the machine');
}
