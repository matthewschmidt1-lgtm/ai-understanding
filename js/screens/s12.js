// Screen 12, where do you want to go? The doorway to the larger site. Chapters are announced, not faked.
import { h } from '../ui.js';
import { ITEMS } from '../knowledge.js';

export const meta = { title: 'Where next' };

const PATHS = [
  { id: 'learn', title: 'How AI learns', body: 'How billions of tiny weight adjustments create useful representations.' },
  { id: 'reason', title: 'How AI reasons', body: 'How fixed weights can implement surprisingly sophisticated computations.' },
  { id: 'agent', title: 'How AI becomes an agent', body: 'What changes when an LLM gets memory, tools, goals, and the ability to act.' },
  { id: 'human', title: 'Human vs. AI', body: 'What neuroscience can, and cannot, tell us about the comparison.' },
];

export default async function run(ctx) {
  await ctx.say('Keep going', { cls: 'big', hold: 1100 });
  const grid = h(
    'ul',
    { class: 'paths' },
    ...PATHS.map((p, i) =>
      h('li', { class: 'path', style: { '--i': i } }, h('span', { class: 'soon' }, 'Coming next'), h('h2', {}, p.title), h('p', {}, p.body)),
    ),
  );
  await ctx.add(grid, { hold: 1600 });

  const mine = ctx.state.get('sentence');
  if (mine && (mine.a || mine.b)) {
    await ctx.say(['You said: “An LLM isn’t simply ', mine.a || '…', '. It’s ', mine.b || '…', '.”'].join(''), { cls: 'caption strong', hold: 600 });
  }
  const known = new Set(ctx.state.learned());
  const recap = h(
    'ul',
    { class: 'recap', 'aria-label': 'What you now know' },
    ...ITEMS.map((i, n) => h('li', { class: known.has(i.id) ? 'done' : 'ahead', style: { '--i': n } }, h('span', { 'aria-hidden': 'true' }, known.has(i.id) ? '✓ ' : '○ '), i.label, h('span', { class: 'sr-only' }, known.has(i.id) ? ': learned' : ': still ahead'))),
  );
  await ctx.say('What you now know', { cls: 'caption strong', hold: 300 });
  await ctx.add(recap, { hold: 900 });
  await ctx.button('Start again', { variant: 'ghost' });
  document.getElementById('restart').click();
}
