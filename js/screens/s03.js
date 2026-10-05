// Screen 3, a tiny latent space. Meaning as geometry: related things sit near each other.
import { h } from '../ui.js';
import { LATENT, nearest } from '../model.js';

export const meta = { title: 'A tiny latent space' };


function field() {
  const lines = h('svg', { class: 'lat-lines', viewBox: '0 0 100 100', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
  const wrap = h('div', { class: 'field', role: 'group', 'aria-label': 'A two-dimensional map of words. Dog sits at left, with wolf above, cat to the right and car at the lower right.' }, lines);
  const pts = {};
  const place = (id, [x, y]) => {
    pts[id].style.left = `${x}%`;
    pts[id].style.top = `${y}%`;
  };
  const make = (id, { pickable = false, faint = false } = {}) => {
    const b = h('button', { class: `pt ${id === 'dog' ? 'is-dog' : ''} ${faint ? 'faint' : ''}`, type: 'button', 'data-id': id, tabindex: pickable || id === 'dog' ? 0 : -1 }, h('span', { class: 'dot', 'aria-hidden': 'true' }), h('span', { class: 'lab' }, id));
    pts[id] = b;
    wrap.append(b);
    place(id, LATENT.start[id] || LATENT.settled[id]);
    return b;
  };
  Object.keys(LATENT.start).forEach((id) => make(id));
  return { wrap, lines, pts, place, make };
}

// Draw lines from `id` to its nearest neighbors, labelled with the illustrative similarity.
function neighbors(f, id, positions, k = 3) {
  f.lines.replaceChildren();
  f.wrap.querySelectorAll('.simv').forEach((n) => n.remove());
  f.wrap.querySelectorAll('.pt').forEach((p) => p.classList.toggle('sel', p.dataset.id === id));
  const here = positions[id];
  nearest(id, positions, k).forEach(({ id: other, sim }) => {
    const to = positions[other];
    f.lines.append(h('line', { x1: here[0], y1: here[1], x2: to[0], y2: to[1], class: 'lat-line', style: { 'stroke-opacity': 0.25 + sim * 0.6, 'stroke-width': 1 + sim * 2.4 } }));
    f.pts[other].append(h('span', { class: 'simv' }, sim.toFixed(2)));
  });
}

export default async function run(ctx) {
  const q = await ctx.say('Which is more like “dog”?', { cls: 'mid', hold: 600 });
  const f = field();
  await ctx.add(f.wrap, { hold: 500 });
  ctx.pin(f.wrap);
  const note = await ctx.say('A flat map. Where the words sit is placed by hand, for illustration.', { cls: 'caption', hold: 200 });
  ctx.learn('latent');

  // Cat, wolf or car: the visitor picks one of the words on the map.
  const picked = await ctx.guard(
    new Promise((resolve) => {
      ['cat', 'wolf', 'car'].forEach((id) => {
        f.pts[id].classList.add('askable');
        f.pts[id].tabIndex = 0;
        f.pts[id].addEventListener('click', () => resolve(id), { once: true });
      });
    }),
  );
  ['cat', 'wolf', 'car'].forEach((id) => f.pts[id].classList.remove('askable'));
  f.pts[picked].classList.add('chosen');
  const related = picked !== 'car';

  if (related) {
    await ctx.say('Exactly.', { cls: 'big', hold: 900 });
    await ctx.say('You’re thinking about a relationship.', { cls: 'mid', hold: 1700 });
  } else {
    await ctx.wait(500);
    await ctx.say('Interesting choice.', { cls: 'big', hold: 1100 });
    await ctx.say('What made you choose it?', { cls: 'mid', hold: 400 });
    const why = await ctx.choose(
      [
        { value: 'move', label: 'They can both move' },
        { value: 'humans', label: 'Humans interact with them' },
        { value: 'other', label: 'Something else' },
      ],
      { label: 'What made you choose it?', cls: 'row' },
    );
    ctx.state.set('latentWhy', why.value);
    await ctx.clear({ keep: [q, f.wrap] });
    await ctx.say('That’s a real relationship too.', { cls: 'mid', hold: 1500 });
    await ctx.say('A space with thousands of dimensions can hold many of them at once.', { cls: 'quiet', hold: 1800 });
    // Now show the arrangement a trained model tends to settle on.
    f.place('cat', LATENT.settled.cat);
    f.place('wolf', LATENT.settled.wolf);
    await ctx.wait(1000);
  }

  await ctx.wait(800);
  await ctx.clear({ keep: [q, f.wrap] });
  await ctx.say('A useful representation isn’t just a label.', { cls: 'mid', hold: 1400 });
  await ctx.say('It captures relationships.', { cls: 'big', hold: 2200 });
  await ctx.clear({ keep: [q, f.wrap] });

  // The field fills out; positions settle into the trained arrangement.
  await ctx.say('AI models learn enormous numbers of these relationships in very high-dimensional spaces.', { cls: 'mid', hold: 400 });
  Object.keys(LATENT.start).forEach((id) => f.place(id, LATENT.settled[id]));
  for (const id of LATENT.extra) {
    f.make(id, { faint: true });
    await ctx.wait(160);
  }
  f.wrap.querySelectorAll('.pt').forEach((p) => (p.tabIndex = 0));
  f.wrap.classList.add('explore');
  await ctx.wait(900);

  neighbors(f, 'dog', LATENT.settled);
  f.wrap.addEventListener('click', (e) => {
    const p = e.target.closest('.pt');
    if (p) neighbors(f, p.dataset.id, LATENT.settled);
  });
  await ctx.say('This is the intuition behind “latent space.”', { cls: 'caption strong', hold: 400 });
  await ctx.say('Simplified: a flat shadow of a space with thousands of dimensions, with positions placed by hand. The small numbers are similarity (1 means identical). Tap any word to see its nearest neighbors.', { cls: 'caption', hold: 500 });
  await ctx.button('Next');
}
