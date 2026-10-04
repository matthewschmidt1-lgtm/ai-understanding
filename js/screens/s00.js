// Screen 0, arrival. Almost nothing: a question, a line, a button. No explanation, on purpose.
export const meta = { title: 'Arrival' };

// Kept in sync with the server-rendered markup in index.html (used on "Start over").
const ARRIVAL = `
<h1 class="hero"><span class="w" style="--i:0">Does</span> <span class="w" style="--i:1">AI</span> <span class="w" style="--i:2">understand?</span></h1>
<p class="sub intro-sub">Let’s find out.</p>
<svg class="signal" viewBox="0 0 360 28" aria-hidden="true" focusable="false">
  <defs><linearGradient id="sig" x1="0" x2="1"><stop offset="0" stop-color="#C4703F"/><stop offset=".5" stop-color="#5E8B4E"/><stop offset="1" stop-color="#3F6E8C"/></linearGradient></defs>
  <path id="sigpath" class="signal-path" pathLength="1" d="M2 14 C 40 -2, 80 30, 120 14 S 200 -2, 240 14 S 320 30, 358 14" fill="none" stroke="url(#sig)" stroke-width="2" stroke-linecap="round"/>
  <circle r="3.2" fill="#5E8B4E" class="signal-dot"><animateMotion dur="5s" repeatCount="indefinite" begin="2.4s"><mpath href="#sigpath"/></animateMotion></circle>
</svg>
<button class="btn primary intro-btn" id="start" type="button"><span class="btn-label">Start · 5 minutes</span><span class="btn-arrow" aria-hidden="true">→</span></button>`;

export default async function run(ctx) {
  if (!ctx.col.querySelector('.hero')) ctx.col.innerHTML = ARRIVAL;
  const start = ctx.col.querySelector('#start');
  await ctx.guard(new Promise((resolve) => start.addEventListener('click', resolve, { once: true })));
}
