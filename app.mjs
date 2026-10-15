import {
  SPECIAL_ITEMS, ITEM_DETAILS, MAX_DEPTH, MAX_FLOOR_ROLLS,
  gearDenominator, domDenominator, simulate, validatePlan
} from "./simulator.mjs";
import { calculateDryResults } from "./dry-calc.mjs";

const inputs = document.getElementById("depth-inputs");
const form = document.getElementById("simulator-form");
const clearButton = document.getElementById("clear-button");
const validationMessage = document.getElementById("validation-message");
const plannedRuns = document.getElementById("planned-runs");
const emptyState = document.getElementById("empty-state");
const resultsContent = document.getElementById("results-content");
const uniqueGrid = document.getElementById("unique-grid");
const lootGrid = document.getElementById("loot-grid");
const formatter = new Intl.NumberFormat("en-US");
const lootModeButton = document.getElementById("mode-loot");
const dryModeButton = document.getElementById("mode-dry");
const lootPanel = document.getElementById("loot-panel");
const dryPanel = document.getElementById("dry-panel");
const dryFields = document.getElementById("dry-fields");
const dryInputs = document.getElementById("dry-inputs");
const dryEmpty = document.getElementById("dry-empty");
const dryResults = document.getElementById("dry-results");
const dryResultsGrid = document.getElementById("dry-results-grid");
const actionLabel = document.getElementById("action-label");
let mode = "loot";

function number(value) { return formatter.format(value); }
function depthLabel(depth) { return depth === MAX_DEPTH ? "9+" : String(depth); }

function makeDepthField(depth) {
  const label = document.createElement("label");
  label.className = "depth-field";

  const caption = document.createElement("span");
  caption.textContent = "Delve " + depthLabel(depth);

  const input = document.createElement("input");
  input.type = "number";
  input.min = "0";
  input.step = "1";
  input.value = "0";
  input.dataset.depth = String(depth);
  input.setAttribute("aria-label", "Runs ending at delve " + depthLabel(depth));
  input.setAttribute("inputmode", "numeric");

  label.append(caption, input);
  inputs.append(label);
}

function makeDryField(item) {
  const label = document.createElement("label");
  label.className = "dry-field";
  const icon = makeSprite(item.id);
  const name = document.createElement("span");
  name.textContent = item.name;
  const input = document.createElement("input");
  input.type = "number";
  input.min = "0";
  input.step = "1";
  input.value = "0";
  input.dataset.itemId = item.id;
  input.setAttribute("aria-label", item.name + " received");
  input.setAttribute("inputmode", "numeric");
  label.append(icon, name, input);
  dryInputs.append(label);
}

function readDryCounts() {
  const counts = {};
  for (const input of dryInputs.querySelectorAll("input")) {
    const raw = input.value.trim();
    if (!/^(0|[1-9]\d*)$/.test(raw) || !Number.isSafeInteger(Number(raw))) {
      const name = SPECIAL_ITEMS.find(item => item.id === input.dataset.itemId).name;
      throw new RangeError("Enter a non-negative whole number for " + name + ".");
    }
    counts[input.dataset.itemId] = Number(raw);
  }
  return counts;
}

function probabilityText(probability) {
  if (probability === 0) return "0%";
  if (probability === 1) return "100%";
  const value = probability * 100;
  if (value < 0.000001) return "<0.000001%";
  if (value > 99.999999) return ">99.999999%";
  return value.toFixed(value < 1 ? 4 : 2) + "%";
}

function addProbabilityCell(container, label, probability) {
  const cell = document.createElement("div");
  cell.className = "dry-outcome";
  const title = document.createElement("span");
  title.textContent = label;
  const value = document.createElement("strong");
  value.textContent = probabilityText(probability);
  cell.append(title, value);
  container.append(cell);
}

function renderDryResultCard(result, name, spriteId, combined = false) {
  const card = document.createElement("section");
  card.className = "dry-result-card" + (combined ? " dry-total-card" : "");
  const header = document.createElement("div");
  header.className = "dry-result-heading";
  const title = document.createElement("div");
  const heading = document.createElement("h3");
  heading.textContent = name;
  const expected = document.createElement("p");
  expected.textContent = "Expected: " + numberWithDecimals(result.expected) +
    " · Eligible drop rolls: " + number(result.attempts);
  title.append(heading, expected);
  header.append(makeSprite(spriteId), title);
  card.append(header);

  if (combined) {
    const atLeastOne = document.createElement("p");
    atLeastOne.className = "any-drop-chance";
    const caption = document.createElement("span");
    caption.textContent = "Chance of at least one unique drop";
    const value = document.createElement("strong");
    value.textContent = probabilityText(result.atLeastOne);
    atLeastOne.append(caption, value);
    card.append(atLeastOne);

    const explanation = document.createElement("p");
    explanation.className = "muted";
    explanation.textContent = "Compared against " + number(result.count) +
      " total drops entered across cloth, Eye, treads and Dom.";
    card.append(explanation);
  }

  const odds = document.createElement("div");
  odds.className = "dry-outcomes";
  addProbabilityCell(odds, "Fewer than " + number(result.count), result.fewer);
  addProbabilityCell(odds, "Exactly " + number(result.count), result.exact);
  addProbabilityCell(odds, "More than " + number(result.count), result.more);
  card.append(odds);
  return card;
}

function renderDryResults(results) {
  dryResultsGrid.replaceChildren();
  dryResultsGrid.append(renderDryResultCard(
    results.anyUnique, "Any unique drop", "dom", true
  ));
  for (const item of SPECIAL_ITEMS) {
    dryResultsGrid.append(renderDryResultCard(results[item.id], item.name, item.id));
  }
  dryEmpty.hidden = true;
  dryResults.hidden = false;
}

