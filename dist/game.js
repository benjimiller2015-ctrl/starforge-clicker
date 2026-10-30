// STARFORGE: a small browser game, with no build step.
// Read from top to bottom: game data, saved progress, calculations, controls,
// screen updates, comet events, and finally the startup code.
// index.html loads this script after the page elements have been created.

// 1. Game data: equipment, research, rewards, and milestones.
// Equipment order matters: owned[index] and research[index] use this same order.
// The pickaxe (index 0) improves clicks; all other equipment mines automatically.
const catalog = [
  {
    name: "Reinforced pickaxe",
    icon: "⚒",
    desc: "+1 stardust per click",
    base: 15,
    click: 1,
    rate: 0,
  },
  {
    name: "Mining drone",
    icon: "⌘",
    desc: "+1 stardust per second",
    base: 50,
    click: 0,
    rate: 1,
  },
  {
    name: "Laser drill",
    icon: "ϟ",
    desc: "+8 stardust per second",
    base: 350,
    click: 0,
    rate: 8,
  },
  {
    name: "Orbital station",
    icon: "◎",
    desc: "+50 stardust per second",
    base: 2000,
    click: 0,
    rate: 50,
  },
  {
    name: "Star harvester",
    icon: "✦",
    desc: "+300 stardust per second",
    base: 12000,
    click: 0,
    rate: 300,
  },
];
// Each row is [name, icon, starting price, dust per second, research name].
const advancedEquipment = [
  ["Meteor miner", "☄", 75000, 1800, "Meteor extraction"],
  ["Asteroid refinery", "⬡", 450000, 10000, "Perfect extraction"],
  ["Lunar colony", "☾", 2800000, 55000, "Colony automation"],
  ["Solar collector", "☀", 18000000, 300000, "Radiant conversion"],
  ["Nebula siphon", "≋", 120000000, 1700000, "Nebula compression"],
  ["Planet cracker", "◉", 850000000, 9500000, "Core resonance"],
  ["Dyson swarm", "✺", 6000000000, 54000000, "Swarm coordination"],
  ["Wormhole rig", "⟡", 45000000000, 310000000, "Stable gateways"],
  ["Pulsar engine", "✷", 350000000000, 1800000000, "Pulse synchronization"],
  ["Black hole forge", "◌", 2800000000000, 11000000000, "Event horizon taps"],
  ["Galaxy foundry", "✧", 24000000000000, 68000000000, "Galactic assembly"],
  [
    "Dark matter reactor",
    "◆",
    220000000000000,
    430000000000,
    "Invisible catalysts",
  ],
  [
    "Quantum duplicator",
    "⚛",
    2100000000000000,
    2800000000000,
    "Quantum entanglement",
  ],
  [
    "Universe loom",
    "∞",
    22000000000000000,
    19000000000000,
    "Spacetime weaving",
  ],
  [
    "Eternity engine",
    "✵",
    250000000000000000,
    135000000000000,
    "Infinite harmonics",
  ],
];
advancedEquipment.forEach(([name, icon, base, miningRate]) =>
  catalog.push({
    name,
    icon,
    base,
    rate: miningRate,
    click: 0,
    desc: `+${miningRate} stardust per second`,
  }),
);
const labs = [
  "Diamond edges",
  "Drone intelligence",
  "Focused optics",
  "Station overclock",
  "Stellar fusion",
  ...advancedEquipment.map((equipment) => equipment[4]),
];
const romanTiers = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
];
const researchRequirements = [1, 5, 10, 25, 50, 75, 100, 125, 150, 175];
const cometStudies = [
  { name: "Golden attraction", catches: 7 },
  { name: "Celestial beacon", catches: 28 },
];
const cometRewards = [
  { name: "Mining frenzy", kind: "mining", factor: 10, seconds: 60 },
  { name: "Stardust windfall", kind: "instant", seconds: 600 },
  { name: "Click frenzy", kind: "click", factor: 100, seconds: 15 },
  { name: "Power surge", kind: "mining", factor: 25, seconds: 15 },
  { name: "Lucky fingers", kind: "click", factor: 10, seconds: 60 },
];
const goals = [
  [100, "First light"],
  [1000, "Cosmic explorer"],
  [10000, "Rising empire"],
  [100000, "Stellar architect"],
  [1000000, "Galactic legend"],
  [10000000, "Master of the cosmos"],
  [1e8, "Comet commander"],
  [1e9, "Lunar pioneer"],
  [1e10, "Solar sovereign"],
  [1e11, "Nebula navigator"],
  [1e12, "Planet sculptor"],
  [1e13, "Dyson dreamer"],
  [1e14, "Wormhole wanderer"],
  [1e15, "Pulsar pioneer"],
  [1e16, "Galaxy guardian"],
  [1e17, "Quantum voyager"],
  [1e18, "Universe weaver"],
  [1e19, "Beyond eternity"],
];

