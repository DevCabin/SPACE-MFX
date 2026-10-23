# SPACE-MFX — Developer Onboarding Guide

Welcome to the team! This document is written as if I (the original creator) am walking you through the codebase on your first day. By the end of it you should understand how the game is put together, where everything lives, and how to make changes safely.

---

## 1. What is SPACE-MFX?

**SPACE-MFX** ("Mine, Fight, Explore!") is a single-player, browser-based space strategy/action game. The player commands a ship in a procedurally generated asteroid field and must:

- **Mine** asteroids for raw materials and power gems
- **Fight** AI enemies and terrifying space monsters that hatch from "cosmic eggs"
- **Explore/Conquer** planets by claiming them and building bases
- **Upgrade** their ship and planetary defenses
- Complete one of three mission types before dying or winning

It is rendered entirely to an **HTML5 Canvas** with a dark, green-accented, monospace "terminal" aesthetic. All input is keyboard-only.

**Live repo:** `https://github.com/DevCabin/SPACE-MFX`  
**Author:** George Featherstone (credit linked via `devcabin.com`)  
**License:** MIT

---

## 2. Tech Stack

| Layer | Tech | Version (from package.json) |
|-------|------|-----------------------------|
| Language | TypeScript | ^5.2.2 |
| Build / Dev Server | Vite | ^5.0.8 |
| Rendering | HTML5 Canvas (2D context) | — |
| Styling | Plain CSS | — |
| Serverless API (leaderboard template) | `@vercel/node` | ^3.2.29 |
| Deployment target | Vercel | — |
| Package manager | npm | — |

Key npm scripts (in `package.json`):
- `npm run dev` — Start Vite dev server (hot reload)
- `npm run build` — Run `tsc` type-check, then `vite build` to `dist/`
- `npm run preview` — Serve the production build locally

There is **no test suite** in the repo. Manual playtesting through `npm run dev` is the primary verification method.

---

## 3. Project Structure (top level)

```
SPACE-MFX/
├── index.html            # Entry HTML. Title screen + hidden #app container. Loads /src/main.ts
├── package.json          # Scripts + dependencies
├── package-lock.json
├── tsconfig.json         # TypeScript config (app code)
├── tsconfig.node.json    # TypeScript config (node/Vercel edge)
├── .gitignore
├── README.md             # User-facing feature/deploy docs
├── developers.md         # You are here — internal onboarding
├── api/
│   └── leaderboard.ts    # Vercel serverless function stub (GET/POST leaderboard)
├── dist/                 # Production build output (gitignored / built artifact)
├── node_modules/
└── src/
    ├── main.ts           # Entry point. Creates canvas, shows title screen, starts Game
    ├── Game.ts           # The "God class" / main game controller (orchestrates all systems)
    ├── style.css         # All game styling (title screen, canvas, HUD, buttons)
    ├── utils/MathUtils.ts# Math helpers: randomBetween, distance, generateId
    ├── data/             # Static game data definitions
    │   ├── ShipRoles.ts  # 3 ship classes: Explorer, Miner, Fighter
    │   ├── Missions.ts   # 3 mission types: Mining, Extermination, Colonial Expansion
    │   └── Difficulties.ts # 3 difficulty levels: Normal, Hard, Nightmare
    ├── types/GameTypes.ts# All TypeScript interfaces (Ship, Asteroid, Enemy, Planet, etc.)
    └── systems/          # ~26 modular game systems (see section 6)
```


---

## 4. Entry Point & Boot Sequence

### `index.html`
- Shows a full-screen title screen (`#title-screen`) with animated CSS starfield and "SPACE MFX" title.
- Contains a hidden `#app` div where the game canvas is injected.
- After animations finish, listens for **any keypress** (`startGame`) to begin.

### `src/main.ts`
1. Grabs `#app`, creates a `<canvas>` (1024×768), appends title/instructions/debug-info divs.
2. Instantiates `new Game(canvas)` and calls `game.start()`.
3. Starts a `setInterval` debug overlay that prints game status, ship position/velocity, and entity counts every 100ms.
4. Adds a "Regenerate Asteroids" test button.

### `src/Game.ts` — The orchestrator
This is the most important file. `Game` is a monolithic controller that:
- Holds the single `gameState` object.
- Manages the **game phase** state machine: `roleSelection → difficultySelection → missionSelection → nameEntry → playing`.
- Instantiates and calls every system each frame.
- Runs the `gameLoop` via `requestAnimationFrame`.

The loop order per frame:
1. Read delta time (capped at ~16.6ms / 60fps).
2. Dispatch to the correct phase update (`updateRoleSelection`, `updateMissionSelection`, `updateDifficultySelection`, `updateNameEntry`, or `update`).
3. Call `this.render()`.
4. `this.inputSystem.clearFrameInput()`.

