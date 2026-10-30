import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

const html = readFileSync(
  new URL("../dist/index.html", import.meta.url),
  "utf8",
);
const gameScript = readFileSync(
  new URL("../dist/game.js", import.meta.url),
  "utf8",
);

// Load the real page and script, but advance the clock ourselves instead of waiting.
function openGame(t, { saved, brokenStorage = false, random = 0 } = {}) {
  const dom = new JSDOM(html, {
    url: "https://starforge.example/",
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  t.after(() => dom.window.close());
  const { window } = dom;
  const intervals = [];
  let milliseconds = 0;
  window.performance.now = () => milliseconds;
  window.Date.now = () => 1000000 + milliseconds;
  window.Math.random = () => random;
  window.setInterval = (callback, delay) => intervals.push({ callback, delay });
  window.setTimeout = () => 0;
  window.confirm = () => true;
  if (saved !== undefined) {
    window.localStorage.setItem("starforge-v1", JSON.stringify(saved));
  }
  window.localStorage.setItem(
    "starforge-options-v1",
    JSON.stringify({ animations: false, comets: true }),
  );
  if (brokenStorage) {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage disabled");
      },
    });
  }
  window.eval(gameScript);
  const element = (id) => window.document.getElementById(id);
  return {
    window,
    element,
    clickEquipment(index) {
      element("upgrades").children[index].click();
    },
    savedState() {
      window.dispatchEvent(new window.Event("pagehide"));
      return JSON.parse(window.localStorage.getItem("starforge-v1"));
    },
    tick(seconds) {
      milliseconds += seconds * 1000;
      intervals.find(({ delay }) => delay === 100).callback();
    },
  };
}

function oldSave(overrides = {}) {
  return {
    mineOwner: "Test Pilot",
    dust: 10000,
    total: 10000,
    owned: [0, 0, 0, 0, 0],
    saved: 1,
    ...overrides,
  };
}

test("clicks earn dust; purchases spend it and improve future clicks", (t) => {
  const game = openGame(t);
  assert.equal(game.element("upgrades").children.length, 20);
  assert.equal(game.element("research").children.length, 200);
  game.clickEquipment(0);
  assert.equal(game.savedState().owned[0], 0);
  for (let click = 0; click < 15; click++) game.element("mine").click();
  game.clickEquipment(0);
  assert.equal(game.element("balance").textContent, "0");
  assert.equal(game.element("power").textContent, "+2");
  game.element("mine").click();
  const state = game.savedState();
  assert.equal(state.dust, 2);
  assert.equal(state.total, 17);
  assert.equal(state.stats.clicks, 16);
});

test("older saves expand equipment and migrate research without offline earnings", (t) => {
  const game = openGame(t, {
    saved: oldSave({ owned: [2, 1, 0, 0, 0], research: [1, 0, 0, 0, 0] }),
  });
  const state = game.savedState();
  assert.equal(state.dust, 10000);
  assert.equal(state.owned.length, 20);
  assert.equal(state.researchTiers[0][0], true);
  assert.equal(game.element("power").textContent, "+5");
  game.tick(0.5);
  assert.equal(game.savedState().dust, 10000.5);
  game.tick(60);
  assert.equal(game.savedState().dust, 10001.5);
});

test("research tiers can be purchased out of order, once each", (t) => {
  const game = openGame(t, { saved: oldSave({ owned: [5, 0, 0, 0, 0] }) });
  const tierTwo = game.element("research").children[1];
  tierTwo.click();
  tierTwo.click();
  const state = game.savedState();
  assert.equal(state.dust, 9400);
  assert.equal(state.research[0], 1);
  assert.equal(state.researchTiers[0][0], false);
  assert.equal(state.researchTiers[0][1], true);
  assert.equal(game.element("power").textContent, "+11");
  game.element("playerStats").open = true;
  game.tick(0);
  assert.match(
    game.element("researchHistory").textContent,
    /Diamond edges · Tier II/,
  );
});

test("discovered equipment stays revealed after spending dust", (t) => {
  const game = openGame(t, { saved: oldSave({ dust: 30, total: 30 }) });
  const drone = game.element("upgrades").children[1];
  assert.match(drone.textContent, /Mining drone/);
  game.clickEquipment(0);
  assert.equal(game.savedState().dust, 15);
  assert.match(drone.textContent, /Mining drone/);
});

test("comet rewards boost mining temporarily", (t) => {
  const game = openGame(t, {
    saved: oldSave({ mineOwner: "Super Lucky", owned: [0, 1, 0, 0, 0] }),
  });
  for (let second = 0; second < 5; second++) game.tick(1);
  assert.equal(game.element("goldenComet").hidden, false);
  game.element("goldenComet").click();
  assert.equal(game.savedState().stats.comets, 1);
  assert.equal(game.element("rate").textContent, "10");
  assert.match(game.element("rewardHeading").textContent, /MINING FRENZY/);
  game.tick(61);
  assert.equal(game.element("rate").textContent, "1");
});

test("comet research unlocks at seven catches and is free", (t) => {
  const game = openGame(t, {
    saved: oldSave({ stats: { comets: 7 } }),
  });
  game.element("cometResearch").children[0].click();
  const state = game.savedState();
  assert.deepEqual(state.cometResearch, [true, false]);
  assert.equal(state.dust, 10000);
  assert.match(game.element("toast").textContent, /2× as often/);
});

test("reset clears progress and temporary boosts", (t) => {
  const game = openGame(t, { saved: oldSave({ owned: [5, 3, 0, 0, 0] }) });
  game.element("reset").click();
  const state = game.savedState();
  assert.equal(state.dust, 0);
  assert.equal(state.total, 0);
  assert.equal(
    state.owned.reduce((sum, count) => sum + count, 0),
    0,
  );
  assert.equal(game.element("power").textContent, "+1");
  assert.equal(game.element("rate").textContent, "0");
});

test("invalid saves start fresh, and disabled storage still allows play", (t) => {
  const invalid = openGame(t, { saved: oldSave({ dust: -1 }) });
  assert.equal(invalid.savedState().dust, 0);
  const unavailable = openGame(t, { brokenStorage: true });
  unavailable.element("mine").click();
  assert.equal(unavailable.element("balance").textContent, "1");
  assert.equal(
    unavailable.element("saveStatus").textContent,
    "Saving unavailable",
  );
});
