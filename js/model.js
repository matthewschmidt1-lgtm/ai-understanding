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

// Blend facet colours by (sharpened) weight: the glow is computed, not picked per sentence.
export function glowColor(facets) {
  let wsum = 0;
  const acc = [0, 0, 0];
  for (const f of FACETS) {
    const w = (facets[f.id] ?? 0) ** 3;
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
  { id: 'B', label: 'Pattern B', note: 'stays close to the neighbouring words' },
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