---

## 5. Game Flow & Phases

The player moves through these phases before actual gameplay:

| Phase | What happens | File |
|-------|--------------|------|
| `roleSelection` | Pick one of 3 ship classes (Explorer / Miner / Fighter) | `Game.updateRoleSelection` |
| `difficultySelection` | Pick Normal / Hard / Nightmare | `Game.updateDifficultySelection` |
| `missionSelection` | Pick Mining / Extermination / Colonial Expansion | `Game.updateMissionSelection` |
| `nameEntry` | **NEW:** Type a player name (max 12 chars, must be non-empty) before starting | `Game.updateNameEntry` |
| `playing` | The actual game runs | `Game.update` |

### Why `nameEntry` exists
Previously the game asked for a name **only after winning level 1**, via a broken modal that pre-filled "Anonymous" (truncated to "anonymo" by a `maxLength=7` bug) and fought the canvas for keyboard focus. Now:
- The player enters their name **before level 1 begins**.
- The name is stored on `GameState.playerName` and carried through the session.
- On **death (game over)** the score is auto-saved to the leaderboard with that name, and the leaderboard is shown immediately so the player sees their name.


---

## 6. The Systems Architecture (`src/systems/`)

The codebase uses an **ECS-lite** pattern: `Game.ts` owns a single `GameState` and ~26 systems each own one domain. Systems are mostly static classes with methods that read/write `GameState`.

Full list:

| System | Responsibility |
|--------|----------------|
| `AudioSystem` | Procedural sound generation (OscillatorNode). No audio assets. |
| `CameraSystem` | Viewport / camera tracking for the large world. |
| `CollisionSystem` | Physics / circle collision detection. |
| `EnemySystem` | AI enemy movement, spawning, damage, despawn. |
| `EnemyCombatSystem` | Enemy projectiles, firing, bomb vs monster logic. |
| `CosmicEggSystem` | Space monster spawning from eggs, spiral movement, burrowing, warnings, stuns. |
| `PlanetSystem` | Planet generation, HP, claiming, base building, regen. |
| `PlanetClaimAISystem` | Enemy AI for claiming/expanding on planets. |
| `BaseCombatSystem` | Projectile-vs-planet damage and base destruction. |
| `ShipSystem` | Player ship creation, movement, energy, hull, bombs, melee weapon. |
| `WeaponSystem` | Projectiles, bombs, melee lightning AoE. |
| `MiningSystem` | Projectile-vs-asteroid collisions, resource drop creation. |
| `ResourceSystem` | Resource collection mechanics. |
| `UpgradeSystem` | Ship and base upgrade purchases / state. |
| `BotSystem` | AI bot companions for defense and resource collection. |
| `ScoreSystem` | Score calculation from final stats. |
| `GameTimerSystem` | Mission timer, play time formatting. |
| `GameStateSystem` | Ship destruction check, victory condition checks, `endGame()`, `resetGame()`. |
| `RenderSystem` | All canvas drawing: entities, HUD, end screens, leaderboard, selection screens, name entry. |
| `UISystem` | UI state (menus, leaderboard toggle), in-canvas leaderboard rendering. |
| `InputSystem` | Keyboard state tracking, ship input mapping, leaderboard key (X), `getJustPressedKey()` for name entry. |
| `ParticleSystem` | Explosion, collection, and spark particles. |
| `WorldGenerator` | Procedural asteroid field + cosmic egg placement + planet placement. |
| `LeaderboardSystem` | localStorage leaderboard persistence: save/load/sort/top scores. |
| `GameTimerSystem` | Timer creation, stop, formatting. |

### How to add a new system
1. Create `src/systems/MySystem.ts` (export a class, usually with static methods).
2. Import it in `Game.ts`.
3. Instantiate it in the `Game` constructor (if it needs state) or call its static methods directly from `Game.update()` / `Game.render()`.
4. Wire it into `gameLoop` so it runs every frame.


---

## 7. Core Data Definitions (`src/data/`)

### `ShipRoles.ts` — 3 classes
| Role | Max Energy | Max Hull | Max Cargo Mats | Max Cargo Gems | Weapon Dmg | Fire Rate |
|------|-----------|----------|----------------|----------------|------------|-----------|
| Explorer | 100 | 100 | 30 | 20 | 1.0 | 0.15s |
| Miner | 120 | 80 | 50 | 30 | 0.8 | 0.2s |
| Fighter | 90 | 130 | 20 | 15 | 1.5 | 0.1s |

### `Missions.ts` — 3 victory conditions
- `allAsteroidsMined` — Destroy every asteroid
- `allEnemiesDefeated` — Destroy all enemies + space monsters
- `allPlanetsColonized` — Claim every planet

