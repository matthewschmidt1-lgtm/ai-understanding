// "What you now know": a quiet corner list that fills in as ideas are met.
// Deliberately not a progress bar: the last three items stay open because they are the next chapters.
import { h } from './ui.js';
import { state } from './state.js';

export const ITEMS = [
  { id: 'tokens', label: 'Tokens', at: 2 },
  { id: 'embeddings', label: 'Embeddings', at: 2 },
  { id: 'latent', label: 'Latent space', at: 3 },
  { id: 'context', label: 'Context', at: 4 },
  { id: 'attention', label: 'Attention', at: 5 },
  { id: 'transformer', label: 'Transformer', at: 6 },
  { id: 'probability', label: 'Probability', at: 8 },
  { id: 'learning', label: 'Learning', ahead: true },
  { id: 'reasoning', label: 'Reasoning', ahead: true },
  { id: 'agents', label: 'Agents', ahead: true },
];

let els = null;
let toastTimer = 0;

export function initKnowledge() {
  els = {
    wrap: document.getElementById('know'),
    btn: document.getElementById('know-btn'),
    panel: document.getElementById('know-panel'),
    list: document.getElementById('know-list'),
    toast: document.getElementById('know-toast'),
  };
  els.btn.addEventListener('click', () => setOpen(els.panel.hidden));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !els.panel.hidden) {
      setOpen(false);
      els.btn.focus();
    }
  });
  document.addEventListener('pointerdown', (e) => {
    if (!els.panel.hidden && !els.wrap.contains(e.target)) setOpen(false);
  });
  render();
}

export function setOpen(open) {
  els.panel.hidden = !open;
  els.btn.setAttribute('aria-expanded', String(open));
}

function render() {
  const known = new Set(state.learned());
  els.list.replaceChildren(
    ...ITEMS.map((item) => {
      const done = known.has(item.id);
      return h(
        'li',
        { class: done ? 'done' : item.ahead ? 'ahead' : '' },
        h('span', { class: 'mark', 'aria-hidden': 'true' }, done ? '✓' : '○'),
        item.label,
        h('span', { class: 'sr-only' }, done ? ' — learned' : item.ahead ? ' — still ahead' : ' — not yet'),
      );
    }),
  );
  els.wrap.hidden = known.size === 0;
}

export function learn(id) {
  if (!els) return;
  if (!state.learn(id)) return;
  render();
  const item = ITEMS.find((i) => i.id === id);
  els.btn.classList.remove('pulse');
  void els.btn.offsetWidth;
  els.btn.classList.add('pulse');
  els.toast.textContent = `+ ${item.label}`;
  els.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2200);
}

// When someone lands mid-journey (a deep link), fill in everything before that screen.
export function prime(screen) {
  ITEMS.filter((i) => i.at !== undefined && i.at < screen).forEach((i) => state.learn(i.id));
  if (els) render();
}

export function resetKnowledge() {
  if (els) {
    setOpen(false);
    render();
  }
}
