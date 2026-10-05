// Section: how AI reasons. Two things you can run yourself: a network whose weights are frozen
// but which computes something one layer cannot, and a fixed machine that gets a hard problem right
// only when it is allowed to write its steps down.
import { h } from '../ui.js';
import { motion } from '../engine.js';
import { XOR_WEIGHTS, xorNet, xorTarget, WORK_PROBLEMS, work, trueAnswer } from '../model.js';

const onOff = (v) => (v ? 'on' : 'off');
const timeout = (ms) => new Promise((r) => setTimeout(r, ms * motion.k));

// ---------- part 1: frozen weights, real computation ----------
function buildNet() {
  const nodes = {
    A: [34, 52],
    B: [34, 128],
    h1: [160, 52],
    h2: [160, 128],
    out: [292, 90],
  };
  const edges = [
    { from: 'A', to: 'h1', w: XOR_WEIGHTS.h1.w[0], kind: 'mid' },
    { from: 'A', to: 'h2', w: XOR_WEIGHTS.h2.w[0], kind: 'mid' },
    { from: 'B', to: 'h1', w: XOR_WEIGHTS.h1.w[1], kind: 'mid' },
    { from: 'B', to: 'h2', w: XOR_WEIGHTS.h2.w[1], kind: 'mid' },
    { from: 'h1', to: 'out', w: XOR_WEIGHTS.out.w[0], kind: 'mid' },
    { from: 'h2', to: 'out', w: XOR_WEIGHTS.out.w[1], kind: 'mid' },
    { from: 'A', to: 'out', w: XOR_WEIGHTS.single.w[0], kind: 'direct' },
    { from: 'B', to: 'out', w: XOR_WEIGHTS.single.w[1], kind: 'direct' },
  ];
  const svg = h('svg', { class: 'rz-net', viewBox: '0 0 340 170', role: 'img' });
  const edgeEls = edges.map((e) => {
    const [x1, y1] = nodes[e.from];
    const [x2, y2] = nodes[e.to];
    const line = h('line', { class: `rz-edge ${e.kind}`, x1, y1, x2, y2 });
    const t = e.kind === 'direct' ? 0.5 : 0.32; // near the source, so crossing edges keep separate labels
    const label = h('text', { class: `rz-w ${e.kind}`, x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t - 3 }, `${e.w > 0 ? '+' : '−'}${Math.abs(e.w)}`);
    svg.append(line, label);
    return { ...e, line };
  });
  const nodeEls = {};
  Object.entries(nodes).forEach(([id, [x, y]]) => {
    const mid = id === 'h1' || id === 'h2';
    const g = h('g', { class: `rz-node ${mid ? 'mid' : ''}` }, h('circle', { cx: x, cy: y, r: id === 'out' ? 18 : 14 }), h('text', { x, y: y + 4 }, id === 'out' ? 'out' : id));
    nodeEls[id] = g;
    svg.append(g);
  });
  svg.append(
    h('text', { class: 'rz-cap mid', x: 160, y: 26 }, XOR_WEIGHTS.h1.label),
    h('text', { class: 'rz-cap mid', x: 160, y: 160 }, XOR_WEIGHTS.h2.label),
    h('text', { class: 'rz-cap', x: 292, y: 124 }, 'exactly one is on?'),
  );
  return { svg, edgeEls, nodeEls };
}

