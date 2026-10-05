# Does AI Understand? Experience, architecture and art direction

One page that answers three questions: what is the experience, how is it built, and why does it look the way it does.

## 1. The idea

A five-minute journey that starts with a human act (picture a dog) and ends on an open question (does what you just watched amount to understanding?). The visitor should leave with three ideas:

1. An LLM does not start from human-like concepts. It processes numbers.
2. Those numbers become rich and context-sensitive through Transformer computation.
3. Manipulating representations and producing fluent language does not, by itself, settle whether a model "understands".

**The product is a sequence of wonderings, not a lesson.** Every technical idea is introduced as a question the visitor has just felt, then revealed as something they can touch.

## 2. Architecture (the minimal scalable version)

**There is no backend, database or API in v1, on purpose.** The spec's strategic point is that the first experience must not hide the lesson behind another LLM. Everything is deterministic, fast, free to host and reproducible. That makes the whole product a static site.

```
index.html            arrival markup is server-rendered, so first paint is the title
css/                  tokens → base (atmosphere, chrome) → stage (reveal, buttons, choices) → screens
js/main.js            boot, router (history + #/n deep links), atmosphere, restart
js/engine.js          the storytelling engine: ctx.say / wait / choose / button / loop
js/knowledge.js       "What you now know" corner list
js/state.js           per-visit answers (sessionStorage, memory fallback)
js/model.js           the deterministic "model": softmax, attention rows, latent positions, embeddings
js/ui.js              h() DOM/SVG helper
js/layerviz.js        the looping figures inside each black-box layer (screen 6)
js/screens/sNN.js     one short file per page: stitches concept sections together, loaded on demand
js/sections/*.js      one file per concept (dog, numbers, latent, context, attention, blackbox, nexttoken, doubt, verdict, reveal, hub, learning, reasoning)
tests/run.html        26 browser tests (model maths + story-integrity rules)
```

**Page and section contract.** A page exports `meta` and `run(ctx)` and calls one or more sections in order (clearing the stage between them). A section is a script of beats. When the visitor leaves, an `AbortSignal` rejects every pending beat, so nothing keeps running behind the next screen.

**State schema** (`sessionStorage["dau.v1"]`, never leaves the browser):

| key | type | set on |
|---|---|---|
| `dog` | `image｜sound｜memory｜other` | screen 1 |
| `latentWhy` | `move｜humans｜other` | screen 3 (only if they picked the car) |
| `verdict` | `yes｜no｜unsure` | screen 10 |
| `sentence` | `{a, b}` | screen 11 |
| `learned` | `string[]` of concept ids | whenever an idea is revealed |

**API surface in v1:** none. **Where a backend would attach later** (not built, no buyer or need yet):

| seam | endpoint | purpose |
|---|---|---|
| anonymous answers | `POST /api/answers` `{dog, verdict, sentence}` | aggregate "how did others answer", the completion-sentence metric |
| live experiments | `POST /api/experiments/:id` | a real LLM inside one specific experiment where it adds something |

Both would be additive: `state.js` is the only place answers are written.

## 3. Art direction

**Concept: two lights.** Human experience is warm clay; the machine is cool river slate. They begin on opposite sides of the page and drift toward the middle as the story goes on, until a moss green appears where they overlap. The page itself narrates the thesis: *the distinction is real, but the relationship is complicated.* The mix is one CSS variable, `--mix`, animated per screen (0 on arrival, 1 at the final reveal).

