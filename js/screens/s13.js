// Screen 13, how AI learns. A tiny model really trains here: it reads sentences, guesses the next
// word, and nudges its weights. The word map from screen 3 builds itself.
import { h } from '../ui.js';
import { motion } from '../engine.js';
import { createLearner } from '../model.js';

export const meta = { title: 'How AI learns' };

const SHOWN = ['the', 'dog', 'cat', 'wolf', 'car', 'truck', 'chased', 'ate', 'slept', 'drove', 'stopped', 'fast'];
const GROUPS = [
  ['animal', ['dog', 'cat', 'wolf']],
  ['vehicle', ['car', 'truck']],
  ['action', ['ate', 'slept', 'drove', 'stopped', 'fast', 'chased']],
];
const nice = (t) => (t === '.' ? '(end)' : t);
const pctText = (p) => (p < 0.005 ? '<1%' : `${Math.round(p * 100)}%`);

function build() {
  const pts = {};
  const field = h('div', { class: 'field live learn', role: 'group', 'aria-label': 'A map of twelve words. Where each word sits is decided by the model’s weights.' });
  SHOWN.forEach((w) => {
    pts[w] = h('button', { class: 'pt', type: 'button', 'data-id': w }, h('span', { class: 'dot', 'aria-hidden': 'true' }), h('span', { class: 'lab' }, w));
    field.append(pts[w]);
  });
  // Guess panel: the model's next-word probabilities for the chosen word.
  const guessTitle = h('p', { class: 'lp-title' });
  const guessRows = Array.from({ length: 6 }, () => ({ name: h('span', { class: 'bl' }), fill: h('span', { class: 'bfill' }), pct: h('span', { class: 'bp' }) }));
  const guess = h('div', { class: 'lp-card' }, guessTitle, h('div', { class: 'bars', role: 'img' }, ...guessRows.map((r) => h('div', { class: 'brow' }, r.name, h('span', { class: 'btrack', 'aria-hidden': 'true' }, r.fill), r.pct))));
  // Miss panel: how wrong the guesses are, over time.
  const sparkPath = h('path', { class: 'sp-line', d: '' });
  const missNow = h('strong', {}, '');
  const spark = h('div', { class: 'lp-card' }, h('p', { class: 'lp-title' }, 'How far off its scores are'), h('svg', { class: 'spark', viewBox: '0 0 200 60', preserveAspectRatio: 'none', 'aria-hidden': 'true' }, h('path', { class: 'sp-base', d: 'M0 59 H200' }), sparkPath), h('p', { class: 'sp-read' }, 'Average miss: ', missNow, h('span', { class: 'sr-only' }, ' (lower is better)')), h('p', { class: 'sp-read sp-sentences' }, ''));
  const panel = h('div', { class: 'lp' }, guess, spark);
  return { field, pts, panel, guessTitle, guessRows, guess, sparkPath, missNow, sentencesRead: spark.querySelector('.sp-sentences') };
}