function xorWidget(onState) {
  const state = { a: 0, b: 0, middle: true };
  const net = buildNet();
  const togA = h('button', { class: 'rz-tog', type: 'button', 'aria-pressed': 'false' });
  const togB = h('button', { class: 'rz-tog', type: 'button', 'aria-pressed': 'false' });
  const result = h('p', { class: 'rz-result', 'aria-live': 'polite' });
  const sw = h('button', { class: 'rz-switch', type: 'button', 'aria-pressed': 'true' }, 'Middle step: on');
  const rows = [[0, 0], [0, 1], [1, 0], [1, 1]];
  const body = h('tbody', {});
  const table = h('table', { class: 'rz-table' }, h('caption', { class: 'sr-only' }, 'All four input combinations, what the network outputs, and whether that matches “exactly one is on”'), h('thead', {}, h('tr', {}, ...['A', 'B', 'Output', 'Right?'].map((c) => h('th', { scope: 'col' }, c)))), body);

  function render() {
    const r = xorNet(state.a, state.b, { middle: state.middle });
    const val = { A: state.a, B: state.b, h1: r.h1, h2: r.h2, out: r.out };
    togA.textContent = `A: ${onOff(state.a)}`;
    togB.textContent = `B: ${onOff(state.b)}`;
    togA.setAttribute('aria-pressed', String(!!state.a));
    togB.setAttribute('aria-pressed', String(!!state.b));
    togA.classList.toggle('on', !!state.a);
    togB.classList.toggle('on', !!state.b);
    net.svg.classList.toggle('nomid', !state.middle);
    Object.entries(net.nodeEls).forEach(([id, g]) => g.classList.toggle('lit', !!val[id]));
    net.edgeEls.forEach((e) => e.line.classList.toggle('hot', !!val[e.from] && (e.kind === 'direct') === !state.middle));
    const right = r.out === xorTarget(state.a, state.b);
    result.replaceChildren(h('strong', {}, `Output: ${onOff(r.out)}`), right ? ' · right' : ` · wrong (it should be ${onOff(xorTarget(state.a, state.b))})`);
    result.classList.toggle('bad', !right);
    net.svg.setAttribute('aria-label', `Inputs A ${onOff(state.a)} and B ${onOff(state.b)}. ${state.middle ? 'With the middle step' : 'With no middle step'}, the output is ${onOff(r.out)}.`);
    sw.textContent = `Middle step: ${state.middle ? 'on' : 'off'}`;
    sw.setAttribute('aria-pressed', String(state.middle));
    body.replaceChildren(
      ...rows.map(([a, b]) => {
        const o = xorNet(a, b, { middle: state.middle }).out;
        const ok = o === xorTarget(a, b);
        const here = a === state.a && b === state.b;
        return h('tr', { class: `${here ? 'here' : ''} ${ok ? '' : 'miss'}`.trim() }, h('td', {}, onOff(a)), h('td', {}, onOff(b)), h('td', {}, onOff(o)), h('td', {}, ok ? '✓' : '✗'));
      }),
    );
    onState({ ...state });
  }
  togA.addEventListener('click', () => ((state.a = 1 - state.a), render()));
  togB.addEventListener('click', () => ((state.b = 1 - state.b), render()));
  sw.addEventListener('click', () => ((state.middle = !state.middle), render()));
  render();
  const el = h('div', { class: 'rz' }, h('div', { class: 'rz-inputs' }, h('span', { class: 'rz-lab' }, 'Flip the inputs'), togA, togB), net.svg, result, table, h('div', { class: 'rz-sw' }, sw, h('span', { class: 'rz-note' }, 'Weights frozen either way')));
  return el;
}

// ---------- part 2: the work budget ----------
function workWidget(onRun) {
  let problem = WORK_PROBLEMS[2];
  let budget = 2;
  let runId = 0;
  const probs = WORK_PROBLEMS.map((p) => h('button', { class: 'rw-prob', type: 'button', 'aria-pressed': String(p === problem), 'data-id': p.id }, p.text));
  const range = h('input', { type: 'range', min: 1, max: 4, step: 1, value: budget, id: 'rw-budget' });
  const rangeVal = h('output', { for: 'rw-budget' }, String(budget));
  const tape = h('div', { class: 'rw-tape', 'aria-live': 'polite' });
  const cost = h('p', { class: 'rw-cost' });
  const direct = h('button', { class: 'btn ghost', type: 'button' }, h('span', { class: 'btn-label' }, 'Answer right away'));
  const written = h('button', { class: 'btn primary', type: 'button' }, h('span', { class: 'btn-label' }, 'Let it write its steps'));

  const dots = (used) => h('span', { class: 'rw-dots', 'aria-hidden': 'true' }, ...Array.from({ length: budget }, (_, i) => h('i', { class: i < used ? 'on' : '' })));
  const reset = () => {
    runId++;
    direct.disabled = written.disabled = false;
    tape.replaceChildren(h('p', { class: 'rw-q' }, 'Question: ', h('b', {}, problem.text)));
    cost.textContent = '';
  };
  probs.forEach((b, i) =>
    b.addEventListener('click', () => {
      problem = WORK_PROBLEMS[i];
      probs.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      reset();
    }),
  );
  range.addEventListener('input', () => {
    budget = Number(range.value);
    rangeVal.textContent = String(budget);
    reset();
  });

  async function play(showWork) {
    const mine = ++runId;
    reset();
    runId = mine;
    direct.disabled = written.disabled = true;
    const r = work(problem, budget, showWork);
    const add = async (el, ms = 650) => {
      tape.append(el);
      await timeout(ms);
      return runId === mine;
    };
    try {
      if (!showWork) {
        await add(h('p', { class: 'rw-line dim' }, dots(r.stepsDone), ' one pass, steps done inside (unseen)'));
        if (runId === mine) await add(h('p', { class: `rw-answer ${r.correct ? 'ok' : 'bad'}` }, h('b', {}, `Answer: ${r.answer}`), r.correct ? ' ✓' : ` ✗ it ran out of steps. The right answer is ${trueAnswer(problem)}.`), 200);
        cost.textContent = '1 word written';
      } else {
        for (const line of r.lines) {
          if (!(await add(h('p', { class: 'rw-line' }, dots(line.steps), ' ', h('span', { class: 'rw-text' }, line.text))))) return;
        }
        if (runId === mine) await add(h('p', { class: 'rw-answer ok' }, h('b', {}, `Answer: ${r.answer}`), ' ✓'), 200);
        cost.textContent = `${r.words} words written. More words, more room to compute.`;
      }
      if (runId === mine) onRun({ showWork, correct: r.correct, steps: problem.ops.length, budget });
    } finally {
      if (runId === mine) direct.disabled = written.disabled = false;
    }
  }
  direct.addEventListener('click', () => play(false));
  written.addEventListener('click', () => play(true));
  reset();
  return h(
    'div',
    { class: 'rz rw' },
    h('div', { class: 'rw-pick' }, h('span', { class: 'rz-lab' }, 'Pick a problem'), h('div', { class: 'rw-probs', role: 'group', 'aria-label': 'Problem' }, ...probs)),
    h('div', { class: 'rw-budget' }, h('label', { for: 'rw-budget' }, 'Steps it can do in one go'), range, rangeVal),
    h('div', { class: 'rw-actions' }, direct, written),
    tape,
    cost,
  );
}

