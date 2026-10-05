// Small looping figures, one per layer of the black box. Pure SVG/DOM plus CSS animation:
// the base styles show each figure's finished state, so reduced motion simply freezes it there.
import { h } from './ui.js';
import { embeddingFor } from './model.js';

const WORDS = ['The', 'dog', 'chased', 'the', 'ball'];
const svg = (label, ...kids) => h('svg', { class: 'viz', viewBox: '0 0 340 124', role: 'img', 'aria-label': label }, ...kids);
const tx = (x, y, text, cls = '') => h('text', { x, y, class: `vz-t ${cls}`.trim() }, text);

// Tokens: one string of text is cut into pieces, each with an ID number.
function tokens() {
  const ids = ['791', '9703', '31465', '279', '5041'];
  return h(
    'div',
    { class: 'viz viz-tokens', role: 'img', 'aria-label': 'The sentence “The dog chased the ball” is cut into five separate tokens, each with an ID number.' },
    h('div', { class: 'vt-row' }, ...WORDS.map((w, i) => h('div', { class: 'vt-cell', style: { '--i': i } }, h('span', { class: 'vt-chip' }, w), h('span', { class: 'vt-id' }, `#${ids[i]}`)))),
    h('p', { class: 'vz-cap' }, 'Example IDs'),
  );
}

// Embeddings: every token becomes a column of numbers, drawn as bars.
function embeddings() {
  const kids = [];
  WORDS.forEach((w, i) => {
    const cx = 36 + i * 67;
    kids.push(tx(cx, 16, w, 'vz-w'));
    embeddingFor(w, 7).forEach((v, j) => {
      const hgt = 6 + Math.abs(v) * 62;
      kids.push(h('rect', { class: `vz-bar ${v < 0 ? 'neg' : ''}`, x: cx - 24 + j * 7.5, y: 108 - hgt, width: 5.5, height: hgt, rx: 2, style: { '--d': `${i * 0.35 + j * 0.05}s` } }));
    });
  });
  return svg('Each token becomes its own column of numbers, shown as bars.', ...kids);
}

// Attention: information flows from earlier words into "ball".
function attention() {
  const xs = [36, 104, 172, 240, 308];
  const to = 4;
  const links = [
    [1, 0.34],
    [2, 0.4],
    [3, 0.12],
    [0, 0.06],
  ];
  const kids = [];
  links.forEach(([i, w], k) => {
    const x0 = xs[i];
    const lift = 34 + Math.abs(xs[to] - x0) * 0.14;
    kids.push(h('path', { class: 'vz-flow', d: `M${x0} 92 C ${x0} ${92 - lift}, ${xs[to]} ${92 - lift}, ${xs[to]} 92`, style: { 'stroke-width': 1.4 + w * 8, '--d': `${k * 0.45}s` } }));
  });
  kids.push(h('circle', { class: 'vz-pulse', cx: xs[to], cy: 106, r: 17 }));
  xs.forEach((x, i) => kids.push(tx(x, 110, WORDS[i], i === to ? 'vz-w hot' : 'vz-w')));
  return svg('Information flows from the earlier words, mostly “chased” and “dog”, into the word “ball”.', ...kids);
}

// MLP: widen, mix, narrow back down.
function mlp() {
  const col = (x, n, top, gap, cls) => Array.from({ length: n }, (_, i) => ({ x, y: top + i * gap, cls, i }));
  const a = col(56, 4, 22, 22, 'in');
  const b = col(170, 8, 12, 12.5, 'mid');
  const c = col(284, 4, 22, 22, 'out');
  const kids = [];
  a.forEach((p) => b.forEach((q) => kids.push(h('line', { class: 'vz-edge', x1: p.x, y1: p.y, x2: q.x, y2: q.y }))));
  b.forEach((p) => c.forEach((q) => kids.push(h('line', { class: 'vz-edge', x1: p.x, y1: p.y, x2: q.x, y2: q.y }))));
  [a, b, c].forEach((layer, li) => layer.forEach((p) => kids.push(h('circle', { class: `vz-node ${p.cls}`, cx: p.x, cy: p.y, r: p.cls === 'mid' ? 4.6 : 6, style: { '--d': `${li * 0.9 + (p.i % 4) * 0.15}s` } }))));
  kids.push(tx(56, 118, 'in', 'vz-cap-t'), tx(170, 118, 'expand and mix', 'vz-cap-t'), tx(284, 118, 'out', 'vz-cap-t'));
  return svg('A list of numbers is widened, mixed, then narrowed again, coming out changed.', ...kids);
}

