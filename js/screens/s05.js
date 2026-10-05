// Screen 5, attention. Hover a word and watch which earlier words it draws on.
import { h } from '../ui.js';
import { SENTENCE, HEADS, attentionFrom } from '../model.js';

export const meta = { title: 'Attention' };

const IT = SENTENCE.indexOf('it');

function build() {
  const arcs = h('svg', { class: 'arcs', 'aria-hidden': 'true' });
  const toks = SENTENCE.map((w, i) =>
    h(
      'button',
      { class: `tok ${i === IT ? 'hint' : ''}`, type: 'button', 'data-i': i, 'aria-pressed': 'false' },
      h('span', { class: 'tok-w' }, w),
      h('span', { class: 'tok-bar', 'aria-hidden': 'true' }),
      h('span', { class: 'tok-pct', 'aria-hidden': 'true' }),
    ),
  );
  const wrap = h(
    'div',
    { class: 'sent', role: 'group', 'aria-label': 'The sentence “The dog chased the ball because it was moving.” Choose a word to see which earlier words it draws on.' },
    arcs,
    h('div', { class: 'toks' }, ...toks),
  );
  return { wrap, arcs, toks };
}

export default async function run(ctx) {
  await ctx.say('The model reads a sentence.', { cls: 'quiet', hold: 800 });
  const ui = build();
  let head = 'A';
  let active = -1;

  const anchor = (el, box) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - box.left, y: r.top - box.top };
  };

  function show(i) {
    active = i;
    const weights = attentionFrom(i, head);
    const box = ui.wrap.getBoundingClientRect();
    ui.arcs.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    ui.arcs.replaceChildren();
    const from = anchor(ui.toks[i].querySelector('.tok-w'), box);
    ui.toks.forEach((t, j) => {
      const w = weights[j];
      const self = j === i;
      t.classList.toggle('src', self);
      t.classList.toggle('lit', !self && w > 0.03);
      t.setAttribute('aria-pressed', String(self));
      t.style.setProperty('--w', w >= 0.015 ? w : 0);
      t.querySelector('.tok-pct').textContent = w > 0.015 ? `${Math.round(w * 100)}%` : '';
      if (self || w < 0.03) return;
      const to = anchor(t.querySelector('.tok-w'), box);
      // On a wrapped line, earlier words sit on the row above: arc up into the gap and land under them.
      const sameRow = Math.abs(to.y - from.y) < 8;
      let d;
      if (sameRow) {
        const lift = 26 + Math.min(70, Math.abs(to.x - from.x) * 0.22);
        const top = Math.min(from.y, to.y) - 4;
        d = `M${from.x} ${from.y - 4} C ${from.x} ${top - lift}, ${to.x} ${top - lift}, ${to.x} ${to.y - 4}`;
      } else {
        const landing = t.getBoundingClientRect().bottom - box.top + 2;
        d = `M${from.x} ${from.y - 4} C ${from.x} ${from.y - 36}, ${to.x} ${landing + 36}, ${to.x} ${landing}`;
      }
      ui.arcs.append(
        h('path', {
          d,
          class: 'arc',
          pathLength: 1,
          style: { 'stroke-width': 1 + w * 7, 'stroke-opacity': 0.25 + w * 0.7 },
        }),
      );
    });
  }

  await ctx.add(ui.wrap, { hold: 1000 });
  ctx.pin(ui.wrap);
  const hint = await ctx.say('Hover over “it.” On a touch screen, tap it.', { cls: 'quiet', hold: 0 });
  ctx.learn('attention');

  // Pointer, focus and tap all select a word; the first time it is "it" the story continues.
  const first = new Promise((resolve) => {
    const pick = (e) => {
      const t = e.target.closest('.tok');
      if (!t) return;
      const i = Number(t.dataset.i);
      show(i);
      if (i === IT) resolve();
    };
    ui.wrap.addEventListener('pointerover', pick);
    ui.wrap.addEventListener('focusin', pick);
    ui.wrap.addEventListener('click', pick);
  });
  ctx.on(window, 'resize', () => active >= 0 && show(active));
  await ctx.guard(first);
  ui.toks[IT].classList.remove('hint');
  await ctx.out(hint, 400);

  await ctx.say('To predict what comes next, the model needs useful information from elsewhere in the sentence.', { cls: 'mid', hold: 2400 });
  await ctx.say('Attention', { cls: 'big', hold: 800 });
  await ctx.say('Attention is a mechanism for letting different parts of the context influence one another.', { cls: 'mid', hold: 2400 });

  const note = h('p', { class: 'line caption strong' }, `${HEADS[0].label} ${HEADS[0].note}.`);
  const heads = h(
    'div',
    { class: 'heads', role: 'group', 'aria-label': 'Attention pattern' },
    ...HEADS.map((hd) =>
      h(
        'button',
        {
          class: `seg ${hd.id === head ? 'on' : ''}`,
          type: 'button',
          'aria-pressed': String(hd.id === head),
          onClick: (e) => {
            head = hd.id;
            heads.querySelectorAll('.seg').forEach((s) => {
              s.classList.toggle('on', s === e.currentTarget);
              s.setAttribute('aria-pressed', String(s === e.currentTarget));
            });
            note.textContent = `${hd.label} ${hd.note}.`;
            if (active >= 0) show(active);
          },
        },
        hd.label,
      ),
    ),
  );
  await ctx.add(heads, { hold: 200 });
  await ctx.add(note, { hold: 1600 });

  await ctx.say('Described mechanically, it’s computing relationships within the context. Whether that counts as “thinking about” the sentence is a question we’ll come back to.', { cls: 'mid', hold: 2200 });
  await ctx.say('Simplified: these patterns are hand-written. Real models learn many patterns at once, and each word can only look backward. Each word’s percentages add up to 100%, and the share on the word itself is shown too.', { cls: 'caption', hold: 500 });
  await ctx.say('If every word can draw on the words before it, what could happen when you stack dozens of these layers?', { cls: 'mid', hold: 600 });
  await ctx.button('Look inside');
}