// 2. Saved progress. Keep these field names and storage keys compatible with old saves.
const createEmptyLevels = () => catalog.map(() => 0);
const mineAdjectives = [
  "Goofy",
  "Sleepy",
  "Wobbly",
  "Cosmic",
  "Sneaky",
  "Bouncy",
  "Sparkly",
  "Dizzy",
  "Silly",
  "Grumpy",
  "Jolly",
  "Fuzzy",
];
const mineCreatures = [
  "Pirate",
  "Space Sloth",
  "Moon Goblin",
  "Robot Duck",
  "Star Wizard",
  "Alien Penguin",
  "Comet Cowboy",
  "Astro Hamster",
  "Space Potato",
  "Rocket Raccoon",
  "Disco Dragon",
  "Meteor Monkey",
];
const randomMineOwner = () =>
  mineAdjectives[Math.floor(Math.random() * mineAdjectives.length)] +
  " " +
  mineCreatures[Math.floor(Math.random() * mineCreatures.length)];
const createNewState = () => ({
  mineOwner: randomMineOwner(),
  dust: 0, // Stardust available to spend.
  total: 0, // All stardust ever earned, including what has been spent.
  owned: createEmptyLevels(),
  research: createEmptyLevels(),
  stats: { clicks: 0, clickDust: 0, comets: 0, cometDust: 0, playSeconds: 0 },
  saved: Date.now(),
});
const SAVE_KEY = "starforge-v1";
let state = loadState();

function loadState() {
  let loadedState = createNewState();
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (
      saved &&
      Number.isFinite(saved.dust) &&
      saved.dust >= 0 &&
      Number.isFinite(saved.total) &&
      saved.total >= saved.dust &&
      Array.isArray(saved.owned) &&
      saved.owned.length >= 5 &&
      saved.owned.length <= catalog.length &&
      saved.owned.every(
        (count) => Number.isInteger(count) && count >= 0 && count < 10000,
      ) &&
      Number.isFinite(saved.saved)
    ) {
      loadedState = saved;
    }
  } catch {
    // A missing, unreadable, or broken save starts a fresh game.
  }
  loadedState.stats = Object.fromEntries(
    ["clicks", "clickDust", "comets", "cometDust", "playSeconds"].map((key) => [
      key,
      Number.isFinite(loadedState.stats?.[key]) && loadedState.stats[key] >= 0
        ? loadedState.stats[key]
        : 0,
    ]),
  );
  // Older saves may only contain the first five equipment types.
  loadedState.owned = catalog.map((_, index) => loadedState.owned[index] || 0);
  loadedState.research =
    Array.isArray(loadedState.research) &&
    loadedState.research.length >= 5 &&
    loadedState.research.length <= catalog.length &&
    loadedState.research.every(
      (level) => Number.isInteger(level) && level >= 0 && level <= 10,
    )
      ? catalog.map((_, index) => loadedState.research[index] || 0)
      : createEmptyLevels();

  return loadedState;
}