### `Difficulties.ts` — 3 levels
| Difficulty | Spawn Multiplier | Count Multiplier | Cosmic Egg Multiplier |
|------------|-----------------|------------------|----------------------|
| Normal | 1.0 | 1.0 | 1.0 |
| Hard | 0.6 (faster) | 1.5 | 1.5 |
| Nightmare | 0.4 (faster) | 2.0 | 2.0 |

---

## 8. Types (`src/types/GameTypes.ts`)

This is the single source of truth for TypeScript interfaces. Key ones:

- `Vector2D` — `{ x, y }`
- `Ship` — position, velocity, rotation, radius, energy, hull, cargo, weapons, bombs, invincibility, melee charging
- `Asteroid` — position, vertices (irregular shape), health, `dropsPowerGem`, `isCosmicEgg`, `monsterType` (spider/centipede/beetle)
- `Projectile` — position, velocity, damage, type (`normal`/`bomb`), homing support
- `ResourceDrop` — `rawMaterial` or `powerGem`, collected flag
- `Particle` — explosion / collection / spark types
- `Enemy` — AI states (`hunting`/`claiming`/`defending`/`expanding`), space monster fields (spiral, hatch, burst, stun)
- `Planet` — owner (`none`/`player`/`enemy`), HP, bases (0–5), planet bots
- `PlanetBot` — orbiting defense bots per base
- `WorldConfig` — asteroid counts/sizes, spawn rates, planet counts, balance variables (mining damage, enemy damage, etc.)
- `GameState` — the master state object (ship, asteroids, planets, projectiles, resourceDrops, enemies, particles, camera, lives, gameStatus, playerName, selectedMission, selectedRole, finalStats, etc.)
- `Mission`, `Difficulty`, `ShipRole`, `SpaceMonsterWarning`

> **Rule:** If you add a new game entity, add its interface here first. Systems import types from this file.


---

## 9. The Game Loop in Detail (`Game.update`)

When `gamePhase === 'playing'` and `gameStatus === 'playing'`, `update(deltaTime)` runs each frame:

1. **Input** — Read ship input (WASD/arrows = move/thrust/reverse, B = bomb, N = buy bomb, K = lightning melee, etc.).
2. **Enemy spawning** — `EnemySystem.shouldSpawnEnemy` triggers waves.
3. **Enemy update** — `EnemySystem.updateEnemies` + `CosmicEggSystem.updateSpaceMonsters` (spiral movement).
4. **Player weapon firing** — `WeaponSystem.createProjectile` / `createBomb` / `createMeleeLightning`.
5. **Projectile updates** — Movement, bomb homing, removal of inactive projectiles.
6. **Collisions** — projectile vs asteroid (mining), projectile vs planet, projectile vs enemy.
7. **Asteroid destruction** — Drops resources; if it was a cosmic egg, spawn space monsters + warnings.
8. **Planet damage** — Bases can be destroyed, unclaiming the planet.
9. **Enemy destruction** — Drops resources, tracks kills (space monster vs regular).
10. **Resource collection** — Ship runs over drops.
11. **Planet interactions** — Claiming and base expansion (costs materials).
12. **Enemy AI** — `PlanetClaimAISystem` makes enemies claim/expand on planets.
13. **UI menus** — Upgrade menu (U), Bot menu (P), navigation with arrow keys/TAB/ENTER.
14. **Boundary check** — Ship leaving world bounds disables weapons.
15. **Game end checks** — `GameStateSystem.checkShipDestruction` and `checkGameEndConditions`.

When `gameStatus !== 'playing'` (game over or victory), input is limited to R (restart), Q (quit to title), M (minimap), X (toggle leaderboard). On victory, N advances to next level.

---

## 10. Leaderboard System

### `src/systems/LeaderboardSystem.ts`
- Persists scores to **localStorage** under key `space-mining-leaderboard`.
- `saveScore(entry)` — pushes entry, sorts by score descending, keeps top 100 (`MAX_ENTRIES`).
- `saveGameStateToLeaderboard(gameState)` — builds a `LeaderboardEntry` from `finalStats` + `playerName` and saves it.
- `getLeaderboard()` / `getTopScores(limit)` / `getPlayerRank(score)` / `getScoreStats()` — read helpers.
- `saveToAPI` / `loadFromAPI` — TODO stubs for a future backend.

### `api/leaderboard.ts`
- Vercel serverless function stub (`GET` returns empty array, `POST` returns success without persisting).
- Intended to be wired to a real database (Vercel KV, PlanetScale, Supabase, etc.) for production.

### Flow after your changes
1. Player enters name in `nameEntry` phase → stored on `GameState.playerName`.
2. On **any** game end (victory or game over), `GameStateSystem.endGame` calls `LeaderboardSystem.saveGameStateToLeaderboard`, which saves automatically using that name (no modal, no top-10 gate).
3. On `gameOver`, `Game.render` calls `UISystem.showLeaderboard()` + `renderLeaderboard`, so the player immediately sees their name on the board.

