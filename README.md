# SPACE-MFX: Space Mining Strategy Game

## Overview
SPACE-MFX is an immersive browser-based space strategy game where players explore, mine, and battle across a dynamic cosmic environment. Manage resources, upgrade your ship, and complete challenging missions in this action-packed space adventure.

## 🚀 Game Features
- **Role Selection**: Choose from 3 distinct ship classes with unique stats
- **Mission Selection**: Pick your objective from 3 different victory conditions
- **Resource Mining**: Destroy asteroids to collect materials and power gems
- **Planetary Conquest**: Claim planets and build bases for territorial control
- **Combat System**: Defend against AI enemies with weapons and bombs
- **Space Monster Encounters**: Face terrifying boss-level creatures from cosmic eggs
- **Upgrade System**: Enhance ship capabilities and planetary defenses
- **Bot Companions**: Purchase AI helpers for defense and resource collection
- **Emergency Lightning Weapon**: Devastating area-of-effect melee weapon with spectacular visual effects

## 🛠️ Tech Stack
- **Frontend**: TypeScript, Vite
- **Rendering**: HTML5 Canvas
- **Deployment**: Vercel
- **API**: Vercel Serverless Functions

## 🚀 Deployment
This game is perfectly suited for Vercel deployment:

1. **Static Frontend**: The main game compiles to static files (HTML, CSS, JS)
2. **Serverless API**: Uses Vercel's serverless functions for the leaderboard
3. **No Server Requirements**: Doesn't need a persistent server or complex backend

### Deployment Steps
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Deploy to Vercel
vercel
```

## 🎮 Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 📁 Project Structure
```
src/
├── Game.ts                 # Main game controller
├── main.ts                 # Entry point
├── style.css               # Game styling
├── data/                   # Game data definitions
├── systems/                # Modular game systems
├── types/                  # TypeScript interfaces
└── utils/                  # Utility functions
```

## 🔧 Game Systems
- **AudioSystem**: Sound generation
- **CameraSystem**: View management
- **CollisionSystem**: Physics detection
- **EnemySystem**: AI behavior
- **GameStateSystem**: Mission tracking
- **PlanetSystem**: Territory control
- **RenderSystem**: Graphics rendering
- **ResourceSystem**: Collection mechanics
- **ShipSystem**: Player movement
- **UpgradeSystem**: Progression mechanics
- **WeaponSystem**: Combat mechanics
- **WorldGenerator**: Procedural generation

## 📊 Leaderboard API
The game includes a serverless API endpoint for leaderboard functionality, compatible with Vercel deployment:

- **API Endpoint**: `/api/leaderboard.ts`
- **Functionality**: Save and retrieve player scores
- **Implementation**: Uses Vercel's serverless functions

## 📝 License
MIT