// Older saves stored only a level count. Turn that count into purchased tiers.
// New saves track tiers individually because players can buy them out of order.
function purchasedTiers(index) {
  if (!Array.isArray(state.researchTiers)) {
    state.researchTiers = [];
  }
  if (!Array.isArray(state.researchTiers[index])) {
    state.researchTiers[index] = Array.from(
      { length: 10 },
      (_, tier) => tier < state.research[index],
    );
  }
  return state.researchTiers[index];
}
catalog.forEach((_, index) => {
  state.research[index] = purchasedTiers(index).filter(Boolean).length;
});
function cleanMineOwner(value) {
  return (
    String(value)
      // Remove invisible control characters from player-entered names.
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .trim()
      .replace(/['’]s (?:asteroid )?mine$/i, "")
      .trim()
      .slice(0, 30)
  );
}
state.mineOwner =
  typeof state.mineOwner === "string" && cleanMineOwner(state.mineOwner)
    ? cleanMineOwner(state.mineOwner)
    : randomMineOwner();

const OPTIONS_KEY = "starforge-options-v1";
let options = { animations: true, comets: true };
try {
  const saved = JSON.parse(localStorage.getItem(OPTIONS_KEY));
  if (saved) {
    for (const key of ["animations", "comets"]) {
      if (typeof saved[key] === "boolean") {
        options[key] = saved[key];
      }
    }
  }
} catch {
  // Browser storage can be disabled; the game still works without persistence.
}

function earn(amount) {
  state.dust += amount;
  state.total += amount;
}
function save() {
  state.saved = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    getElement("saveStatus").textContent = "Saving unavailable";
  }
}

// 3. Helpers and calculations. These read state without spending or earning dust.
const getElement = (id) => document.getElementById(id);
// Keep small counts exact; shorten large ones (for example, 1500 becomes 1.500 k).
function formatNumber(number) {
  if (number < 1000) {
    return Math.floor(number).toLocaleString("en-US");
  }
  return Intl.NumberFormat("en", {
    notation: "compact",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })
    .format(number)
    .replace(/([A-Za-z]+)$/, (suffix) => " " + (suffix === "K" ? "k" : suffix));
}
// Each research purchase doubles the output of every matching piece of equipment.
const researchMultiplier = (index) => 2 ** (state.research?.[index] || 0);
// Temporary boosts live in memory and are not restored from a save.
let clickBoostUntil = 0;
let clickBoostValue = 1;
let miningBoostValue = 10;
const baseClickPower = () => 1 + state.owned[0] * researchMultiplier(0);
const clickPower = () =>
  baseClickPower() * (Date.now() < clickBoostUntil ? clickBoostValue : 1);
let cometBoostUntil = 0;
const miningBoostMultiplier = () =>
  Date.now() < cometBoostUntil ? miningBoostValue : 1;
const baseMiningRate = () =>
  catalog.reduce(
    (total, equipment, index) =>
      total + equipment.rate * state.owned[index] * researchMultiplier(index),
    0,
  );
const miningRate = () => baseMiningRate() * miningBoostMultiplier();
// Each equipment purchase raises the next price by 16%, rounded up.
const equipmentCost = (index) =>
  Math.ceil(catalog[index].base * 1.16 ** state.owned[index]);
// Tier I costs ten times the starting equipment price; each later tier costs 4x more.
function researchPrice(index, tier) {
  return catalog[index].base * 10 * 4 ** tier;
}
let toastTimer;
state.cometResearch = [0, 1].map(
  (index) => state.cometResearch?.[index] === true,
);
const cometFrequency = () =>
  2 ** (state.cometResearch || []).filter(Boolean).length;
// Easter egg: this mine name makes a golden comet appear every five seconds.
const hasLuckyMineName = () =>
  state.mineOwner.trim().toLowerCase() === "super lucky";
function cometDelay() {
  return hasLuckyMineName()
    ? 5
    : (120 + Math.random() * 120) / cometFrequency();
}
// 4. Controls: create buttons once and attach their click/change handlers.
const cometResearchPanel = document.createElement("div");
function createCometResearchButtons() {
  cometResearchPanel.id = "cometResearch";
  getElement("research").parentElement.append(cometResearchPanel);
  cometStudies.forEach((study, index) => {
    const button = document.createElement("button");
    button.className = "upgrade";
    button.onclick = () => {
      if (state.stats.comets < study.catches || state.cometResearch?.[index]) {
        return;
      }
      const before = cometFrequency();
      state.cometResearch ??= [false, false];
      state.cometResearch[index] = true;
      if (!hasLuckyMineName()) {
        cometWait *= before / cometFrequency();
      }
      window.starforgeAudio?.upgrade();
      save();
      render();
      toast(
        `${study.name}: golden comets now appear ${cometFrequency()}× as often!`,
      );
    };
    cometResearchPanel.append(button);
  });
}

function updateMineName() {
  getElement("mineName").textContent = state.mineOwner + "'s asteroid mine";
}
function setupMineName() {
  getElement("mineName").onclick = () => {
    const entered = prompt(
      "Choose the first part of your mine name (up to 30 characters). It will always end in 's asteroid mine.",
      state.mineOwner,
    );
    if (entered === null) {
      return;
    }
    const name = cleanMineOwner(entered);
    if (!name) {
      toast("Please enter a name for your mine.");
      return;
    }
    const wasLucky = hasLuckyMineName();
    state.mineOwner = name;
    if (wasLucky !== hasLuckyMineName()) {
      hideComet();
    }
    updateMineName();
    save();
  };
}

function setupOptions() {
  for (const key of ["animations", "comets"]) {
    const toggle = getElement(key + "Toggle");
    toggle.checked = options[key];
    toggle.onchange = () => {
      options[key] = toggle.checked;
      if (key === "comets" && !options.comets) {
        hideComet();
      }
      try {
        localStorage.setItem(OPTIONS_KEY, JSON.stringify(options));
      } catch {
        // Browser storage can be disabled; the game still works without persistence.
      }
    };
  }
}

function toast(message) {
  getElement("toast").textContent = message;
  getElement("toast").style.opacity = 1;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (getElement("toast").style.opacity = 0), 3500);
}
function createEquipmentButtons() {
  catalog.forEach((equipment, index) => {
    const button = document.createElement("button");
    button.className = "upgrade";
    button.innerHTML = `
      <span class="icon" aria-hidden="true">${equipment.icon}</span>
      <span class="info">
        <strong>${equipment.name}</strong>
        <small>${equipment.desc}</small>
      </span>
      <span class="price">
        <span id="cost${index}"></span>
        <small id="owned${index}"></small>
      </span>
    `;
    button.onclick = () => {
      const price = equipmentCost(index);
      if (state.dust < price) {
        return;
      }
      state.dust -= price;
      state.owned[index]++;
      window.starforgeAudio?.upgrade();
      save();
      render();
      toast(`${equipment.name} added to your fleet`);
    };
    getElement("upgrades").append(button);
  });
}

