# Build plan: sequential implementation prompts

Each stage is a prompt you can hand to a coding session as written. Rules for every stage: **inspect the code before changing it, run the tests, fix problems immediately, and preserve everything that already works.** Stages 0 to 9 are done; stage 10 waits on the GitHub repository. The "Check" line is how each was verified, and is how to re-verify.

**Stage 0. Project and tooling.** *Prompt:* "Create a zero-build static site: `index.html`, `css/`, `js/` (ES modules), `tests/run.html`, `scripts/dev.py` (no-store dev server, because this Mac has no Node), `package.json` with `serve` for production, `serve.json` with a strict CSP (`script-src 'self'`), `railway.json`." *Check:* `python3 scripts/dev.py 4190` serves the page; the response headers from `serve.json` produce no console errors.

**Stage 1. Design tokens and atmosphere.** *Prompt:* "Define the light palette (paper, ink, human clay, machine river slate, shared moss green) as CSS custom properties, register `--mix` with `@property` so it can animate, and build the world layer: two drifting colour fields, a violet field driven by `--mix`, a pointer-following spotlight, and a fine grain." *Check:* screenshot at three `--mix` values; contrast of every text pair is at least 4.5:1.

**Stage 2. The storytelling engine.** *Prompt:* "Write `js/engine.js`: a `ctx` with `say`, `add`, `wait`, `clear`, `choose`, `button`, `loop`, `on`, `learn`, all cancellable through one `AbortSignal`. Reduced motion shortens waits to 30%. New content below the fold scrolls into view." *Check:* leaving a screen mid-script never leaves timers or listeners running (navigate away during screen 1 and watch the console).

**Stage 3. Router, chrome and the knowledge list.** *Prompt:* "Boot with `main.js`: `history.pushState` routing with `#/n` deep links, lazy-loaded screen modules, a fade between screens, 'Start over', a skip link, and the quiet 'What you now know' list (not a progress bar; the last three items stay open)." *Check:* back and forward work; `#/5` loads with earlier concepts already known.

**Stage 4. Arrival and the dog (screens 0 and 1).** *Prompt:* "Server-render the arrival in `index.html` so first paint is the title; build the same markup in JS for restarts. Screen 1: the silence, the four choices, the association network." *Check:* first paint without JS shows the title; the choice stays lit in the network.

**Stage 5. Numbers, latent space, context (screens 2 to 4).** *Prompt:* "Numbers that scramble then settle; a 2-D field where the visitor picks cat, wolf or car and nobody is told they are wrong; one word in three sentences with a computed glow." *Check:* tests for similarity ordering, nearest neighbours and glow colour pass.

**Stage 6. Attention (screen 5).** *Prompt:* "A sentence where hovering, focusing or tapping a word draws weighted arcs to the earlier words it draws on, with two patterns. Rows must sum to 1 and be causal." *Check:* attention tests pass; on a 375 px screen the arcs from a wrapped line land under the row above.

**Stage 7. The black box, the machine, the next token (screens 6 to 8).** *Prompt:* "An opening box that unfolds a clickable layer stack with a residual-stream spine; a machine that pulses through its layers; a probability chart that folds 'Paris' into the sentence, shows the loop, then lets the visitor dial randomness and draw tokens." *Check:* softmax and temperature tests pass; 40 draws at high randomness show variety.

**Stage 8. Doubt, experiment, final reveal, doorway (screens 9 to 12).** *Prompt:* "The one dark beat; two trees of 'dog'; a verdict with no graded answer; two roads converging on 'understanding?'; the visitor's own completed sentence; the four next chapters, announced honestly as coming next; a recap." *Check:* the story-integrity tests pass (no graded language, ends on a question).

**Stage 9. Accessibility, performance, SEO.** *Prompt:* "Audit: keyboard-only run-through, focus management, aria-live narration, 44 px targets, reduced motion, 375 px layout, title, description and Open Graph tags, `og.png` (1200 x 630), `robots.txt`, a `noscript` summary." *Check:* Tab reaches Start; Enter moves focus to the first choice; no horizontal scroll at 375 px.

**Stage 10. Deploy.** *Prompt:* "Commit to a GitHub repository, connect it to Railway (Nixpacks, `sh scripts/serve-site.sh`), confirm auto-deploy, then set `og:image` to the absolute production URL." *Check:* the live URL loads `#/0`, and `curl -I` shows the CSP and security headers.
