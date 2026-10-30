# Starforge Clicker

Click the asteroid to earn stardust, buy equipment to mine automatically, and research upgrades to increase production.

## Play locally

Open `dist/index.html` in your browser. The game uses plain HTML, CSS, and JavaScript, so there is no build step. Progress is saved in that browser's local storage.

## Read the code

Start with `dist/game.js`. Its numbered sections follow the parts of the game:

1. **Game data:** equipment prices, production amounts, research names, rewards, and milestones. Equipment order matters because saved progress uses the same indexes.
2. **Saved progress:** `state` holds the player's bank, lifetime earnings, equipment, research, and statistics. `loadState()` also handles saves from older versions.
3. **Helpers and calculations:** functions such as `clickPower()`, `miningRate()`, and `equipmentCost()` calculate values from the current state.
4. **Controls:** create the shop buttons and connect player actions to changes in state.
5. **Screen updates:** `render()` calls smaller functions to show the current balance, shop, research, and statistics.
6. **Comets:** manage comet movement, random rewards, and temporary boosts.
7. **Startup and clock:** connect everything and run `tick()` every 100 milliseconds. Mining uses elapsed seconds, with a cap to prevent offline earnings.

A typical action follows this path: **click a button → update `state` → call `render()`**. Purchases also call `save()`; regular clicks are saved by the automatic save timer.

For a small first change, try editing an equipment name or price in `catalog`, or adding an adjective to `mineAdjectives`. Keep storage keys and saved field names unchanged so existing players can keep their progress.

`dist/index.html` contains the page and styles. `dist/audio.js` handles synthesized music and sound effects.

## Format and check changes

Install Node.js 22.13 or newer, then run these commands from the project folder:

```sh
npm ci
npm run format
npm run check
```

- `npm run format` uses **Prettier** to fix indentation, spacing, and line breaks.
- `npm run lint` uses **ESLint** to catch common mistakes such as misspelled variables and requires braces around conditions and loops.
- `npm test` checks gameplay, research, comets, resets, and compatibility with older saves using a simulated browser.
- `npm run check` runs lint, formatting checks, and tests together.

The tools currently cover `game.js`, tests, and the new project configuration/documentation. The existing HTML and audio script are outside this cleanup. Development tools are only needed when editing; playing and GitHub Pages deployment still use the files in `dist` directly.