function setupMiningButtons() {
  getElement("mine").onclick = (event) => {
    window.starforgeAudio?.click();
    const amount = clickPower();
    state.stats.clicks++;
    state.stats.clickDust += amount;
    earn(amount);
    render();
    if (!options.animations) {
      return;
    }
    const popup = document.createElement("span");
    popup.className = "pop";
    popup.textContent = "+" + formatNumber(amount);
    const bounds = getElement("mine").getBoundingClientRect();
    popup.style.left = (event.clientX || bounds.x + bounds.width / 2) + "px";
    popup.style.top = (event.clientY || bounds.y + bounds.height / 2) + "px";
    document.body.append(popup);
    setTimeout(() => popup.remove(), 850);
  };
  getElement("reset").onclick = () => {
    if (
      confirm(
        "Permanently wipe all stardust, equipment, research, discoveries, and stats? This cannot be undone.",
      )
    ) {
      state = createNewState();
      updateMineName();
      cometBoostUntil = 0;
      clickBoostUntil = 0;
      getElement("mine").classList.remove("frenzy");
      hideComet();
      save();
      render();
      toast("A fresh universe awaits.");
    }
  };
}

function createResearchButtons() {
  labs.forEach((name, index) =>
    romanTiers.forEach((roman, tier) => {
      const button = document.createElement("button");
      button.className = "upgrade";
      button.onclick = () => {
        const price = researchPrice(index, tier);
        if (
          purchasedTiers(index)[tier] ||
          state.owned[index] < researchRequirements[tier] ||
          state.dust < price
        ) {
          return;
        }
        state.dust -= price;
        purchasedTiers(index)[tier] = true;
        state.research[index] = purchasedTiers(index).filter(Boolean).length;
        window.starforgeAudio?.upgrade();
        save();
        render();
        toast(`${name} · Tier ${roman} purchased!`);
      };
      getElement("research").append(button);
    }),
  );
}

