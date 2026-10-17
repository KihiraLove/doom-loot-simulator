# OSRS Boss Loot Simulators

[![Deploy GitHub Pages](https://github.com/KihiraLove/doom-loot-simulator/actions/workflows/pages.yml/badge.svg)](https://github.com/KihiraLove/doom-loot-simulator/actions/workflows/pages.yml)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20me-29ABE0?logo=ko-fi&logoColor=white)](https://ko-fi.com/KihiraLove)

An unofficial, **frontend-only** collection of [Old School RuneScape](https://oldschool.runescape.wiki/) boss loot simulators. Includes [Doom of Mokhaiotl](https://oldschool.runescape.wiki/w/Doom_of_Mokhaiotl), [Phosani's Nightmare](https://oldschool.runescape.wiki/w/Phosani%27s_Nightmare), [Yama](https://oldschool.runescape.wiki/w/Yama), [Alchemical Hydra](https://oldschool.runescape.wiki/w/Alchemical_Hydra), and [Cerberus](https://oldschool.runescape.wiki/w/Cerberus). Hosted with GitHub Pages. No backend, build dependencies or runtime Wiki API calls.

## Boss selection

The home page (`/`) is a boss picker with an icon for each supported boss. Select Doom at [`/doom/`](./doom/), Phosani's Nightmare at [`/phosani/`](./phosani/), Yama at [`/yama/`](./yama/), Alchemical Hydra at [`/hydra/`](./hydra/), or Cerberus at [`/cerberus/`](./cerberus/). Each simulator links back to the boss picker. New boss simulators can be added as separate subdirectories and linked from the home page without modifying Doom's calculations.

All navigation and asset URLs are relative so the site also works under a renamed GitHub Pages project path. Renaming the repository **will change its GitHub Pages URL**, however, and old Pages URLs do not redirect automatically.

## Cerberus

The [Cerberus loot simulator and dry calculator](./cerberus/) model Cerberus's current table (not Echo Cerberus). Every completed kill yields one **Infernal ashes**. One main table roll has 130 equally weighted tickets: four mutually exclusive crystal/stone outcomes (one ticket each, **1/520** for Primordial crystal, Pegasian crystal, Eternal crystal and Smouldering stone) and 126 tickets for the listed common items, including the current batch of **seven Key master teleports** when selected.

The source also lists a **3/130 rare-drop-table access**, although its 130-ticket main table is already complete. This implementation treats the rare table as an *additional independent roll*, using the listed approximate item-rate proportions conditional on entry, including a possible nothing result. This is an explicit modelling choice for otherwise conflicting table totals. No ring of wealth or Legends' Quest adjustments are modelled. Tertiary rolls are separate: Ensouled hellhound head (1/15), elite clue (1/100 or 1/95 with **Elite Combat Achievements**), Jar of souls (1/2,000), and **Hellpuppy** (1/3,000). The optional **Konar task** toggle enables Brimstone keys (1/45); they are absent otherwise. Normal elite clue ownership and the special guaranteed elite-clue-task drops are not modelled.

The dry calculator shows **fewer than, exactly, and more than** the observed counts for each crystal, Smouldering stone, Jar of souls and Hellpuppy. Its **Any crystal or stone** summary uses the one-in-130 *mutually exclusive unique table*, rather than pretending the four crystals/stones roll independently. Jar and pet probabilities are calculated separately. All item graphics are local sprites from [osrsreboxed-db](https://github.com/RSPSApp/osrsreboxed-db), and the Hellpuppy pet sprite is the boss selector icon.

Sources: [Cerberus (OSRS Wiki)](https://oldschool.runescape.wiki/w/Cerberus) and [Cerberus drop table (Reldo)](https://reldo.org/a/cerberus/).

## Alchemical Hydra

The [Alchemical Hydra simulator and dry calculator](./hydra/) use the boss's own drop mechanics, not those of ordinary hydras. Every kill yields **2 Hydra bones** and up to two ordinary drops; the first standard roll can be replaced by one success from a **sequential** special-drop chain: dragon thrownaxe, dragon knife, Hydra's claw, Hydra tail, Hydra leather, or one brimstone ring piece. The second roll is always standard. Conditional success rates yield effective rates of approximately 1/2,000 thrownaxes, 1/2,001 knives, 1/1,001 claw, 1/513 tail, 1/514 leather and 1/181.1 for *the next* brimstone piece. Pieces are distributed in fixed **eye → fang → heart → eye ...** order, not independently. Independent tertiary rolls include brimstone keys, both clue scroll tiers, Alchemical hydra heads, Jar of chemicals, and the Ikkle hydra pet. Hard and Elite Combat Achievement checkboxes apply the corresponding clue-rate boosts.

The drop-table source lists two regular loot rolls with a nominal denominator of 101, but summing the displayed category weights (including herb, seed and rare-drop table branches) yields **120 rather than 101**. To avoid invalid probabilities, this implementation normalizes the published weights as **relative weights**; standard-loot frequencies are therefore approximate rather than an exact 1/101 implementation. Herb and seed subtables use their listed relative rates, and the shared rare drop table is represented using its published relative rates, including Nothing. Normal-loot quantities are those of the published table. The simulator assumes elite and hard clue slots are free (does not model already-held clues), and rolls independent tertiary items each kill.

The dry calculator accepts counts for the claw, tail, leather, each brimstone-ring piece, Hydra heads, jar, and pet. Ring-piece odds correctly derive from the *number of sequential ring successes*: zero hearts on the first or second successful ring-piece roll, for instance. The **Any signature unique** summary counts the claw, tail, leather and ring-piece outcomes (not thrownaxe/knife or tertiary rolls), at most one per kill. Like the other simulators, it runs entirely in the browser. All reward sprites, including the Ikkle hydra home icon, are local PNGs from [osrsreboxed-db](https://github.com/RSPSApp/osrsreboxed-db).

Drop mechanics and quantities: [Alchemical Hydra on the OSRS Wiki](https://oldschool.runescape.wiki/w/Alchemical_Hydra), corroborated with [Reldo](https://reldo.org/a/alchemical-hydra/) and [KURU](https://kuru.co.kr/en/verticals/osrs/monster/alchemical-hydra/).

## Yama

The [Yama simulator and dry calculator](./yama/) support **Solo (100% contribution)** and **Duo (50% contribution)** above the kill-count field. These model ordinary (non-contract) Yama encounters. Each player receives their own sequential roll: equipment at contribution/120, dossier at contribution/12 if the equipment roll fails, forgotten lockbox at 1/30 if preceding rolls fail, and oathplate shards at 1/15 if preceding rolls fail. A standard drop follows when no earlier reward succeeds. Normal loot quantities and the 12-shard quantity scale with contribution; Yami (1/2,500) and elite clues (1/30) roll independently. The supply table can produce several different supplies on one roll.

The loot page presents **Yama drops separately from opening rewards**. For each simulated lockbox, one of the 403 weighted lockbox outcomes is rolled. For each simulated dossier, one of the 1,740 weighted outcomes is rolled, with the Rite of vile transference guaranteed for the first dossier opened at or after 100 Yama KC if it was not already obtained. Simulated dossiers are opened immediately on the kill they drop. Later rite rolls become 15–18 chasm teleport scrolls because this model assumes the first rite was already learned. All reward icons are local OSRS item sprites from [osrsreboxed-db](https://github.com/RSPSApp/osrsreboxed-db).

The Yama dry calculator **does not include any lockbox or dossier-opening rewards**, nor any contracted Yama fights. It displays Yama-only rates for equipment, dossier, oathplate shards, and Yami at the chosen contribution. Forgotten lockboxes are excluded from dry-input/output results. Shard counts are in units of 12 (solo) or 6 (duo). “Any equipment drop or Yami” combines the equipment and independent pet rolls. All results are independent simulations; no account-specific prior history, elite clue ownership, or prices are tracked.

Sources: [Yama](https://oldschool.runescape.wiki/w/Yama), [Dossier](https://oldschool.runescape.wiki/w/Dossier), and [Forgotten lockbox](https://oldschool.runescape.wiki/w/Forgotten_lockbox). Numbers match Wiki tables retrieved October 2026.

## Phosani's Nightmare

The Phosani-only [simulator and dry calculator](./phosani/) use the solo boss's own drop table, not the regular Nightmare's. Each kill awards Big bones and one common-loot roll. The staff/armour/mace table rolls at **1/140** and the separate orb table at **3/1,600**; both can award a signature drop on the same kill. Staff/armour/mace selection uses the April 2026 Mod Ash confirmation, including the 8% staff-to-mace swap.

Common loot uses Phosani-specific quantity ranges. The Wiki's displayed common-table weights are **rounded** and add to 101%, so they are normalized as relative weights. Each simulated session starts at zero kill count. The Slepey tablet receives its random 1/25 roll, with a first tablet guaranteed by kill 25 if none previously dropped. Optional Elite Combat Achievements change the elite clue rate from 1/35 to 1/33. Elite clue ownership, prices, and previous account history are not tracked.

The dry calculator supports the eight signature drops plus the Little nightmare pet, Parasitic egg and Jar of dreams. The **Any signature unique** result is the total count across the eight signature items, calculated by convolving the two independent table-roll distributions; a single kill can produce two such items. The pet, egg and jar have independent odds. Tablet guarantee and clues are not part of the dry calculator. All calculations and item image loading run locally. The item inventory sprites are stored under `assets/items/` (sourced from [osrsreboxed-db](https://github.com/RSPSApp/osrsreboxed-db)), including the Little nightmare pet icon used in the boss selector. No Wiki image or rate requests are made at runtime.

## Doom of Mokhaiotl features

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

Then visit http://localhost:8000/ for the boss picker, http://localhost:8000/doom/ for Doom, http://localhost:8000/phosani/ for Phosani's Nightmare, http://localhost:8000/yama/ for Yama, http://localhost:8000/hydra/ for Alchemical Hydra, or http://localhost:8000/cerberus/ for Cerberus. JavaScript modules may not work from a `file://` URL.

## Tests

Requires Node.js 20+, no installation step:

```sh
node --test tests/*.test.mjs
node --check app.mjs
node --check simulator.mjs
node --check phosani/simulator.mjs
node --check phosani/dry-calc.mjs
node --check phosani/app.mjs
node --check yama/simulator.mjs
node --check yama/dry-calc.mjs
node --check yama/app.mjs
node --check hydra/simulator.mjs
node --check hydra/dry-calc.mjs
node --check hydra/app.mjs
node --check cerberus/simulator.mjs
node --check cerberus/dry-calc.mjs
node --check cerberus/app.mjs
```

## GitHub Pages

A workflow in `.github/workflows/pages.yml` deploys on pushes to `main` after validation. If needed, select **GitHub Actions** as the Pages source in repository settings.

Site: https://kihiralove.github.io/doom-loot-simulator/ (boss picker)

Doom simulator: https://kihiralove.github.io/doom-loot-simulator/doom/

Phosani simulator: https://kihiralove.github.io/doom-loot-simulator/phosani/

Yama simulator: https://kihiralove.github.io/doom-loot-simulator/yama/

Alchemical Hydra simulator: https://kihiralove.github.io/doom-loot-simulator/hydra/

Cerberus simulator: https://kihiralove.github.io/doom-loot-simulator/cerberus/

## Loot model

The common loot table is one 312-ticket weighted roll per completed delve. Stack sizes scale by that delve level with truncation: `quantity = base + trunc(base * level_multiplier)`. Every counted delve separately adds the guaranteed demon tears from its row and rolls for its eligible equipment, Dom pet, and elite clue scroll. Neither guaranteed demon tears nor unique rewards use the common-loot quantity multiplier.

Entered delves are treated as completed and claimed. The simulator does not model deaths, lost rewards, level-specific rate changes above 9, existing elite clues, Eye charges, or market prices. Simulated loot is random and is not persisted.

Rates are maintained locally in [`simulator.mjs`](./simulator.mjs); PNG sprites are in [`assets/items/`](./assets/items/), sourced from [osrsreboxed-db](https://github.com/RSPSApp/osrsreboxed-db). Check the [OSRS Wiki](https://oldschool.runescape.wiki/w/Doom_of_Mokhaiotl) when updating rate data. Old School RuneScape and game artwork belong to Jagex; the original MIT license applies to the project's own code, not game assets.