function numberWithDecimals(value) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function clearDryResults() {
  dryEmpty.hidden = false;
  dryResults.hidden = true;
}

function selectMode(next) {
  mode = next;
  const isDry = mode === "dry";
  dryFields.hidden = !isDry;
  dryPanel.hidden = !isDry;
  lootPanel.hidden = isDry;
  lootModeButton.classList.toggle("is-active", !isDry);
  dryModeButton.classList.toggle("is-active", isDry);
  lootModeButton.setAttribute("aria-pressed", String(!isDry));
  dryModeButton.setAttribute("aria-pressed", String(isDry));
  actionLabel.textContent = isDry ? "Calculate chances" : "Simulate loot";
  showError("");
}

function readPlan() {
  return [...inputs.querySelectorAll("input")].map(input => {
    const raw = input.value.trim();
    if (!/^(0|[1-9]\d*)$/.test(raw)) {
      throw new RangeError("Enter a non-negative whole number for delve " + depthLabel(Number(input.dataset.depth)) + ".");
    }
    const count = Number(raw);
    if (!Number.isSafeInteger(count)) {
      throw new RangeError("Delve count for level " + depthLabel(Number(input.dataset.depth)) + " is too large.");
    }
    return { depth: Number(input.dataset.depth), count };
  }).filter(row => row.count > 0);
}

function showError(message) {
  validationMessage.textContent = message;
  validationMessage.hidden = !message;
}

function updatePlanSummary() {
  try {
    const plan = readPlan();
    const runs = plan.reduce((sum, row) => sum + row.count, 0);
    const floors = plan.reduce((sum, row) => sum + row.count, 0);
    plannedRuns.textContent = number(runs) + " delves · " + number(floors) + " drop rolls";
    plannedRuns.style.color = floors > MAX_FLOOR_ROLLS ? "var(--danger)" : "";
  } catch {
    plannedRuns.textContent = "Check your run counts";
    plannedRuns.style.color = "var(--danger)";
  }
}

function makeSprite(id) {
  const image = document.createElement("img");
  image.src = "./assets/items/" + id + ".png";
  image.alt = "";
  image.loading = "lazy";
  image.width = 36;
  image.height = 32;
  return image;
}

function renderUniqueCards(result) {
  uniqueGrid.replaceChildren();
  for (const item of SPECIAL_ITEMS) {
    const count = result.drops[item.id] ?? 0;
    const card = document.createElement("div");
    card.className = "unique-card" + (count ? " found" : "");

    const name = document.createElement("strong");
    name.textContent = item.name;
    const amount = document.createElement("span");
    amount.className = "count";
    amount.textContent = "× " + number(count);

    const detail = document.createElement("span");
    detail.className = "rarity";
    detail.textContent = item.id === "dom"
      ? "From 6 · up to 1/" + number(domDenominator(9))
      : "From " + item.minimumDepth + " · up to 1/" + number(gearDenominator(9));

    card.append(makeSprite(item.id), name, amount, detail);
    uniqueGrid.append(card);
  }
}

function renderLoot(result) {
  lootGrid.replaceChildren();
  const specialIds = new Set(SPECIAL_ITEMS.map(item => item.id));
  const entries = Object.entries(result.drops)
    .filter(([id, count]) => count > 0 && !specialIds.has(id))
    .sort((a, b) => b[1] - a[1] || (ITEM_DETAILS[a[0]]?.name || "").localeCompare(ITEM_DETAILS[b[0]]?.name || ""));

  document.getElementById("item-count").textContent = number(entries.length) + " item types";
  for (const [id, count] of entries) {
    const item = ITEM_DETAILS[id];
    const entry = document.createElement("div");
    entry.className = "loot-item";
    entry.title = item.name;

    const icon = document.createElement("div");
    icon.className = "loot-icon";
    icon.append(makeSprite(id));

    const info = document.createElement("div");
    info.className = "loot-info";
    const amount = document.createElement("strong");
    amount.textContent = "× " + number(count);
    const name = document.createElement("span");
    name.textContent = item.name;
    info.append(amount, name);
    entry.append(icon, info);
    lootGrid.append(entry);
  }
}

function renderResult(result) {
  renderUniqueCards(result);
  renderLoot(result);
  emptyState.hidden = true;
  resultsContent.hidden = false;
}

function clearResults() {
  emptyState.hidden = false;
  resultsContent.hidden = true;
}

for (let depth = 1; depth <= MAX_DEPTH; depth++) makeDepthField(depth);
for (const item of SPECIAL_ITEMS) makeDryField(item);
lootModeButton.addEventListener("click", () => selectMode("loot"));
dryModeButton.addEventListener("click", () => selectMode("dry"));
dryInputs.addEventListener("input", () => {
  showError("");
  clearDryResults();
});
updatePlanSummary();

inputs.addEventListener("input", () => {
  clearDryResults();
  showError("");
  updatePlanSummary();
});

clearButton.addEventListener("click", () => {
  inputs.querySelectorAll("input").forEach(input => { input.value = "0"; });
  dryInputs.querySelectorAll("input").forEach(input => { input.value = "0"; });
  updatePlanSummary();
  showError("");
  clearResults();
  clearDryResults();
});

form.addEventListener("submit", event => {
  event.preventDefault();
  showError("");
  try {
    const plan = readPlan();
    validatePlan(plan);
    if (mode === "dry") renderDryResults(calculateDryResults(plan, readDryCounts()));
    else renderResult(simulate(plan));
  } catch (error) {
    showError(error instanceof Error ? error.message : "The simulation could not be completed.");
  }
});