// 5. Screen updates. render() coordinates the smaller rendering functions below.
function renderSummary() {
  getElement("balance").textContent = formatNumber(state.dust);
  getElement("power").textContent = "+" + formatNumber(clickPower());
  getElement("rate").textContent = formatNumber(miningRate());
  const goal = goals.find((goal) => state.total < goal[0]) || goals.at(-1);
  getElement("goalTitle").textContent =
    state.total >= goals.at(-1)[0]
      ? "Beyond eternity · All milestones reached!"
      : `${goal[1]} · Mine ${formatNumber(goal[0])} stardust`;
  getElement("progress").textContent =
    formatNumber(Math.min(state.total, goal[0])) +
    " / " +
    formatNumber(goal[0]);
  getElement("fill").style.width =
    Math.min(100, (state.total / goal[0]) * 100) + "%";
}
function discoveries(key, owned) {
  const previous = state[key];
  state[key] = catalog.map(
    (_, index) => Boolean(previous?.[index]) || owned(index),
  );
}
function render() {
  renderSummary();
  discoveries("discovered", (index) => state.owned[index] > 0);
  discoveries(
    "researchDiscovered",
    (index) => (state.research?.[index] || 0) > 0,
  );
  const changed = revealAffordableEquipment();
  renderEquipment();
  renderResearch();
  renderStats();
  if (changed) {
    save();
  }
}
// An equipment name is revealed once the bank reaches 60% of its price.
// Discoveries stay visible even after spending stardust.
function revealAffordableEquipment() {
  let changed = false;
  catalog.forEach((_, index) => {
    if (
      !state.discovered[index] &&
      state.dust >= Math.ceil((equipmentCost(index) * 3) / 5)
    ) {
      state.discovered[index] = true;
      changed = true;
    }
  });
  return changed;
}

function renderEquipment() {
  [...getElement("upgrades").children].forEach((button, index) => {
    button.disabled = state.dust < equipmentCost(index);
    getElement("cost" + index).textContent =
      "✦ " + formatNumber(equipmentCost(index));
    getElement("owned" + index).textContent = "Owned " + state.owned[index];
    const known = state.discovered[index];
    const production =
      catalog[index].rate *
      state.owned[index] *
      researchMultiplier(index) *
      miningBoostMultiplier();
    const share = miningRate() > 0 ? (production / miningRate()) * 100 : 0;
    const productionHint =
      index === 0
        ? "Click-only equipment: 0.00% of your stardust per second."
        : `${share.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}% of your total stardust per second (${formatNumber(production)} / second from all owned).`;
    button.title = productionHint;
    // Inner elements also carry the hint so it works on unaffordable buttons.
    button
      .querySelectorAll(".icon, .info, .price")
      .forEach((part) => (part.title = productionHint));
    button.querySelector(".icon").textContent = known
      ? catalog[index].icon
      : "?";
    button.querySelector(".info strong").textContent = known
      ? catalog[index].name
      : "Unknown upgrade";
    button.querySelector(".info small").textContent = known
      ? index === 0
        ? `+${formatNumber(researchMultiplier(index))} stardust per click each`
        : `+${formatNumber(catalog[index].rate * researchMultiplier(index))} stardust per second each`
      : `???`;
    button.setAttribute(
      "aria-label",
      known
        ? `${catalog[index].name}, costs ${equipmentCost(index)} stardust, owned ${state.owned[index]}`
        : `Unknown upgrade, costs ${equipmentCost(index)} stardust`,
    );
  });

  // Keep just two mystery boxes beyond the furthest discovered equipment.
  const lastKnown = state.discovered.reduce(
    (lastKnownIndex, known, index) => (known ? index : lastKnownIndex),
    -1,
  );
  [...getElement("upgrades").children].forEach((button, index) => {
    button.style.display = index <= lastKnown + 2 ? "" : "none";
  });
}

function renderResearch() {
  [...getElement("research").children].forEach((button, buttonIndex) => {
    // Buttons are grouped by equipment, with ten research tiers in each group.
    const index = Math.floor(buttonIndex / romanTiers.length);
    const tier = buttonIndex % romanTiers.length;
    const available =
      state.owned[index] >= researchRequirements[tier] &&
      !purchasedTiers(index)[tier];
    const price = researchPrice(index, tier);
    button.style.display = available ? "" : "none";
    button.disabled = !available || state.dust < price;
    button.title = `Requires ${researchRequirements[tier]} matching equipment (${state.owned[index]} owned)`;
    button.innerHTML = `
      <span class="icon" aria-hidden="true">${catalog[index].icon}</span>
      <span class="info">
        <strong>${labs[index]} · Tier ${romanTiers[tier]}</strong>
        <small>Doubles output of every ${catalog[index].name.toLowerCase()}</small>
        <small>Applies to owned and future equipment</small>
      </span>
      <span class="price">✦ ${formatNumber(price)}</span>
    `;
  });
  cometStudies.forEach((study, index) => {
    const button = cometResearchPanel.children[index];
    button.style.display =
      state.stats.comets >= study.catches && !state.cometResearch?.[index]
        ? ""
        : "none";
    button.innerHTML = `
      <span class="icon" aria-hidden="true">☄</span>
      <span class="info">
        <strong>${study.name} · Tier ${index === 0 ? "I" : "II"}</strong>
        <small>Golden comets appear twice as often. Stacks with other comet research.</small>
        <small>Unlocked after ${study.catches} golden comet catches</small>
      </span>
      <span class="price">Free</span>
    `;
  });
}