export default async function run(ctx) {
  ctx.learn('reasoning');
  await ctx.say('When training ends, the weights stop changing.', { cls: 'quiet', hold: 2400 });
  await ctx.say('So how does a fixed set of numbers work through something new?', { cls: 'big', hold: 2800 });
  await ctx.say('Start small. This network’s weights are frozen. Flip its inputs and watch what it computes.', { cls: 'mid', hold: 600 });

  // ----- part 1 -----
  const seen = new Set();
  let usedSwitch = false;
  let resolveSeen;
  const allSeen = new Promise((r) => (resolveSeen = r));
  const xor = xorWidget((s) => {
    seen.add(`${s.a}${s.b}`);
    if (!s.middle) usedSwitch = true;
    if (seen.size === 4) resolveSeen();
  });
  await ctx.add(xor, { hold: 400 });
  ctx.pin(xor);
  await ctx.guard(Promise.race([allSeen, timeout(40000)]));
  await ctx.say('It switches on only when exactly one input is on. No weight changed. The answer comes from how the pieces combine.', { cls: 'mid', hold: 4200 });
  await ctx.clear({ keep: [xor], ms: 350 });
  await ctx.say('Now take away its middle step.', { cls: 'quiet', hold: 400 });
  const flipped = new Promise((resolve) => {
    xor.querySelector('.rz-switch').addEventListener('click', resolve, { once: true });
  });
  xor.querySelector('.rz-switch').classList.add('nudge');
  await ctx.guard(Promise.race([flipped, timeout(25000)]));
  await ctx.wait(2200);
  await ctx.clear({ keep: [xor], ms: 350 });
  await ctx.say('With only one layer, no choice of weights gets all four rows right. Depth is what lets fixed weights compute more.', { cls: 'mid', hold: 800 });
  await ctx.say('Simplified: a toy with six weights. Real models stack dozens of layers, so far more can happen in one pass. But one pass is still a fixed amount of computing.', { cls: 'caption', hold: 500 });
  await ctx.button('Next');

  // ----- part 2 -----
  await ctx.clear({ ms: 500 });
  await ctx.say('A harder problem.', { cls: 'big', hold: 1600 });
  await ctx.say('One pass through fixed layers is a fixed amount of computing. What if the model could use its own words as a notepad?', { cls: 'mid', hold: 800 });
  let failedDirect = false;
  let usedWritten = false;
  let resolveBoth;
  const both = new Promise((r) => (resolveBoth = r));
  const wk = workWidget((run) => {
    if (!run.showWork && !run.correct) failedDirect = true;
    if (run.showWork) usedWritten = true;
    if (failedDirect && usedWritten) resolveBoth();
  });
  await ctx.add(wk, { hold: 400 });
  ctx.pin(wk);
  await ctx.say('Try a longer problem both ways. Then slide the steps up and watch the quick answer start to work.', { cls: 'quiet', hold: 300 });
  await ctx.guard(Promise.race([both, timeout(70000)]));
  await ctx.wait(1500);
  await ctx.clear({ keep: [wk], ms: 350 });
  await ctx.say('Same frozen numbers. The difference is how much room it was given.', { cls: 'big', hold: 800 });
  await ctx.say('Each word the model writes goes back in as input, just like the next-word loop you saw earlier. Writing steps down gives the same weights another pass at the problem.', { cls: 'mid', hold: 4800 });
  await ctx.clear({ keep: [wk], ms: 350 });
  await ctx.say('Simplified: this is a step-counting stand-in, not a real model. Real models can do many steps in one pass, and the steps they write are not always a faithful account of what happened inside.', { cls: 'caption', hold: 600 });
  await ctx.say('If extra words buy extra computing, what changes when a model also gets tools to use, memory to keep, and a goal to pursue?', { cls: 'mid', hold: 600 });
  await ctx.button('Back to the chapters');
  location.hash = '#/8';
}
