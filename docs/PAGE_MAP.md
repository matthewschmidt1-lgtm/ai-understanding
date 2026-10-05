# Page map

Pages are numbered 0 to 12. The number is also the web address: page 5 is `…/#/5`. Use these numbers when asking for changes, for example "page 8, make the prompt sentence bigger".

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

```
0 Arrival → 1 Think of a dog → 2 Numbers → 3 Latent space → 4 Context → 5 Attention → 6 Black box
   → 7 Machine runs → 8 Next token → 9 Doubt → 10 What do you think? → 11 Final reveal → 12 Keep going
```

| # | Page | What happens | Text styles on the page (shared size, then page-specific text) |
|---|---|---|---|
| **0** | Arrival | Title, "Let's find out.", a drawing line, Start button | Hero title · Quiet subtitle · button 1rem |
| **1** | Think of a dog | Silence, then four choices, then the association map | Big "Think of a dog." / "Interesting." · Quiet "Don't type anything…" · Mid questions · choice labels 1.25rem · map labels 16px |
| **2** | Numbers | "dog" becomes a token, then numbers | Hero "dog" · Mid · Big "It starts with numbers." · Caption · numbers 0.9 → 1.4rem (mono) · "dog" chip 1.7rem |
| **3** | Latent space | Click cat, wolf or car; the map fills out | Mid question · Big "Exactly." / "It captures relationships." · Quiet · Caption · word labels 1.05rem ("dog" 1.3rem) · similarity numbers 0.72rem |
| **4** | Context | One word, three sentences, glow and bars | Hero "dog" · sentence uses Mid · Big "Its context did." · bar labels 0.78rem · Caption |
| **5** | Attention | Hover "it" to see arcs; two patterns | Big "Attention" · Mid · Quiet hints · sentence words 1.5 → 2.6rem · percentages 0.72rem · pattern buttons 0.9rem · Caption |
| **6** | Black box | Open the box, open each layer to see an animation | Quiet · Mid · Big "There is a huge sequence…" · layer names 0.74rem capitals · layer note 1.05rem · layer hint 0.8rem · token chips 0.9rem · Caption |
| **7** | Machine runs | A pulse passes through the layers | Mid · Quiet · Big "So what does it do with that state?" · row text 0.92rem · small labels 0.68rem · Caption |
| **8** | Next token | Probability bars, Paris joins the sentence, then the randomness dial | Prompt sentence 1.6 → 3.2rem · Mid · Big "One token at a time." · bar words 1.15rem · percentages 0.9rem · dial label 0.72rem · results line 0.85rem · Caption |
| **9** | Doubt (dark page) | "Wait.", then the human and LLM lists of "dog" | Hero "Wait." · Mid · Big "They aren't the same." · Quiet · "DOG" 2.2rem · list items 1.12rem · column titles 0.72rem |
| **10** | What do you think? | Yes / No / Not sure, then "Reasonable." | Hero question · answer words 1.8rem · answer notes 0.88rem · Big "Reasonable." · Quiet · Mid |
| **11** | Final reveal | Two roads meet at "understanding?", then your own sentence | Hero "dog" · chain labels 0.95rem · "understanding?" 1.8 → 3.2rem · Mid · sentence form 1.25 → 1.9rem · your sentence back 1.5 → 2.5rem · Quiet |
| **12** | Keep going | Four coming chapters and a recap of what you know | Big "Keep going" · card titles 1.45rem · card text 0.95rem · recap pills 0.88rem · Caption |

## Always on screen (every page except 0)

| Piece | Size |
|---|---|
| "DOES AI UNDERSTAND?" top left | 0.72rem capitals |
| "What you now know" button, top right | 0.78rem |
| "Start over", bottom left | 0.78rem |
| Open "What you now know" list | 1rem |
| Primary and secondary buttons everywhere | 1rem |

## Where to change what

- **Everyone's text on a size tier at once:** the four `--step-…` lines in `css/tokens.css`, and `.line.caption` in `css/stage.css`.
- **One page's special text:** the matching rule in `css/screens.css`. Rule names are the class names above, such as `.prompt` (page 8), `.tok-w` (page 5) or `.lay-btn` (page 6).
- Sizes written as a range (for example 1.5 → 2.6rem) grow with the window width, so a phone gets the small end.