function renderStats() {
  if (!getElement("playerStats").open) {
    return;
  }
  const exact = (n) => Math.floor(n).toLocaleString("en-US");
  const equipment = state.owned.reduce((total, count) => total + count, 0);
  const research = state.research.reduce((total, count) => total + count, 0);
  const seconds = Math.floor(state.stats.playSeconds);
  const stats = [
    ["Stardust in your bank", exact(state.dust)],
    ["Lifetime stardust earned", exact(state.total)],
    ["Stardust spent", exact(Math.max(0, state.total - state.dust))],
    ["Asteroid clicks", exact(state.stats.clicks)],
    ["Stardust from clicks", exact(state.stats.clickDust)],
    ["Stardust per click", formatNumber(clickPower())],
    ["Current stardust per second", formatNumber(miningRate())],
    ["Normal stardust per second", formatNumber(baseMiningRate())],
    ["Equipment owned", exact(equipment)],
    [
      "Equipment types owned",
      `${state.owned.filter((n) => n > 0).length} / ${catalog.length}`,
    ],
    [
      "Research levels purchased",
      `${exact(research)} / ${catalog.length * 10}`,
    ],
    ["Golden comets caught", exact(state.stats.comets)],
    ["Stardust from comets", exact(state.stats.cometDust)],
    [
      "Milestones reached",
      `${goals.filter((goal) => state.total >= goal[0]).length} / ${goals.length}`,
    ],
    [
      "Active time played",
      `${Math.floor(seconds / 3600)}h ${Math.floor(seconds / 60) % 60}m ${seconds % 60}s`,
    ],
  ];
  getElement("statsList").innerHTML = stats
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join("");
  renderResearchHistory();
}

function renderResearchHistory() {
  const purchased = catalog.flatMap((_, index) =>
    purchasedTiers(index).flatMap((bought, tier) =>
      bought
        ? [
            `<li>
<strong>${labs[index]} · Tier ${romanTiers[tier]}</strong> — doubles ${catalog[index].name.toLowerCase()} output</li>`,
          ]
        : [],
    ),
  );
  cometStudies.forEach((study, index) => {
    if (state.cometResearch?.[index]) {
      purchased.push(
        `<li>
<strong>${study.name} · Tier ${index === 0 ? "I" : "II"}</strong> — golden comets appear twice as often</li>`,
      );
    }
  });
  getElement("researchHistory").innerHTML = purchased.length
    ? `<ul>${purchased.join("")}</ul>`
    : "No research purchased yet.";
}

