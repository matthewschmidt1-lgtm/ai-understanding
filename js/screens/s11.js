// Screen 11, the final reveal. Two different roads into "dog", one shared question, and the visitor's own words.
import { h } from '../ui.js';

export const meta = { title: 'The final reveal' };

const chain = (kind, items, label) =>
  h('ol', { class: `chain ${kind}`, 'aria-label': label }, ...items.map((t, i) => h('li', { style: { '--i': i } }, t)));

function reveal() {
  return h(
    'figure',
    { class: 'final', 'aria-label': 'Around the word dog: a human goes from experience to representation to computation to prediction to understanding, a model goes from data to representation to computation to prediction to understanding. Both end at the same open question.' },
    h('div', { class: 'f-word' }, 'dog'),
    h(
      'div',
      { class: 'f-grid' },
      h('div', { class: 'f-col human' }, h('h3', { 'aria-hidden': 'true' }, 'Human'), chain('human', ['experience', 'representation', 'computation', 'prediction'], 'Human')),
      h('div', { class: 'f-col ai' }, h('h3', { 'aria-hidden': 'true' }, 'AI'), chain('ai', ['data', 'representation', 'computation', 'prediction'], 'AI')),
    ),
    h('svg', { class: 'f-join', viewBox: '0 0 100 24', preserveAspectRatio: 'none', 'aria-hidden': 'true' }, h('path', { d: 'M25 0 C 25 16, 50 8, 50 24', class: 'j human', pathLength: 1 }), h('path', { d: 'M75 0 C 75 16, 50 8, 50 24', class: 'j ai', pathLength: 1 })),
    h('div', { class: 'f-q' }, 'understanding?'),
  );
}

function completion() {
  const a = h('input', { class: 'blank', type: 'text', id: 'blank-a', maxlength: 70, autocomplete: 'off', 'aria-label': 'An LLM isn’t simply…', placeholder: '…' });
  const b = h('input', { class: 'blank', type: 'text', id: 'blank-b', maxlength: 90, autocomplete: 'off', 'aria-label': 'It’s…', placeholder: '…' });
  const form = h(
    'form',
    { class: 'complete', novalidate: true },
    h('p', { class: 'cs' }, h('span', { class: 'cs-line' }, 'An LLM isn’t simply ', a, '.'), h('span', { class: 'cs-line' }, 'It’s ', b, '.')),
    h('div', { class: 'cs-actions' }, h('button', { class: 'btn primary', type: 'submit' }, h('span', { class: 'btn-label' }, 'Keep it'), h('span', { class: 'btn-arrow', 'aria-hidden': 'true' }, '→')), h('button', { class: 'btn ghost', type: 'button', id: 'skip' }, h('span', { class: 'btn-label' }, 'Skip'))),
  );
  return { form, a, b };
}

export default async function run(ctx) {
  const fig = reveal();
  await ctx.add(fig, { hold: 1200 });
  await ctx.wait(4200);
  await ctx.say('Maybe the interesting question isn’t whether AI thinks like us.', { cls: 'mid', hold: 3000 });
  await ctx.say('Maybe it’s how something so different can produce behavior that looks so familiar.', { cls: 'mid', hold: 7000 });

  await ctx.clear();
  await ctx.say('One last thing. In your own words, complete this sentence.', { cls: 'mid', hold: 500 });
  const c = completion();
  await ctx.add(c.form, { hold: 400 });

  const mine = await ctx.guard(
    new Promise((resolve) => {
      c.form.addEventListener('submit', (e) => {
        e.preventDefault();
        resolve({ a: c.a.value.trim(), b: c.b.value.trim() });
      });
      c.form.querySelector('#skip').addEventListener('click', () => resolve(null));
    }),
  );
  await ctx.clear();

  if (mine && (mine.a || mine.b)) {
    ctx.state.set('sentence', mine);
    const quote = h('blockquote', { class: 'mine' }, 'An LLM isn’t simply ', h('em', {}, mine.a || '…'), '. It’s ', h('em', {}, mine.b || '…'), '.');
    await ctx.add(quote, { hold: 2600 });
    await ctx.say('That is yours. There’s no grading here.', { cls: 'quiet', hold: 900 });
  } else {
    await ctx.say('That’s fine. The question will keep.', { cls: 'quiet', hold: 1200 });
  }
  await ctx.button('Keep going');
}
