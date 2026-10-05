// Section: predict the next token. A probability distribution, one token at a time.
import { h } from '../ui.js';
import { NEXT_FRANCE, NEXT_AFTER_PARIS, distribution, sample } from '../model.js';

const label = (p) => (p < 0.005 ? '<1%' : `${Math.round(p * 100)}%`);

// Top few tokens plus everything else, from a full distribution.
function topRows(dist, n = 4) {
  const sorted = dist.filter((d) => !d.token.startsWith('(')).sort((a, b) => b.p - a.p); // "(rare)" and "(other)" fold into the last row
  const top = sorted.slice(0, n);
  const rest = 1 - top.reduce((s, d) => s + d.p, 0);
  return [...top, { token: '… all others', p: Math.max(rest, 0), other: true }];
}

function chart() {
  const el = h('div', { class: 'bars', role: 'img' });
  let rows = [];
  function set(dist, { grow = true } = {}) {
    const data = topRows(dist);
    if (rows.length !== data.length) {
      el.replaceChildren();
      rows = data.map(() => ({
        row: h('div', { class: 'brow' }),
        name: h('span', { class: 'bl' }),
        fill: h('span', { class: 'bfill' }),
        pct: h('span', { class: 'bp' }),
      }));
      rows.forEach((r) => {
        r.row.append(r.name, h('span', { class: 'btrack', 'aria-hidden': 'true' }, r.fill), r.pct);
        el.append(r.row);
      });
    }
    data.forEach((d, i) => {
      const r = rows[i];
      r.name.textContent = d.token;
      r.row.classList.toggle('other', !!d.other);
      r.pct.textContent = label(d.p);
      r.fill.style.transform = `scaleX(${grow ? d.p : 0})`;
    });
    el.setAttribute('aria-label', 'Probabilities for the next token: ' + data.map((d) => `${d.token} ${label(d.p)}`).join(', '));
    return data;
  }
  return { el, set, rows: () => rows };
}

export default async function run(ctx) {
  const slot = h('span', { class: 'p-slot' });
  const prompt = h('p', { class: 'prompt', 'aria-label': 'The capital of France is' }, h('span', {}, 'The capital of France is'), slot, h('span', { class: 'caret', 'aria-hidden': 'true' }));
  await ctx.add(prompt, { hold: 1000 });
  ctx.pin(prompt);
  ctx.learn('probability');

  const c = chart();
  await ctx.add(c.el, { hold: 300 });
  c.set(distribution(NEXT_FRANCE), { grow: false });
  await ctx.wait(300);
  c.set(distribution(NEXT_FRANCE));
  await ctx.wait(1100);

  await ctx.say('The model doesn’t hand back one fixed answer. It produces a probability distribution over possible next tokens.', { cls: 'mid', hold: 3000 });

  // Paris is chosen and folds into the sentence.
  c.el.classList.add('chosen');
  c.el.querySelector('.brow').classList.add('win');
  await ctx.wait(600);
  slot.textContent = ' Paris';
  slot.classList.add('in');
  await ctx.wait(800);
  await ctx.say('And now “Paris” becomes part of the context.', { cls: 'mid', hold: 1000 });

  // The new context gets its own prediction: the loop.
  c.el.classList.remove('chosen');
  c.set(distribution(NEXT_AFTER_PARIS));
  c.el.querySelector('.brow').classList.add('win');
  await ctx.wait(1300);
  slot.textContent = ' Paris.';
  await ctx.wait(500);
  await ctx.say('The sentence gets fed back into the system.', { cls: 'mid', hold: 500 });

  const flow = ['prompt', 'prediction', 'new token', 'updated context'];
  const loop = h(
    'div',
    { class: 'loopflow', role: 'img', 'aria-label': 'A loop: prompt, prediction, new token, updated context, and back to prediction, again and again.' },
    ...flow.flatMap((f, i) => [h('span', { class: 'chip step', style: { '--i': i } }, f), i < flow.length - 1 ? h('span', { class: 'arrow', 'aria-hidden': 'true' }, '→') : null]),
    h('span', { class: 'again', 'aria-hidden': 'true' }, h('b', {}, '↺'), ' repeat'),
  );
  await ctx.add(loop, { hold: 900 });
  await ctx.say('One token at a time.', { cls: 'big', hold: 1500 });

  // Play: same scores, different draws.
  await ctx.clear();
  await ctx.say('Try it. Here are the model’s scores for what follows “The capital of France is.” Draw from them yourself.', { cls: 'mid', hold: 200 });
  const play = chart();
  const tally = new Map();
  const tallyEl = h('div', { class: 'tally', 'aria-live': 'polite' }, h('span', { class: 'tally-empty' }, 'Nothing drawn yet.'));
  const slider = h('input', { type: 'range', min: 0.2, max: 2.5, step: 0.1, value: 1, id: 'temp', 'aria-describedby': 'temp-note' });
  const tempVal = h('output', { for: 'temp' }, '1.0');
  const draw = h('button', { class: 'btn ghost', type: 'button' }, h('span', { class: 'btn-label' }, 'Draw a token'));
  const redraw = () => play.set(distribution(NEXT_FRANCE, Number(slider.value)));
  slider.addEventListener('input', () => {
    tempVal.textContent = Number(slider.value).toFixed(1);
    redraw();
  });
  draw.addEventListener('click', () => {
    const t = sample(distribution(NEXT_FRANCE, Number(slider.value)));
    tally.set(t, (tally.get(t) || 0) + 1);
    const total = [...tally.values()].reduce((a, b) => a + b, 0);
    tallyEl.replaceChildren(h('span', { class: 'tally-n' }, `${total} drawn`), ...[...tally.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => h('span', { class: 'chip tally-chip' }, k, h('b', {}, `×${v}`))));
  });
  const controls = h('div', { class: 'ctl' }, h('label', { for: 'temp' }, 'Randomness'), slider, tempVal, draw);
  await ctx.add(play.el, { hold: 100 });
  redraw();
  await ctx.add(controls, { hold: 100 });
  await ctx.add(tallyEl, { hold: 0 });
  await ctx.say('The model’s raw scores stay the same. The dial reshapes them into probabilities before one is drawn: low randomness makes the top token almost certain; high randomness lets unlikely ones through.', { id: 'temp-note', cls: 'caption', hold: 400 });
  await ctx.say('Simplified: the probabilities are illustrative, and real models split text into tokens differently from whole words.', { cls: 'caption', hold: 500 });
  await ctx.button('Next');
}
