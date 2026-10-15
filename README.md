# Doom of Mokhaiotl — Loot Simulator

An unofficial, **frontend-only** [Old School RuneScape](https://oldschool.runescape.wiki/) loot simulator for the [Doom of Mokhaiotl](https://oldschool.runescape.wiki/w/Doom_of_Mokhaiotl). Hosted with GitHub Pages. No backend, build dependencies or runtime Wiki API calls.

## Features

- Choose a number of completed, claimed runs for each delve tier **1–8 and 9+**.
- The **9+** field combines the highest drop-rate tier: it simulates nine floors per run, using the level-9 drop rates on the final floor. If a player completes more than nine floors, the simulator **does not** grant extra rolls for the additional floors.
- Presets for 100 delve-8 and 100 delve-9+ runs; repeat a simulation to reroll.
- Weighted common loot, guaranteed demon tears, independent clue and pet chances, and depth-gated equipment drops.
- Aggregated loot and four unique rewards displayed using local OSRS inventory sprites; no CSV export.
- Matching dark brown/charcoal and muted gold colour palette from [BingoPlayerStats](https://github.com/KihiraLove/BingoPlayerStats).

## Local development

Serve the repository root using any static HTTP server:

```sh
python3 -m http.server 8000
```

Then visit http://localhost:8000. JavaScript modules may not work from a `file://` URL.

## Tests

Requires Node.js 20+, no installation step:

```sh
node --test tests/*.test.mjs
node --check app.mjs
node --check simulator.mjs
```

## GitHub Pages

A workflow in `.github/workflows/pages.yml` deploys on pushes to `main` after validation. If needed, select **GitHub Actions** as the Pages source in repository settings.

Site: https://kihiralove.github.io/doom-loot-simulator/

## Loot model

The common loot table is one 312-ticket weighted roll per floor. Stack sizes scale by floor with truncation. Each floor also has separate rolls for equipment, Dom and elite clues, when eligible. Guaranteed demon tears begin at floor 3.

Selected runs are treated as successful and claimed. The simulator does not model deaths, lost rewards, actual depth beyond 9, existing elite clues, Eye charges, or market prices. Simulated loot is random and is not persisted.

Rates are maintained locally in [`simulator.mjs`](./simulator.mjs); PNG sprites are in [`assets/items/`](./assets/items/), sourced from [osrsreboxed-db](https://github.com/RSPSApp/osrsreboxed-db). Check the [OSRS Wiki](https://oldschool.runescape.wiki/w/Doom_of_Mokhaiotl) when updating rate data. Old School RuneScape and game artwork belong to Jagex; the original MIT license applies to the project's own code, not game assets.
