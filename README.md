# OSRS Loot Simulator and dry calculator

[![Deploy GitHub Pages](https://github.com/KihiraLove/doom-loot-simulator/actions/workflows/pages.yml/badge.svg)](https://github.com/KihiraLove/doom-loot-simulator/actions/workflows/pages.yml)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20me-29ABE0?logo=ko-fi&logoColor=white)](https://ko-fi.com/KihiraLove)

An unofficial, **frontend-only** [Old School RuneScape](https://oldschool.runescape.wiki/) loot simulator for the [Doom of Mokhaiotl](https://oldschool.runescape.wiki/w/Doom_of_Mokhaiotl). Hosted with GitHub Pages. No backend, build dependencies or runtime Wiki API calls.

## Features

- Choose how many **individual delves were completed at each level** 1–8 and 9+.
- Switch between **Loot simulator** and **Dry calculator** without re-entering delve counts.
- Each entered delve yields one regular loot roll, its own guaranteed demon tears and its own eligible unique rolls. A complete run ending at level 8 is entered as one delve at **each level 1 through 8**, not as a single entry of 1 at level 8.
- The **9+** field combines all individual delves at level 9 or deeper, each of which gets **one independent roll** at the level-9 rates and a +20% common-loot quantity multiplier.
- Enter delve counts directly and repeat a simulation to reroll.
- Weighted common loot, guaranteed demon tears, independent clue and pet chances, and depth-gated equipment drops.
- Aggregated loot and four unique rewards displayed using local OSRS inventory sprites; no CSV export.
- The dry calculator accepts obtained **Mokhaiotl cloth**, **Eye of ayak**, **Avernic treads**, and **Dom pet** counts, and reports the probability of **fewer than**, **exactly**, or **more than** the observed count for each item.
- The **Any unique drop** summary shows the chance to receive at least one of these four drops, plus fewer/exactly/more chances for the sum of their observed counts.
- Matching dark brown/charcoal and muted gold colour palette from [BingoPlayerStats](https://github.com/KihiraLove/BingoPlayerStats).

## Dry calculator math

The dry calculator follows the probability approach of the [OSRS Wiki dry calculator](https://oldschool.runescape.wiki/w/Calculator:Dry_calc), extended for the different unique drop rates at each floor. For each selected completed delve, that specific level contributes one chance of obtaining a particular item. For each item separately, these Bernoulli trials form a Poisson-binomial count distribution. The implementation groups equal-rate trials as binomial distributions and convolves them for numerical accuracy.

For an item with observed count `k`, **fewer** = `P(X < k)`, **exactly** = `P(X = k)`, and **more** = `P(X > k)`. The three probabilities sum to 100% (subject to normal rounding). Each item also shows its expected drop count. Unlike a single-drop dry formula, this supports varying floor probabilities.

**Important:** the four individual probabilities are **per item**, not the joint probability of obtaining all four entered counts together. The **Any unique drop** result instead models the **total** unique-item count: each floor has one mutually exclusive equipment roll (with its chance equal to the sum of eligible equipment-item probabilities) and an independent Dom pet roll. Those two rolls can both succeed on a floor. Its at-least-one chance is calculated as one minus the probability of no eligible unique reward from any entered delve. Cloth, Eye of ayak, and treads are mutually exclusive within an equipment roll; Dom uses an independent pet roll. The algorithm omits only numerically negligible distribution tails at the maximum supported simulation size. Extremely small outcomes may be rendered as approximately 0%.

No extra data, requests, cookies, tracking, or backend are needed. The `9+` input represents individual delves at 9 or deeper, with unchanged rates.

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

The common loot table is one 312-ticket weighted roll per completed delve. Stack sizes scale by that delve level with truncation: `quantity = base + trunc(base * level_multiplier)`. Every counted delve separately adds the guaranteed demon tears from its row and rolls for its eligible equipment, Dom pet, and elite clue scroll. Neither guaranteed demon tears nor unique rewards use the common-loot quantity multiplier.

Entered delves are treated as completed and claimed. The simulator does not model deaths, lost rewards, level-specific rate changes above 9, existing elite clues, Eye charges, or market prices. Simulated loot is random and is not persisted.

Rates are maintained locally in [`simulator.mjs`](./simulator.mjs); PNG sprites are in [`assets/items/`](./assets/items/), sourced from [osrsreboxed-db](https://github.com/RSPSApp/osrsreboxed-db). Check the [OSRS Wiki](https://oldschool.runescape.wiki/w/Doom_of_Mokhaiotl) when updating rate data. Old School RuneScape and game artwork belong to Jagex; the original MIT license applies to the project's own code, not game assets.