// 6. Golden comet events and their temporary rewards.
// Golden comets appear after 2–4 minutes of active play and drift for 30 seconds.
const comet = document.createElement("button");
comet.id = "goldenComet";
comet.type = "button";
comet.hidden = true;
comet.setAttribute("aria-label", "Catch golden comet for one random reward");
comet.innerHTML = '<span aria-hidden="true">☄</span><small>Catch me!</small>';
document.body.append(comet);
const boostNotice = document.createElement("div");
boostNotice.id = "cometBoost";
boostNotice.hidden = true;
boostNotice.setAttribute("role", "status");
document.body.append(boostNotice);
let cometWait = cometDelay();
let cometAge = 0;
function hideComet() {
  comet.hidden = true;
  cometAge = 0;
  cometWait = cometDelay();
}
function updateComet(elapsed) {
  getElement("mine").classList.toggle(
    "frenzy",
    miningBoostMultiplier() > 1 || Date.now() < clickBoostUntil,
  );
  const remaining = Math.max(
    0,
    Math.ceil((cometBoostUntil - Date.now()) / 1000),
  );
  const clickRemaining = Math.max(
    0,
    Math.ceil((clickBoostUntil - Date.now()) / 1000),
  );
  boostNotice.hidden = remaining === 0 && clickRemaining === 0;
  const label = [
    remaining ? `${miningBoostValue}× mining · ${remaining}s left` : "",
    clickRemaining
      ? `${clickBoostValue}× clicks · ${clickRemaining}s left`
      : "",
  ]
    .filter(Boolean)
    .join(" | ");
  if (boostNotice.textContent !== label) {
    boostNotice.textContent = label;
  }
  if (document.hidden || !options.comets) {
    return;
  }
  if (hasLuckyMineName()) {
    cometWait -= elapsed;
    if (cometWait <= 0) {
      comet.hidden = false;
      cometAge = 0;
      cometWait = 5;
      comet.style.top = 20 + Math.random() * 45 + "vh";
      comet.style.left = "-100px";
    } else if (!comet.hidden) {
      cometAge += elapsed;
      comet.style.left = `calc(${(cometAge / 30) * 120}vw - 100px)`;
    }
    return;
  }
  if (comet.hidden) {
    cometWait -= elapsed;
    if (cometWait <= 0 && remaining === 0) {
      cometAge = 0;
      comet.hidden = false;
      comet.style.top = 20 + Math.random() * 45 + "vh";
      comet.style.left = "-100px";
    }
  } else {
    cometAge += elapsed;
    comet.style.left = `calc(${(cometAge / 30) * 120}vw - 100px)`;
    if (cometAge >= 30) {
      hideComet();
    }
  }
}
const rewardBanner = document.createElement("div");
rewardBanner.id = "rewardBanner";
rewardBanner.hidden = true;
rewardBanner.setAttribute("role", "status");
rewardBanner.setAttribute("aria-live", "polite");
rewardBanner.innerHTML = `<span class="reward-star" aria-hidden="true">✦</span><div>
<strong id="rewardHeading"></strong><p id="rewardDescription"></p></div><button type="button" aria-label="Dismiss reward announcement">×</button>`;
document.body.append(rewardBanner);
let rewardBannerTimer;
rewardBanner.querySelector("button").onclick = () => {
  rewardBanner.hidden = true;
  clearTimeout(rewardBannerTimer);
};
function announceReward(reward, message) {
  getElement("rewardHeading").textContent = reward.name.toUpperCase() + "!";
  getElement("rewardDescription").textContent = message;
  rewardBanner.hidden = false;
  clearTimeout(rewardBannerTimer);
  rewardBannerTimer = setTimeout(() => {
    rewardBanner.hidden = true;
  }, 6500);
}
function claimCometReward(reward) {
  if (reward.kind === "instant") {
    const amount = Math.max(
      baseMiningRate() * reward.seconds,
      baseClickPower() * 100,
    );
    state.stats.cometDust += amount;
    earn(amount);
    return `${reward.name}! +${formatNumber(amount)} stardust.`;
  }
  if (reward.kind === "mining") {
    miningBoostValue = reward.factor;
    cometBoostUntil = Date.now() + reward.seconds * 1000;
  } else {
    clickBoostValue = reward.factor;
    clickBoostUntil = Date.now() + reward.seconds * 1000;
  }
  return `${reward.name}! ${reward.factor}× ${reward.kind === "mining" ? "mining" : "click power"} for ${reward.seconds} seconds.`;
}
comet.onclick = () => {
  if (comet.hidden) {
    return;
  }
  hideComet();
  state.stats.comets++;
  const reward = cometRewards[Math.floor(Math.random() * cometRewards.length)];
  const message = claimCometReward(reward);
  announceReward(reward, message);
  window.starforgeAudio?.upgrade();
  updateComet(0);
  save();
  render();
  toast(message);
};

// 7. Start the game and keep it running.
// Earn only on live browser ticks, never from saved timestamps or long pauses.
let lastTickTime = performance.now();
createEquipmentButtons();
createResearchButtons();
createCometResearchButtons();
setupMineName();
setupOptions();
setupMiningButtons();
updateMineName();
render();
save();
function tick() {
  const now = performance.now();
  // Cap a delayed tick at one second so waking the device gives no offline windfall.
  const elapsed = Math.min(1, Math.max(0, (now - lastTickTime) / 1000));
  lastTickTime = now;
  updateComet(elapsed);
  state.stats.playSeconds += elapsed;
  earn(miningRate() * elapsed);
  render();
}

setInterval(tick, 100);
setInterval(save, 5000);
window.addEventListener("pagehide", save);
window.addEventListener("pageshow", () => {
  lastTickTime = performance.now();
});
function restartMiningClock() {
  lastTickTime = performance.now();
}
document.addEventListener("resume", restartMiningClock);
document.addEventListener("visibilitychange", () => {
  restartMiningClock();
  if (document.hidden) {
    save();
  }
});
