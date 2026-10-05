// The deterministic "model" behind every visualization. No LLM runs here:
// everything is small, inspectable arithmetic with hand-authored data.
// Each figure that uses it says on screen that it is a simplification.

// ---------- numbers ----------
export function mulberry32(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

// A stand-in embedding: a fixed vector per word. The first four values for "dog"
// are the ones shown in the story; the rest are seeded so they never change.
export function embeddingFor(word, n = 14) {
  const rnd = mulberry32(hashString(word));
  const out = Array.from({ length: n }, () => Math.round((rnd() * 2 - 1) * 100) / 100);
  if (word === 'dog') out.splice(0, 4, 0.21, -0.73, 0.48, 0.09);
  return out;
}

// ---------- latent space ----------
// Positions are percentages of the field. "Before" is where the words start;
// "after" is the arrangement a trained model tends to produce (related things near each other).
export const LATENT = {
  start: {
    dog: [28, 54],
    wolf: [46, 20],
    cat: [70, 44],
    car: [76, 80],
  },
  settled: {
    dog: [30, 52],
    wolf: [38, 36],
    cat: [40, 60],
    car: [80, 82],
    puppy: [21, 42],
    fox: [48, 42],
    lion: [34, 18],
    leash: [12, 74],
    truck: [90, 70],
    bus: [68, 90],
    bike: [58, 78],
    tree: [86, 18],
    river: [70, 14],
  },
  // words that join the field once the idea is out
  extra: ['puppy', 'fox', 'lion', 'leash', 'truck', 'bus', 'bike', 'tree', 'river'],
};

export function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

// 1 when two points coincide, falling toward 0 with distance. An illustration, not cosine similarity.
export function similarity(a, b) {
  const d = distance(a, b) / 28;
  return 1 / (1 + d * d);
}

export function nearest(id, positions, k = 3) {
  const here = positions[id];
  return Object.keys(positions)
    .filter((o) => o !== id)
    .map((o) => ({ id: o, sim: similarity(here, positions[o]) }))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, k);
}

// ---------- context ----------
export const FACETS = [
  { id: 'animal', label: 'animal', rgb: [196, 112, 63] },
  { id: 'motion', label: 'motion', rgb: [168, 82, 66] },
  { id: 'size', label: 'size', rgb: [122, 150, 92] },
  { id: 'symbol', label: 'symbol', rgb: [188, 142, 58] },
  { id: 'space', label: 'room it needs', rgb: [63, 110, 140] },
];

export const DOG_CONTEXTS = [
  { text: 'The dog chased the ball.', pulls: ['chased', 'ball'], facets: { animal: 0.88, motion: 0.86, size: 0.35, symbol: 0.05, space: 0.2 } },
  { text: 'The dog was too large for the apartment.', pulls: ['large', 'apartment'], facets: { animal: 0.7, motion: 0.1, size: 0.92, symbol: 0.05, space: 0.88 } },
  { text: 'The dog in the logo represents loyalty.', pulls: ['logo', 'loyalty'], facets: { animal: 0.3, motion: 0.04, size: 0.08, symbol: 0.94, space: 0.05 } },
];

// Blend facet colors by (sharpened) weight: the glow is computed, not picked per sentence.
export function glowColor(facets) {
  let wsum = 0;
  const acc = [0, 0, 0];
  for (const f of FACETS) {
    const w = (facets[f.id] ?? 0) ** 6;
    wsum += w;
    for (let i = 0; i < 3; i++) acc[i] += f.rgb[i] * w;
  }
  return acc.map((v) => Math.round(v / (wsum || 1)));
}

// ---------- attention ----------
export const SENTENCE = ['The', 'dog', 'chased', 'the', 'ball', 'because', 'it', 'was', 'moving.'];

// Head A: hand-written to resolve what "it" refers to. Rows are causal (a word can only
// draw on itself and the words before it), the way GPT-style models work.
const HEAD_A = [
  [1],
  [0.25, 0.75],
  [0.05, 0.55, 0.4],
  [0.1, 0.15, 0.45, 0.3],
  [0.03, 0.17, 0.35, 0.3, 0.15],
  [0.02, 0.2, 0.38, 0.05, 0.25, 0.1],
  [0.02, 0.22, 0.09, 0.02, 0.46, 0.12, 0.07],
  [0.01, 0.12, 0.05, 0.01, 0.15, 0.1, 0.5, 0.06],
  [0.01, 0.08, 0.07, 0.01, 0.27, 0.06, 0.3, 0.17, 0.03],
];

