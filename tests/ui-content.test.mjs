import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ITEMS, SPECIAL_ITEMS } from "../simulator.mjs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf-8");

test("requested presentation text is absent from both static and dynamic UI", () => {
  const visibleSources = read("doom/index.html") + "\n" + read("app.mjs");
  const removedPhrases = [
    "Planned delves",
    "drop rolls",
    "Each count is one completed delve at that level.",
    "Quantities are combined across simulated delves.",
    "item types",
    "How many of each unique did you receive across these runs?",
    "Chance of at least one unique drop",
    "Compared against",
    "total drops entered across cloth, Eye, treads and Dom.",
    "Odds across the configured delves, including the total of all four unique rewards.",
    "Eligible drop rolls",
    "The “Any unique drop” result combines all four drop counts",
    "Images stored locally",
    "Unofficial fan project. Not affiliated with Jagex."
  ];
  for (const phrase of removedPhrases) {
    assert.ok(!visibleSources.toLowerCase().includes(phrase.toLowerCase()), "Still visible: " + phrase);
  }
  assert.doesNotMatch(visibleSources, /\bid=["']item-count["']/);
  assert.doesNotMatch(visibleSources, /\bid=["']planned-runs["']/);
  assert.ok(visibleSources.includes('caption.textContent = "At least one"'));
});

test("shortened item names still retain the correct IDs and drop rates", () => {
  assert.equal(SPECIAL_ITEMS.find(item => item.id === "eye-of-ayak").name, "Eye of ayak");
  assert.equal(ITEMS.find(item => item.id === "tooth-half-of-key").name, "Tooth half of key");
  assert.ok(!read("simulator.mjs").includes("(uncharged)"));
  assert.ok(!read("simulator.mjs").includes("(moon key)"));
});

test("Ko-fi uses the BingoPlayerStats blue pill banner and bounded cup icon", () => {
  const html = read("doom/index.html");
  const css = read("styles.css");
  assert.match(html, /class="kofi-banner"/);
  assert.match(html, /href="https:\/\/ko-fi.com\/KihiraLove"/);
  assert.match(html, /storage\.ko-fi\.com\/cdn\/cup-border\.png/);
  assert.match(html, /Support me on Ko-fi/);
  assert.match(html, /width="24" height="24"/);
  assert.match(css, /\.site-header \.kofi-banner\s*\{/);
  assert.match(css, /background:\s*#29abe0/i);
  assert.match(css, /border-radius:\s*999px/);
  assert.match(css, /\.site-header \.kofi-banner img/);
  assert.match(css, /max-width:\s*24px/);
  assert.match(css, /max-height:\s*24px/);
});

test("footer uses the BingoPlayerStats structure and privacy statement", () => {
  const html = read("doom/index.html");
  const css = read("styles.css");
  assert.match(html, /class="footer-meta"/);
  assert.match(html, /class="footer-actions"/);
  assert.match(html, /class="text-button"/);
  assert.match(html, /No data is stored, collected, or sold by this site\./);
  assert.match(css, /\.footer-meta\s*\{/);
  assert.match(css, /\.footer-actions\s*\{/);
  assert.match(css, /\.text-button\s*\{/);
  assert.match(html, /href="https:\/\/github.com\/KihiraLove\/doom-loot-simulator"/);
});

test("README uses matching GitHub Pages CI status and Ko-fi badges", () => {
  const markdown = read("README.md");
  assert.match(markdown, /KihiraLove\/doom-loot-simulator\/actions\/workflows\/pages\.yml\/badge\.svg/);
  assert.match(markdown, /img\.shields\.io\/badge\/Ko--fi-Support%20me-29ABE0\?logo=ko-fi&logoColor=white/);
  assert.match(markdown, /https:\/\/ko-fi\.com\/KihiraLove/);
});

test("home page shows only a centered, accessible Doom boss tile", () => {
  const homepage = read("index.html");
  const css = read("styles.css");
  assert.match(homepage, /class="boss-selection-page"/);
  assert.match(homepage, /class="boss-picker"/);
  assert.match(homepage, /class="boss-tile" href="\.\/doom\/"/);
  assert.match(homepage, /aria-label="Open Doom of Mokhaiotl loot simulator"/);
  assert.match(homepage, /src="\.\/assets\/items\/dom\.png"/);
  assert.doesNotMatch(homepage, /id="simulator-form"|id="mode-loot"|src="\.\/app\.mjs"/);
  assert.match(css, /body\.boss-selection-page\s*\{[^}]*place-items:\s*center/s);
});

test("Doom simulator is on a separate, repository-rename-safe path", () => {
  const html = read("doom/index.html");
  const app = read("app.mjs");
  assert.match(html, /href="\.\.\/"[^>]*>← All simulators<\/a>/);
  assert.match(html, /href="\.\.\/styles\.css"/);
  assert.match(html, /src="\.\.\/app\.mjs"/);
  assert.match(html, /src="\.\.\/assets\/items\/dom\.png"/);
  assert.match(html, /id="simulator-form"/);
  assert.match(app, /new URL\("\.\/assets\/items\/" \+ id \+ "\.png", import\.meta\.url\)\.href/);
});
