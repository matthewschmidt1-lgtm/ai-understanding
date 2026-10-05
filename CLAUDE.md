# Does AI Understand? Project rules

Zero-build static site. No Node on this Mac: dev server is `python3 scripts/dev.py 4190`. Tests: `/tests/run.html` (title says `PASS n`). Production: `serve` on Railway via `scripts/serve-site.sh` with the CSP in `serve.json` (`script-src 'self'`, so no inline scripts).

## The five rules (from the original brief; do not weaken)

1. **Never explain before the visitor has wondered.** Ask the question, then reveal the concept.
2. **Every technical concept becomes an experience** they can touch, not a paragraph.
3. **Never pretend a visualization is literally what happens inside a model.** Each simplified figure carries a visible "Simplified: …" line. A test fails if the concept pages lack one.
4. **Don't anthropomorphize.** Say "the model computes", not "the AI thinks". Information is "represented in the context", not "remembered". A test greps the screen copy for the worst offenders.
5. **End a concept with a question, not a conclusion.** The story ends on "understanding?", and nothing is ever graded: screen 10 replies "Reasonable." to every answer.

## Structure and conventions

- Pages are short files in `js/screens/sNN.js` (`export const meta` and `export default async function run(ctx)`) that call concept sections from `js/sections/`. To merge or reorder the journey, change the page files; the sections do not need to move. Script the beats with `ctx.say / wait / choose / button`; never leave timers or listeners that outlive the screen (use `ctx.loop` and `ctx.on`).
- All data and arithmetic lives in `js/model.js`. Visual figures read from it, so the numbers on screen are computed, and tested.
- Colour: human = clay, machine = river slate, shared = moss green, mixing through `--mix` as the story advances. Use the darker `-ink` tokens for text. Keep every text pair at 4.5:1 or better.
- Motion must respect `prefers-reduced-motion` (waits shrink, blur and drift stop, every state still appears).
- Saved state key is `dau.v1` in sessionStorage; bump it if the shape changes.
- First paint is server-rendered arrival markup in `index.html`; `js/screens/s00.js` holds the same markup for restarts. Keep them in sync.