// Head B: a different pattern, mostly looking at the nearest previous words.
const HEAD_B = SENTENCE.map((_, i) => Array.from({ length: i + 1 }, (_, j) => Math.exp(-(i - j) * 0.95)));

export const HEADS = [
  { id: 'A', label: 'Pattern A', note: 'follows who or what a word refers to' },
  { id: 'B', label: 'Pattern B', note: 'stays close to the neighboring words' },
];

function normalize(row) {
  const sum = row.reduce((a, b) => a + b, 0);
  return row.map((v) => v / sum);
}

// Attention weights from word `i` over the whole sentence (zeros for words after it).
export function attentionFrom(i, head = 'A') {
  const raw = (head === 'A' ? HEAD_A : HEAD_B)[i];
  const row = normalize(raw);
  return SENTENCE.map((_, j) => row[j] ?? 0);
}

// ---------- next token ----------
export const NEXT_FRANCE = [
  ['Paris', 0.94],
  ['London', 0.02],
  ['Berlin', 0.01],
  ['Rome', 0.01],
  ['Madrid', 0.006],
  ['Lyon', 0.004],
  ['the', 0.003],
  ['(rare)', 0.007],
];

export const NEXT_AFTER_PARIS = [
  ['.', 0.58],
  [',', 0.31],
  [';', 0.03],
  ['and', 0.02],
  ['(other)', 0.06],
];

