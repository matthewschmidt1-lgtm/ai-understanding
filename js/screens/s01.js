// Screen 1, think of a dog. The only screen that starts with the human, not the machine.
import { h } from '../ui.js';

export const meta = { title: 'Think of a dog' };

const icon = (paths) =>
  h('svg', { viewBox: '0 0 32 32', width: 34, height: 34, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, ...paths);
const ICONS = {
  image: () => icon([h('rect', { x: 4, y: 6, width: 24, height: 20, rx: 3 }), h('circle', { cx: 12, cy: 14, r: 2.4 }), h('path', { d: 'M5 23l7-6 5 4 4-3 7 6' })]),
  sound: () => icon([h('path', { d: 'M4 16h3M10 10v12M15 6v20M20 11v10M25 14v4M29 16h-1' })]),
  memory: () => icon([h('path', { d: 'M16 5a11 11 0 1 0 11 11' }), h('path', { d: 'M16 10v6l4 3' }), h('path', { d: 'M22 3l5 3-3 5' })]),
  other: () => icon([h('circle', { cx: 9, cy: 16, r: 1.6 }), h('circle', { cx: 16, cy: 16, r: 1.6 }), h('circle', { cx: 23, cy: 16, r: 1.6 })]),
};

const BRANCHES = [
  { id: 'image', label: 'image', x: 70 },
  { id: 'sound', label: 'sound', x: 200 },
  { id: 'memory', label: 'memory', x: 330 },
  { id: 'other', label: 'something else', x: 460 },
];

function network(picked) {
  const svg = h('svg', { class: 'net', viewBox: '0 0 530 330', role: 'img', 'aria-label': `A word, “dog”, branching into an image, a sound, a memory and something else, all converging on meaning. You picked ${picked === 'other' ? 'something else' : picked}.` });
  svg.append(h('circle', { cx: 265, cy: 36, r: 30, class: 'n-core' }), h('text', { x: 265, y: 43, class: 'n-core-t' }, 'DOG'));
  BRANCHES.forEach((b, i) => {
    const mine = b.id === picked;
    svg.append(
      h('path', { d: `M265 66 C 265 110, ${b.x} 100, ${b.x} 140`, pathLength: 1, class: 'n-edge draw', style: { '--d': `${0.2 + i * 0.18}s` } }),
      h('path', { d: `M${b.x} 190 C ${b.x} 240, 265 230, 265 270`, pathLength: 1, class: 'n-edge draw', style: { '--d': `${1 + i * 0.18}s` } }),
      h('g', { class: `n-node ${mine ? 'mine' : ''}`, style: { '--d': `${0.5 + i * 0.18}s` } }, h('rect', { x: b.x - 59, y: 140, width: 118, height: 50, rx: 25 }), h('text', { x: b.x, y: 170 }, b.label)),
    );
  });
  svg.append(h('g', { class: 'n-node meaning', style: { '--d': '1.9s' } }, h('rect', { x: 205, y: 270, width: 120, height: 50, rx: 25 }), h('text', { x: 265, y: 300 }, 'meaning')));
  return svg;
}

export default async function run(ctx) {
  await ctx.say('Think of a dog.', { cls: 'big', hold: 1500 });
  await ctx.say('Don’t type anything. Just picture one.', { cls: 'quiet', hold: 600 });

  // A few seconds of intentional silence: a slow breathing ring.
  const ring = h('div', { class: 'breath', 'aria-hidden': 'true' });
  await ctx.add(ring, { hold: 6800 });
  await ctx.clear();

  await ctx.say('What came to mind first?', { cls: 'mid', hold: 700 });
  const { value } = await ctx.choose(
    [
      { value: 'image', label: 'An image', icon: ICONS.image() },
      { value: 'sound', label: 'A sound', icon: ICONS.sound() },
      { value: 'memory', label: 'A memory', icon: ICONS.memory() },
      { value: 'other', label: 'Something else', icon: ICONS.other() },
    ],
    { label: 'What came to mind first?', cls: 'four' },
  );
  ctx.state.set('dog', value);

  await ctx.clear();
  await ctx.say('Interesting.', { cls: 'big', hold: 1300 });
  await ctx.say('Your brain didn’t retrieve just a word.', { cls: 'mid', hold: 1700 });
  await ctx.say('It activated a whole network of associations.', { cls: 'mid', hold: 900 });
  await ctx.add(network(value), { hold: 3200 });
  await ctx.say('Now let’s see what happens when an AI sees the same word.', { cls: 'quiet', hold: 700 });
  await ctx.button('Show me');
}
