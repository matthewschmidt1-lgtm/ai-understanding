# Does AI Understand?

A five-minute interactive journey. It starts with picturing a dog and ends on one of the open questions about AI: when a model turns numbers into language, is that understanding?

Zero build, no framework, no backend. Everything is a deterministic, inspectable visualization, so the lesson is never hidden behind another LLM.

## Run it

```bash
python3 scripts/dev.py 4190     # http://localhost:4190   (no Node needed)
```

Jump to any screen with `#/0` to `#/12`, for example `http://localhost:4190/#/5`.

## Test it

Open `http://localhost:4190/tests/run.html`. The title reads `PASS 26` when everything is green. The tests cover the model maths (softmax, temperature, attention, latent space) and the story rules in `CLAUDE.md`.

## Deploy

Railway with Nixpacks runs `sh scripts/serve-site.sh`, which copies the public files into `dist/` and serves them with `serve` and the headers in `serve.json`. Push to GitHub and Railway redeploys.

Live at https://ai-understanding-production.up.railway.app/. `og:image` in `index.html` uses that absolute URL; update it if the domain changes.

## Where things are

See [docs/EXPERIENCE.md](docs/EXPERIENCE.md) for the journey map, architecture and art direction, and [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md) for the staged build prompts.