export function softmax(logits, temperature = 1) {
  const t = Math.max(temperature, 0.05);
  const scaled = logits.map((l) => l / t);
  const max = Math.max(...scaled);
  const exps = scaled.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

// Treat the table above as the model's probabilities at temperature 1, recover the
// logits, and re-apply softmax at another temperature.
export function distribution(table, temperature = 1) {
  const logits = table.map(([, p]) => Math.log(p));
  const probs = softmax(logits, temperature);
  return table.map(([token], i) => ({ token, p: probs[i] }));
}

export function sample(dist, rnd = Math.random) {
  let r = rnd();
  for (const d of dist) {
    r -= d.p;
    if (r <= 0) return d.token;
  }
  return dist[dist.length - 1].token;
}

// ---------- learning ----------
// A genuinely tiny language model that really trains in the browser: it reads sentences and
// learns to guess the next word. Each word has a 2-number embedding E and the output side has
// weights U and biases b: 13 x 2 + 13 x 2 + 13 = 65 weights in all. Plain gradient descent on
// the cross-entropy of the next-word guess, the same rule at the heart of real training.
export const LEARN_VOCAB = ['the', 'dog', 'cat', 'wolf', 'car', 'truck', 'chased', 'ate', 'slept', 'drove', 'stopped', 'fast', '.'];
export const LEARN_TEXT = [
  'the dog chased the cat .',
  'the wolf chased the dog .',
  'the cat chased the wolf .',
  'the dog ate .',
  'the cat ate .',
  'the wolf ate .',
  'the dog slept .',
  'the cat slept .',
  'the wolf slept .',
  'the car drove fast .',
  'the truck drove fast .',
  'the car stopped .',
  'the truck stopped .',
];

export function createLearner(seed = 2, { lr = 0.3 } = {}) {
  const rnd = mulberry32(seed);
  const V = LEARN_VOCAB.length;
  const index = Object.fromEntries(LEARN_VOCAB.map((w, i) => [w, i]));
  const E = Array.from({ length: V }, () => [rnd() * 2 - 1, rnd() * 2 - 1]);
  const U = Array.from({ length: V }, () => [rnd() * 2 - 1, rnd() * 2 - 1]);
  const b = new Array(V).fill(0);
  const sentences = LEARN_TEXT.map((s) => s.split(' ').map((w) => index[w]));
  const pairs = sentences.flatMap((s) => s.slice(1).map((next, i) => [s[i], next]));
  const history = [];
  let reads = 0;

  const probsFor = (c) => softmax(U.map((u, k) => u[0] * E[c][0] + u[1] * E[c][1] + b[k]));

  function meanLoss() {
    return pairs.reduce((sum, [c, n]) => sum - Math.log(probsFor(c)[n]), 0) / pairs.length;
  }
  history.push([0, meanLoss()]);

  // Read one sentence: for every word, guess the next, measure the miss, nudge every weight a little.
  function read(which = Math.floor(rnd() * sentences.length)) {
    const s = sentences[which];
    for (let i = 0; i < s.length - 1; i++) {
      const c = s[i];
      const p = probsFor(c);
      const g = p.slice();
      g[s[i + 1]] -= 1;
      const gE = [0, 0];
      for (let k = 0; k < V; k++) {
        gE[0] += g[k] * U[k][0];
        gE[1] += g[k] * U[k][1];
      }
      for (let k = 0; k < V; k++) {
        U[k][0] -= lr * g[k] * E[c][0];
        U[k][1] -= lr * g[k] * E[c][1];
        b[k] -= lr * g[k];
      }
      E[c][0] -= lr * gE[0];
      E[c][1] -= lr * gE[1];
    }
    reads++;
    return { which, text: LEARN_TEXT[which] };
  }

  return {
    vocab: LEARN_VOCAB,
    weightCount: V * 2 + V * 2 + V,
    get reads() {
      return reads;
    },
    history,
    meanLoss,
    read,
    record: () => history.push([reads, meanLoss()]),
    embedding: (word) => E[index[word]].slice(),
    // The model's guess for the word after `word`, most likely first.
    predict: (word) => probsFor(index[word]).map((p, k) => ({ token: LEARN_VOCAB[k], p })).sort((a, b2) => b2.p - a.p),
  };
}

// ---------- reasoning ----------
// Part 1: a network with frozen, hand-set weights. Two "middle" units look at the inputs, and the
// output reads the middle. Together they compute XOR ("exactly one input is on"), which no single
// unit can compute with any weights (the tests check this exhaustively on a grid).
export const XOR_WEIGHTS = {
  h1: { w: [1, 1], b: -0.5, label: 'at least one is on' },
  h2: { w: [1, 1], b: -1.5, label: 'both are on' },
  out: { w: [1, -1], b: -0.5 },
  single: { w: [1, 1], b: -0.5 }, // the best a lone unit can do here: it behaves like "at least one"
};
const step = (x) => (x > 0 ? 1 : 0);
export const xorTarget = (a, b) => (a !== b ? 1 : 0);
export function xorNet(a, b, { middle = true } = {}) {
  const W = XOR_WEIGHTS;
  if (!middle) return { a, b, h1: null, h2: null, out: step(W.single.w[0] * a + W.single.w[1] * b + W.single.b) };
  const h1 = step(W.h1.w[0] * a + W.h1.w[1] * b + W.h1.b);
  const h2 = step(W.h2.w[0] * a + W.h2.w[1] * b + W.h2.b);
  return { a, b, h1, h2, out: step(W.out.w[0] * h1 + W.out.w[1] * h2 + W.out.b) };
}

// Part 2: a stylized "work budget". A fixed-depth machine can do only so many steps in one pass.
// Written steps re-enter the context (as on screen 8), so each word buys another pass.
export const WORK_PROBLEMS = [
  { id: 'a', text: '3 + 4', start: 3, ops: [['+', 4]] },
  { id: 'b', text: '(3 + 4) × 2', start: 3, ops: [['+', 4], ['×', 2]] },
  { id: 'c', text: '(3 + 4) × 2 − 5', start: 3, ops: [['+', 4], ['×', 2], ['−', 5]] },
  { id: 'd', text: '((3 + 4) × 2 − 5) × 3 + 1', start: 3, ops: [['+', 4], ['×', 2], ['−', 5], ['×', 3], ['+', 1]] },
];
const apply = (v, [op, n]) => (op === '+' ? v + n : op === '−' ? v - n : v * n);
export const trueAnswer = (p) => p.ops.reduce(apply, p.start);

// Answer in one pass (only `budget` steps fit), or write the steps out `budget` at a time.
export function work(problem, budget, showWork) {
  const { start, ops } = problem;
  if (!showWork) {
    const done = Math.min(budget, ops.length);
    let v = start;
    const hidden = [];
    for (let i = 0; i < done; i++) {
      const next = apply(v, ops[i]);
      hidden.push(`${v} ${ops[i][0]} ${ops[i][1]} = ${next}`);
      v = next;
    }
    return { lines: [], hidden, answer: v, correct: done === ops.length, stepsDone: done, words: 1 };
  }
  const lines = [];
  let v = start;
  for (let i = 0; i < ops.length; i += budget) {
    const parts = [];
    for (const o of ops.slice(i, i + budget)) {
      const next = apply(v, o);
      parts.push(`${v} ${o[0]} ${o[1]} = ${next}`);
      v = next;
    }
    lines.push({ text: parts.join(', '), steps: parts.length });
  }
  return { lines, hidden: [], answer: v, correct: true, stepsDone: ops.length, words: lines.length + 1 };
}
