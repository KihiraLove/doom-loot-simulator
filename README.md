# Doom of Mokhaiotl — Loot Simulator

An unofficial, **frontend-only** [Old School RuneScape](https://oldschool.runescape.wiki/) loot simulator for the [Doom of Mokhaiotl](https://oldschool.runescape.wiki/w/Doom_of_Mokhaiotl). Designed for GitHub Pages. No account, backend, live API, dependencies or build step.

## Features

- Specify the number of **claimed runs ending at each delve** (1–16 by default; add levels up to 50).
- Presets for 100 × delve 8, 9 or 16.
- Every run rolls all of its floors, with one weighted common loot roll per floor.
- Models guaranteed demon tears from floor 3, scaled normal drop quantities, depth-gated unique equipment, Dom pet rates and elite clue tertiary drops.
- Aggregates inventory-style rewards with locally bundled item PNGs and exports results to CSV.
- Runs entirely in the browser using built-in JavaScript RNG. Repeated simulations generate new random results.

**Model details:** The common table is a single 312-ticket roll. Base quantities are delve-3 values and floor scaling follows \`Qn = Q3 + trunc(Q3 × Mn)\`. Each cleared floor independently adds its guaranteed demon tears, can roll an elite clue (1/75 for floor 1–2, 1/50 afterward), and has one shared roll for eligible unique equipment. Mokhaiotl cloth unlocks at 2, Eye of ayak at 3 and Avernic treads at 4. The pet Dom independently unlocks at 6. Unique probabilities improve through delve 9, then stop increasing; higher floors continue to roll at the delve-9 rate.

**Scope:** The simulator assumes every selected run succeeds and the accumulated rewards are claimed. It does not model player deaths, attempts lost while descending, ownership restrictions for elite clue scrolls, existing Dom collection-log state, additional charges added directly to an Eye of ayak, or market prices. The results are probability samples, not guaranteed rewards. Loot is not persisted.

## Run locally

Use any local HTTP server in the repository root, for example:

\`\`\`sh
python3 -m http.server 8000
\`\`\`

Then visit http://localhost:8000. Because JavaScript modules are used, opening \`index.html\` directly from a \`file://\` URL is not supported by some browsers.

## Tests

Node.js 20+ is sufficient. No npm installation:

\`\`\`sh
node --test tests/*.test.mjs
node --check app.mjs
node --check simulator.mjs
\`\`\`

## GitHub Pages

A deployment workflow is included in \`.github/workflows/pages.yml\` and runs when changes land on \`main\`. Enable GitHub Pages in the repository **Settings → Pages → Build and deployment → Source: GitHub Actions**. The intended production URL is:

https://kihiralove.github.io/doom-loot-simulator/

Deployment requires the repository's Pages setting and the default GitHub Actions permissions to allow the official Pages deployment workflow. The PR itself does not publish or merge automatically.

## Updating game data and sprites

- Loot rates and item metadata are explicitly pinned in [\`simulator.mjs\`](./simulator.mjs). No Wiki fetches at runtime.
- All displayed inventory sprites are stored under [\`assets/items/\`](./assets/items/), not hotlinked. The PNGs were copied from the [osrsreboxed-db](https://github.com/RSPSApp/osrsreboxed-db) item icon dataset, which in turn derives item art from Old School RuneScape.
- When Jagex updates drop rates, compare the [OSRS Wiki Doom page](https://oldschool.runescape.wiki/w/Doom_of_Mokhaiotl) against the local constants, update affected sprite files, and run tests.

### Credits and licensing

The game, names and item artwork belong to Jagex. Drop-rate references and descriptive data are credited to the [OSRS Wiki](https://oldschool.runescape.wiki/) (community content under its own terms). Icon source: [RSPSApp/osrsreboxed-db](https://github.com/RSPSApp/osrsreboxed-db). This tool is not endorsed by or affiliated with Jagex. The original repository's MIT license applies to this project's original code, not third-party game assets.
