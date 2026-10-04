// Per-visit state: the visitor's answers and which ideas they have met.
// Lives in sessionStorage when available, memory otherwise. Nothing leaves the browser.
const KEY = 'dau.v1';
let mem = {};

try {
  mem = JSON.parse(sessionStorage.getItem(KEY)) || {};
} catch {
  mem = {};
}

function save() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(mem));
  } catch { /* private mode: keep going in memory */ }
}

export const state = {
  get: (k, fallback) => (k in mem ? mem[k] : fallback),
  set(k, v) {
    mem[k] = v;
    save();
  },
  learned: () => mem.learned || [],
  learn(id) {
    const set = new Set(mem.learned || []);
    if (set.has(id)) return false;
    set.add(id);
    mem.learned = [...set];
    save();
    return true;
  },
  reset() {
    mem = {};
    save();
  },
};