export default async function run(ctx) {
  const L = createLearner(2);
  const ui = build();
  let selected = 'dog';
  let scale = 30;

  // Centre the embeddings on their middle, fit the typical spread to the field, and softly compress
  // outliers so one far-off word cannot squash everyone else. The view eases so words glide.
  function layout(snap = false) {
    const raw = SHOWN.map((w) => L.embedding(w));
    const cx = raw.reduce((s, p) => s + p[0], 0) / raw.length;
    const cy = raw.reduce((s, p) => s + p[1], 0) / raw.length;
    const spread = raw.map((p) => Math.max(Math.abs(p[0] - cx), Math.abs(p[1] - cy))).sort((a, b) => a - b);
    const target = 26 / Math.max(spread[Math.floor(spread.length / 2)], 0.3);
    scale = snap ? target : scale + (target - scale) * 0.12;
    const squash = (v, limit) => limit * Math.tanh(v / limit);
    const W = ui.field.clientWidth || 500;
    const H = ui.field.clientHeight || 320;
    const placed = SHOWN.map((w, i) => ({
      w,
      x: 50 + squash((raw[i][0] - cx) * scale, 41),
      y: 50 + squash((raw[i][1] - cy) * scale * 0.8, 38),
    }));
    // Words that land on (nearly) the same spot are the point of this page, so give every label its own
    // room: try below, above, right, left, then further out, and avoid other labels and other dots.
    const dots = placed.map((p) => ({ x: (p.x / 100) * W, y: (p.y / 100) * H }));
    const rects = [];
    placed.slice().sort((a, b) => a.y - b.y || a.x - b.x).forEach((p) => {
      const px = (p.x / 100) * W;
      const py = (p.y / 100) * H;
      const w = p.w.length * 8.6 + 10;
      const spots = [[0, 0], [0, -34], [w / 2 + 12, -17], [-(w / 2 + 12), -17], [0, 17], [0, -51], [w / 2 + 12, 4], [-(w / 2 + 12), 4], [0, 34]];
      let best = spots[0];
      for (const [dx, dy] of spots) {
        const cx = px + dx;
        const top = py + 8 + dy;
        const hitsLabel = rects.some((r) => Math.abs(r.x - cx) < (r.w + w) / 2 && Math.abs(r.y - top) < 17);
        const hitsDot = dots.some((d) => d.x > cx - w / 2 - 6 && d.x < cx + w / 2 + 6 && d.y > top - 6 && d.y < top + 23 && !(Math.abs(d.x - px) < 1 && Math.abs(d.y - py) < 1));
        if (!hitsLabel && !hitsDot) {
          best = [dx, dy];
          break;
        }
        best = [dx, dy];
      }
      rects.push({ x: px + best[0], y: py + 8 + best[1], w });
      ui.pts[p.w].style.left = `${p.x}%`;
      ui.pts[p.w].style.top = `${p.y}%`;
      ui.pts[p.w].querySelector('.lab').style.translate = `${best[0]}px ${best[1]}px`;
    });
  }

  function showGuess() {
    const dist = L.predict(selected);
    const top = dist.slice(0, 5);
    const rest = 1 - top.reduce((s, d) => s + d.p, 0);
    const rows = [...top, { token: 'all others', p: rest, other: true }];
    ui.guessTitle.textContent = `After “${selected},” its scores:`;
    ui.guessRows.forEach((r, i) => {
      r.name.textContent = nice(rows[i].token);
      r.name.classList.toggle('other', !!rows[i].other);
      r.pct.textContent = pctText(rows[i].p);
      r.fill.style.transform = `scaleX(${rows[i].p})`;
    });
    ui.guess.querySelector('.bars').setAttribute('aria-label', rows.map((r) => `${nice(r.token)} ${pctText(r.p)}`).join(', '));
    Object.entries(ui.pts).forEach(([w, el]) => el.classList.toggle('sel', w === selected));
  }

  function showMiss() {
    const hst = L.history;
    const maxReads = Math.max(200, hst[hst.length - 1][0]);
    const top = hst[0][1];
    ui.sparkPath.setAttribute('d', hst.map(([n, v], i) => `${i ? 'L' : 'M'}${(n / maxReads) * 200} ${59 - (v / top) * 52}`).join(' '));
    ui.missNow.textContent = L.meanLoss().toFixed(2);
    ui.sentencesRead.textContent = `${L.reads} sentence${L.reads === 1 ? '' : 's'} fed to it`;
  }

  const refresh = () => {
    layout();
    showGuess();
    showMiss();
  };

  // ----- the story -----
  await ctx.say('Earlier, we placed the words by hand.', { cls: 'quiet', hold: 1500 });
  await ctx.say('So who places them in a real model?', { cls: 'big', hold: 2200 });
  await ctx.say('Here is a model on day one. Every word sits wherever its starting numbers happen to put it.', { cls: 'mid', hold: 2600 });
  await ctx.clear({ ms: 450 });
  const caption = await ctx.say('Day one: a model nobody has taught anything yet.', { cls: 'quiet', hold: 300 });
  layout(true);
  showGuess();
  showMiss();
  await ctx.add(ui.field, { hold: 600 });
  layout(true);
  ctx.pin(ui.field);
  await ctx.add(ui.panel, { hold: 400 });
  ctx.learn('learning');
  await ctx.say(`${L.weightCount} numbers (weights) decide all of it. Its only task: score every possible next word.`, { cls: 'quiet', hold: 1200 });

  ui.field.addEventListener('click', (e) => {
    const p = e.target.closest('.pt');
    if (!p) return;
    selected = p.dataset.id;
    showGuess();
  });

  // One sentence: a visible nudge.
  await ctx.button('Feed it one sentence');
  const first = L.read();
  const keep = [caption, ui.field, ui.panel]; // the map and its panels stay; the words under them take turns
  await ctx.clear({ keep, ms: 350 });
  await ctx.say(`It was fed: “${first.text.replace(' .', '.')}”`, { cls: 'mid', hold: 600 });
  ui.field.classList.remove('live');
  refresh();
  L.record();
  showMiss();
  await ctx.wait(1800);
  await ctx.clear({ keep, ms: 350 });
  await ctx.say('Its scores were off, so every weight moved a tiny bit toward better scores. That nudge is what “learning” means here.', { cls: 'mid', hold: 3600 });
  await ctx.clear({ keep, ms: 350 });
  await ctx.say('One sentence barely changes anything. Feed it a few hundred.', { cls: 'quiet', hold: 500 });
  await ctx.button('Feed it 200 sentences');

  // Many sentences: the map organizes itself while we watch.
  ui.field.classList.add('live');
  const target = 200;
  const perSecond = 55;
  const startReads = L.reads;
  const t0 = performance.now();
  await ctx.guard(
    new Promise((resolve) => {
      ctx.loop(() => {
        const done = L.reads - startReads;
        const want = motion.reduced ? target : Math.min(target, Math.ceil(((performance.now() - t0) / 1000) * perSecond));
        while (L.reads - startReads < want) {
          L.read();
          if (L.reads % 4 === 0) L.record();
        }
        refresh();
        if (L.reads - startReads >= target) {
          L.record();
          showMiss();
          resolve();
          return false;
        }
        return done >= 0;
      });
    }),
  );
  ui.field.classList.remove('live');
  ui.field.classList.add('pickable');
  await ctx.wait(1000);
  caption.textContent = 'After 200 sentences.';
  await ctx.clear({ keep: [caption, ui.field, ui.panel], ms: 400 });
  // Our own labels, added after the fact: the model only ever had positions.
  GROUPS.forEach(([name, words]) => words.forEach((w) => ui.pts[w].setAttribute('data-g', name)));
  ui.field.classList.add('tinted');
  await ctx.add(h('p', { class: 'legend' }, h('span', { class: 'a' }, h('i'), 'animals'), h('span', { class: 'v' }, h('i'), 'vehicles'), h('span', { class: 'x' }, h('i'), 'actions'), h('span', { class: 'sr-only' }, ' (colors are our labels, not the model’s)')), { hold: 600 });

  await ctx.say('Look at the neighborhoods.', { cls: 'big', hold: 1600 });
  await ctx.say('Nobody told the model that dogs and cats are alike, or that cars are different. They ended up close because they turn up in the same places in the text. (The colors are ours, added afterward. The model only ever had positions.)', { cls: 'mid', hold: 800 });
  await ctx.say('Tap any word to see which words the model now scores highest after it.', { cls: 'quiet', hold: 5200 });
  await ctx.clear({ keep: [caption, ui.field, ui.panel, ui.field.parentNode.querySelector('.legend')], ms: 350 });
  await ctx.say('The miss never reaches zero, and it shouldn’t: after “dog,” the text really does vary. It might say chased, ate or slept.', { cls: 'caption', hold: 400 });
  await ctx.say(`Simplified: this model has ${L.weightCount} weights, is fed 13 short sentences, and looks only one word back. Real models weigh the whole context, use thousands of dimensions and learn from vastly more text. The nudging rule, gradient descent, is the same idea.`, { cls: 'caption', hold: 800 });
  await ctx.say('If a few hundred nudges can sort words into neighborhoods, what could billions of weights and an enormous amount of text build?', { cls: 'mid', hold: 600 });
  await ctx.button('Back to the chapters');
  location.hash = '#/12';
}