- **Materials:** warm paper (`#F5F1E8`) with a fine grain; frosted-glass cards (`backdrop-filter`) with hairline borders; nothing glossy, nothing drop-shadowed except the buttons.
- **Lighting:** two slow-drifting colour fields (clay upper left, slate lower right), a moss-green field that grows with `--mix`, and a soft white spotlight that follows the pointer so the page feels lit rather than flat.
- **Depth:** type arrives out of focus and settles sharp (opacity, 16px rise, 10px blur). Fields drift on separate periods (38 s, 46 s, 52 s) so the background never repeats.
- **Typography:** the system serif (New York on Apple devices, Iowan/Palatino/Georgia elsewhere) for everything the story *says*, tight at display sizes (-0.04em); system sans for controls and captions; monospace only for numbers. No font downloads, so first paint is instant.
- **Palette:** ink `#17140F`, paper `#F5F1E8`, human `#C4703F`, machine `#3F6E8C`, shared `#5E8B4E`. Text colours use darker `-ink` variants so everything meets WCAG AA.
- **Composition:** one column, one idea per screen, a lot of air. The top of the content is anchored, so earlier lines never jump when later ones arrive.
- **The one dark beat:** screen 9 ("Wait.") flips the page to warm ink for about thirty seconds. It is the only time the page is dark, because it is the only time the story interrupts itself.
- **Motion language:** slow, eased, and always meaningful: lines resolve into focus, arcs draw themselves, bars grow, numbers settle from scramble to fixed values. Reduced motion shortens waits to 30%, removes blur and drift, and keeps every state.
- **Emotion:** curiosity (arrival), recognition (dog), surprise (numbers), delight (latent space, attention), vertigo (the black box), doubt (the dark beat), openness (the final question).

## 4. The journey, first second to final CTA

| # | Screen | Message | Interaction | Motion / transition | Goal |
|---|---|---|---|---|---|
| load | Arrival (server-rendered) | *Does AI understand? Let's find out.* | none for ~2.6 s, then Start | words resolve one by one; a signal line draws itself clay → moss → blue | curiosity, instantly, with no explanation |
| 1 | Think of a dog | *Your brain didn't retrieve a word. It activated a network.* | silence, then pick image / sound / memory / other | breathing ring; pick expands, others dim; the network draws, the visitor's choice lit clay | the visitor does the human thing first |
| 2 | Numbers | *An LLM starts with numbers.* | none (watch) | word → token → numbers scramble then settle | the surprise |
| 3 | Latent space | *A useful representation captures relationships.* | click cat / wolf / car; tap any word for neighbours | points glide; the field fills out; nearest-neighbour lines with similarity | embeddings as geometry; no wrong answer |
| 4 | Context | *The word didn't change. Its context did.* | none (watch) | one word, three sentences, a computed glow and facet bars | meaning depends on context |
| 5 | Attention | *Attention lets parts of the context influence one another.* | hover or tap "it"; any word; two patterns | arcs draw from the word to earlier words, weighted | the first big payoff: you can see information flow |
| 6 | The black box | *There is a huge sequence of numerical transformations.* | open the box; open any layer to play its animation (tokens split, numbers grow, attention flows, and so on) | the stack unfolds; each layer opens into a looping figure | de-mystify without a diagram dump |
| 7 | The machine runs | *So what does it do with that state?* | none | a pulse passes layer by layer | one internal state |
| 8 | Next token | *A distribution over tokens, one at a time.* | the loop plays; then dial randomness and draw | bars grow; Paris folds into the sentence; the loop appears | probability, felt rather than explained |
| 9 | Doubt | *Humans do something strangely similar.* | none | the page goes dark; two trees of "dog" | the interruption |
| 10 | Experiment | *What do you think?* | yes / no / not sure | every answer gets "Reasonable." | commit before the reveal |
| 11 | Final reveal | *Maybe the question is how something so different looks so familiar.* | complete "An LLM isn't simply … It's …" | two roads converge on one moss-green question | the metric: can they say a difference in their own words |
| 12 | Keep going | four chapters, announced as coming next | recap of what they know; Start again | the corner list fills | the doorway, never a dead end |

**Conversion goals.** Primary: finish and write the sentence. Secondary: continue into the next chapters (not built yet, so announced honestly).

## 5. Budgets and quality bars

- **Performance:** no framework, no fonts, no images except the share card; the first screen is plain HTML and CSS; each screen is a lazy module; one rAF loop at a time and none when the tab is hidden.
- **Accessibility:** real buttons and a real form; every figure has a text equivalent; narration is in an `aria-live` region; focus moves to the new screen and to the next action for keyboard users (never for pointer users, so nothing grabs focus unasked); touch targets are at least 44 px; `prefers-reduced-motion` is honoured; no information is carried by colour alone.
- **Honesty:** see `CLAUDE.md`. Every simplified figure says so on screen, and a test fails the build if one doesn't.