// Residual stream: a running total that each block reads from and adds to.
function residual() {
  const block = (x, label, cls) => [
    h('rect', { class: `vz-block ${cls}`, x: x - 34, y: 74, width: 68, height: 28, rx: 9 }),
    tx(x, 92, label, 'vz-bl'),
    h('path', { class: 'vz-branch', d: `M${x - 16} 36 V 74` }),
    h('path', { class: 'vz-branch', d: `M${x + 16} 74 V 42` }),
    h('circle', { class: 'vz-plus', cx: x + 16, cy: 36, r: 6.5 }),
    tx(x + 16, 39.5, '+', 'vz-plus-t'),
  ];
  return svg(
    'A line carries the running state left to right. An attention block and an MLP block each read from it and add something back.',
    h('path', { class: 'vz-stream', d: 'M12 36 H 328' }),
    tx(12, 22, 'running state', 'vz-cap-t start'),
    ...block(118, 'attention', 'att'),
    ...block(232, 'MLP', 'mlp'),
    h('g', { class: 'vz-bead' }, h('circle', { class: 'ring2', r: 13 }), h('circle', { class: 'ring1', r: 9.5 }), h('circle', { class: 'core', r: 5 })),
  );
}

// Layers: the same two steps, again and again, building a richer state.
function layers() {
  const kids = [];
  for (let i = 0; i < 6; i++) {
    kids.push(h('rect', { class: 'vz-row', x: 14, y: 8 + i * 18, width: 168, height: 14, rx: 7, style: { '--d': `${i * 0.7}s` } }));
    kids.push(tx(98, 18.5 + i * 18, i === 5 ? '…' : `attention → transform`, 'vz-rt'));
  }
  kids.push(tx(14, 120, '× dozens', 'vz-cap-t start'));
  kids.push(tx(262, 24, 'state so far', 'vz-cap-t'));
  for (let i = 0; i < 6; i++) kids.push(h('rect', { class: 'vz-gauge', x: 214 + i * 16.5, y: 34, width: 11, height: 56, rx: 4, style: { '--d': `${i * 0.7}s`, '--h': `${0.25 + i * 0.15}` } }));
  kids.push(tx(262, 108, 'richer each time', 'vz-cap-t'));
  return svg('The same two steps repeat many times. After each pass the running state is a little richer.', ...kids);
}

// Final representation: a finished state that gets turned into scores for the next token.
function final() {
  const bars = Array.from({ length: 14 }, (_, i) => h('rect', { class: 'vz-bar fin', x: 14 + i * 9, y: 98 - (14 + 52 * Math.abs(Math.sin(i * 1.7 + 1))), width: 6, height: 14 + 52 * Math.abs(Math.sin(i * 1.7 + 1)), rx: 2, style: { '--d': `${i * 0.04}s` } }));
  const opts = [
    ['.', 0.52],
    [',', 0.24],
    ['and', 0.12],
    ['to', 0.07],
  ];
  const out = opts.flatMap(([t, p], i) => [
    tx(212, 34 + i * 20, t, 'vz-o end'),
    h('rect', { class: 'vz-obar', x: 222, y: 26 + i * 20, width: 100 * p * 1.7, height: 10, rx: 5, style: { '--d': `${1.6 + i * 0.2}s` } }),
  ]);
  return svg('The final state, a row of numbers, is scored against every possible next token.', ...bars, tx(70, 118, 'final state', 'vz-cap-t'), h('path', { class: 'vz-arrow', d: 'M146 62 H 192 M184 55 L 193 62 L 184 69' }), tx(272, 118, 'next-token scores', 'vz-cap-t'), ...out);
}

export const VIZ = { tokens, embeddings, attention, mlp, residual, layers, final };

export const WATCH = {
  tokens: 'Watch the sentence get cut into pieces, each with an ID number.',
  embeddings: 'Watch each piece turn into its own column of numbers.',
  attention: 'Watch information flow from earlier words into “ball”. Thicker means more.',
  mlp: 'Watch one token’s list of numbers widen, mix, and come out changed. Every token gets this treatment separately.',
  residual: 'Watch the running state pick up something at each block.',
  layers: 'Watch a similar pair of steps repeat, each layer with its own learned numbers, the state growing richer each time.',
  final: 'Watch the finished state become scores for what could come next.',
};
