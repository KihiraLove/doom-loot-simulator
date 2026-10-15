import {
  SPECIAL_ITEMS, ITEM_DETAILS, MAX_DEPTH, MAX_FLOOR_ROLLS,
  gearDenominator, domDenominator, simulate, validatePlan
} from "./simulator.mjs";

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

function readPlan() {
  return [...inputs.querySelectorAll("input")].map(input => {
    const raw = input.value.trim();
    if (!/^(0|[1-9]\d*)$/.test(raw)) {
      throw new RangeError("Enter a non-negative whole number for delve " + depthLabel(Number(input.dataset.depth)) + ".");
    }
    const count = Number(raw);
    if (!Number.isSafeInteger(count)) {
      throw new RangeError("Run count for delve " + depthLabel(Number(input.dataset.depth)) + " is too large.");
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
    const floors = plan.reduce((sum, row) => sum + row.depth * row.count, 0);
    plannedRuns.textContent = number(runs) + " runs · " + number(floors) + " floor rolls";
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
updatePlanSummary();

inputs.addEventListener("input", () => {
  showError("");
  updatePlanSummary();
});

document.querySelectorAll("[data-preset-depth]").forEach(button => {
  button.addEventListener("click", () => {
    const depth = Number(button.dataset.presetDepth);
    inputs.querySelectorAll("input").forEach(input => {
      input.value = Number(input.dataset.depth) === depth ? button.dataset.presetCount : "0";
    });
    showError("");
    updatePlanSummary();
  });
});

clearButton.addEventListener("click", () => {
  inputs.querySelectorAll("input").forEach(input => { input.value = "0"; });
  updatePlanSummary();
  showError("");
  clearResults();
});

form.addEventListener("submit", event => {
  event.preventDefault();
  showError("");
  try {
    const plan = readPlan();
    validatePlan(plan);
    renderResult(simulate(plan));
  } catch (error) {
    showError(error instanceof Error ? error.message : "The simulation could not be completed.");
  }
});