---

## 11. Controls (keyboard-only)

| Key | Action |
|-----|--------|
| WASD / Arrows | Move (S/Down = reverse) |
| Space | Fire weapon |
| B | Launch bomb |
| N | Buy bomb (10 materials) |
| M | Toggle minimap |
| K | Emergency lightning weapon (10 gems) |
| U | Upgrades menu |
| P | Bot menu |
| Q | Quit to title |
| R | Restart current round |
| X | View leaderboard |
| Esc | Back / cancel |
| Enter | Confirm (menus / name entry) |


---

## 12. How to Run & Deploy

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (hot reload)
npm run dev
# Open http://localhost:5173

# 3. Build for production
npm run build   # runs tsc then vite build -> dist/

# 4. Preview production build locally
npm run preview

# 5. Deploy to Vercel
vercel
```

The frontend compiles to static files (HTML/CSS/JS). The leaderboard API is a single Vercel serverless function (`api/leaderboard.ts`).

---

## 13. Git & Conventions

- **Branch:** `main` is the default. Commit directly or via PR depending on team policy.
- **Commit style:** Recent history uses tags like `v1.2.0: Critical gameplay fixes`. Try to keep commits descriptive.
- **No tests exist.** When you change gameplay logic, manually play through:
  - Starting a new game (all 3 roles × all 3 missions)
  - Dying (game over → leaderboard shows your name)
  - Winning (victory → next level / leaderboard)
  - All 3 difficulty levels
- **TypeScript is strict.** Run `npm run build` and fix type errors before considering a change done. (Note: there is one pre-existing unused-variable warning in `AudioSystem.ts:55` that is unrelated to your work.)

---

## 14. Common Tasks / "How do I…"

### Add a new ship role
1. Add the role object to `src/data/ShipRoles.ts` (follow the `ShipRole` interface).
2. The role selection UI in `RenderSystem.renderRoleSelection` iterates `SHIP_ROLES`, so it appears automatically.

### Add a new mission type
1. Add to `src/data/Missions.ts` with a `victoryCondition`.
2. If the victory condition is new, add a `case` to `GameStateSystem.checkGameEndConditions`.
3. It appears in mission selection automatically.

### Add a new enemy type
1. Add a new `enemyType` string to the `Enemy` interface if needed.
2. Handle it in `EnemySystem.createEnemy` and `EnemySystem.updateEnemies`.
3. Add rendering in `RenderSystem.renderEnemies`.

### Change game balance
- Asteroid counts/sizes, enemy HP/spawn rates, planet counts: `WorldConfig` in `Game.createInitialGameState` or `src/data/Difficulties.ts`.
- Mining damage, enemy damage, collision multiplier: `WorldConfig` balance fields.
- Score formula: `LeaderboardSystem.saveGameStateToLeaderboard` (asteroids×10 + enemies×15 + planets×50).

### Change the name-entry flow
- Max name length: `Game.updateNameEntry` checks `this.playerName.length < 12`.
- Rendering: `RenderSystem.renderNameEntry`.
- The name is saved automatically on game end via `LeaderboardSystem.saveGameStateToLeaderboard`.

---

## 15. Known Issues & Technical Debt

1. **No test suite.** All verification is manual via `npm run dev`.
2. **Leaderboard API is a stub.** `api/leaderboard.ts` does not persist to a real database yet. localStorage is used client-side.
3. **Audio is procedural** (`AudioSystem` uses `OscillatorNode`). There is one pre-existing TS error: `AudioSystem.ts:55` — `oscillator` declared but never read. It does not block runtime, but `tsc` will fail until addressed.
4. **`Game.ts` is a "God class."** It is large (~1,400 lines). When adding features, prefer pushing logic into a dedicated system rather than stuffing more into `Game`.
5. **Canvas is fixed at 1024×768.** No responsive resizing logic.

---

## 16. First-Day Checklist

- [ ] Run `npm install && npm run dev` and confirm the game launches.
- [ ] Play through a full game: pick role → difficulty → mission → **enter your name** → play → die → confirm leaderboard shows your name.
- [ ] Win a game and confirm the next-level flow works.
- [ ] Run `npm run build` and confirm it type-checks (ignore the pre-existing `AudioSystem.ts` warning).
- [ ] Read `src/Game.ts` and `src/types/GameTypes.ts` end-to-end.
- [ ] Pick one small bug or feature and try implementing it using the system pattern above.

---

## 17. Questions?

If something isn't clear, look at the most recently changed files first — they're usually the best guide to current intent:

```
git log --oneline -10
git diff HEAD~1 --stat
```

Good luck, and have fun mining the cosmos! 🚀

