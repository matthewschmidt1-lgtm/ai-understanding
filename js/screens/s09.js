// Screen 9, the moment of doubt. Everything goes quiet, then two trees of "dog" appear side by side.
import { h } from '../ui.js';

export const meta = { title: 'The moment of doubt' };

const HUMAN = ['images', 'sounds', 'memories', 'emotions', 'physical experience', 'language', 'relationships'];
const LLM = ['representations', 'relationships', 'context', 'transformations', 'probabilities', 'predictions'];

function tree(kind, title, items) {
  return h(
    'section',
    { class: `tree ${kind}`, 'aria-label': `${title}: what “dog” connects to` },
    h('h2', { class: 'tree-h' }, title),
    h('div', { class: 'tree-root' }, 'DOG'),
    h('ul', {}, ...items.map((t, i) => h('li', { style: { '--i': i } }, t))),
  );
}

export default async function run(ctx) {
  await ctx.clear({ ms: 100 });
  ctx.theme('ink');
  ctx.mix(0.8);
  await ctx.wait(1400);
  await ctx.say('Wait.', { cls: 'hero-word', hold: 2600 });
  await ctx.say('You just watched an AI turn numbers into language.', { cls: 'mid', hold: 2800 });
  await ctx.say('But humans do something strangely similar.', { cls: 'mid', hold: 2600 });
  await ctx.clear();

  const trees = h('div', { class: 'trees' }, tree('human', 'HUMAN', HUMAN), tree('llm', 'LLM', LLM));
  await ctx.add(trees, { hold: 4200 });
  await ctx.say('They aren’t the same.', { cls: 'big', hold: 2000 });
  await ctx.say('A human has encountered dogs in the world. A language model learns patterns from data about dogs.', { cls: 'quiet', hold: 2800 });
  await ctx.say('But an LLM can use those learned representations in ways that look remarkably like understanding.', { cls: 'mid', hold: 800 });
  await ctx.button('Next');
}
