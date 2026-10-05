# Page map

Pages are numbered 0 to 10. The number is also the web address: page 5 is `…/#/5`. Use these numbers when asking for changes, for example "page 5, make the prompt sentence bigger".

## The five text sizes used on most pages

These are the shared sizes. Changing one changes it on every page that uses it. They live in `css/tokens.css` (and `.line.caption` in `css/stage.css`).

| Name | Where it appears | Size (small phone → large desktop) |
|---|---|---|
| **Hero** | the huge words: page 0 title, "dog", "Wait.", "What do you think?" | 3rem → 7.6rem |
| **Big** | the punchline lines: "Interesting.", "It starts with numbers." | 2rem → 3.6rem |
| **Mid** | the main story sentences | 1.25rem → 1.7rem |
| **Quiet** | the italic asides and subtitles | 1.05rem → 1.3rem |
| **Caption** | the small grey notes, including every "Simplified:" line | 0.84rem (fixed) |

## The journey

Eight pages on the main path, then two optional chapters. Several pages combine two ideas, one after the other, so each page stays about one screen tall.

```
0 Arrival → 1 Dog, then numbers → 2 Latent space → 3 Context and attention → 4 Black box
   → 5 Next token → 6 Doubt, then "What do you think?" → 7 Final reveal → 8 Keep going
                                                                              ↘ 9 How AI learns
                                                                              ↘ 10 How AI reasons
```

| # | Page | What happens | Text styles on the page (shared size, then page-specific text) |
|---|---|---|---|
| **0** | Arrival | Title, "Let's find out.", a drawing line, Start button | Hero title · Quiet subtitle · button 1rem |
| **1** | Dog, then numbers | Picture a dog, pick what came to mind, see the association map, then "dog" becomes a token and numbers | Big "Think of a dog." · Quiet · Mid · choice labels 1.25rem · map labels 16px · Hero "dog" · numbers 0.9 → 1.4rem (mono) · Caption |
| **2** | Latent space | Click cat, wolf or car; the map fills out | Mid question · Big "Exactly." · Quiet · Caption · word labels 1.05rem ("dog" 1.3rem) · similarity numbers 0.72rem |
| **3** | Context and attention | One word in three sentences with a glow and bars, then hover "it" to see attention arcs | Hero "dog" · sentence uses Mid · Big · bar labels 0.78rem · sentence words 1.3 → 2.2rem · percentages 0.72rem · pattern buttons 0.9rem · Caption |
| **4** | Black box | Open the box, open layers to see animations, then run words through the stack | Quiet · Mid · Big "There isn't a little person…" · layer names 0.74rem capitals · layer note 1.05rem · layer hint 0.8rem · Caption |
| **5** | Next token | Probability bars, Paris joins the sentence, then the randomness dial | Prompt sentence 1.6 → 3.2rem · Mid · Big "One token at a time." · bar words 1.15rem · percentages 0.9rem · dial label 0.72rem · Caption |
| **6** | Doubt, then "What do you think?" | Dark page: "Wait.", the human and LLM lists of "dog"; then the light page: Yes / No / Not sure and "Reasonable." | Hero "Wait." · Mid · Big · Quiet · "DOG" 2.2rem · list items 1.12rem · Hero question · answer words 1.8rem · answer notes 0.88rem |
| **7** | Final reveal | Two roads meet at "understanding?", then your own sentence | Hero "dog" · chain labels 0.95rem · "understanding?" 1.8 → 3.2rem · Mid · sentence form 1.25 → 1.9rem · your sentence back 1.5 → 2.5rem · Quiet |
| **8** | Keep going | Four chapter cards ("How AI learns" and "How AI reasons" are open) and a recap of what you know | Big "Keep going" · card titles 1.45rem · card text 0.95rem · recap pills 0.88rem · Caption |
| **9** | How AI learns (optional) | A tiny model really trains: feed it one sentence, then 200, and the word map organizes itself | Quiet · Big · Mid · word labels 1.05rem · guess panel words 0.95rem · panel titles 0.72rem · Caption |
| **10** | How AI reasons (optional) | A frozen network computes XOR and you take its middle step away; a fixed machine answers right away or writes its steps | Quiet · Big · Mid · input buttons 0.95rem · table 0.88rem · problem buttons 1rem · written steps 0.95rem · small labels 0.72rem · Caption |

## Always on screen (every page except 0)

| Piece | Size |
|---|---|
| "DOES AI UNDERSTAND?" top left | 0.72rem capitals |
| "What you now know" button, top right | 0.78rem |
| "Space to skip" / "Tap empty space to skip" hint, bottom right (fades after first use) | 0.75rem |
| Down-arrow "more below" button, bottom right | 1.2rem |
| "Start over", bottom left | 0.78rem |
| Open "What you now know" list | 1rem |
| Primary and secondary buttons everywhere | 1rem |

## Where to change what

- **Everyone's text on a size tier at once:** the four `--step-…` lines in `css/tokens.css`, and `.line.caption` in `css/stage.css`.
- **One page's special text:** the matching rule in `css/screens.css`. Rule names are the class names above, such as `.prompt` (page 5), `.tok-w` (page 3) or `.lay-btn` (page 4).
- Sizes written as a range (for example 1.5 → 2.6rem) grow with the window width, so a phone gets the small end.
