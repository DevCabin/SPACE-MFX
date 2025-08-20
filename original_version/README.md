# Space Mining Game - Complete Technical Documentation

## Overview
A 2D space mining and planetary conquest game built with TypeScript and HTML5 Canvas. Players select a ship role, choose a mission objective, mine asteroids for resources, claim and defend planets, purchase upgrades and bots, and engage in strategic combat against AI enemies and terrifying space monsters.

## Current Game Features

### 🚀 **Core Gameplay**
- **Role Selection**: Choose from 3 distinct ship classes with unique stats
- **Mission Selection**: Pick your objective from 3 different victory conditions
- **Resource Mining**: Destroy asteroids to collect materials and power gems
- **Planetary Conquest**: Claim planets and build bases for territorial control
- **Combat System**: Defend against AI enemies with weapons and heat-seeking bombs
- **Space Monster Encounters**: Face terrifying boss-level creatures from cosmic eggs
- **Upgrade System**: Enhance ship capabilities and planetary defenses
- **Bot Companions**: Purchase AI helpers for defense and resource collection
- **Ship Level System**: Visual progression indicator showing upgrade achievements
- **Emergency Lightning Weapon**: Devastating area-of-effect melee weapon with spectacular visual effects

### 🎯 **Mission System**

#### **Game Flow:**
1. **Select Ship Role** → Choose your preferred playstyle
2. **Select Mission** → Pick your victory objective
3. **Play with Purpose** → Work toward clear, focused goals

#### **Three Mission Types:**

##### 🔨 **Mining Operation**
- **Objective**: Extract all valuable resources from the asteroid field
- **Victory Condition**: Destroy every asteroid in the sector
- **Strategy**: Focus on efficient resource collection and cargo management
- **Best Ship**: Miner (high cargo capacity and energy efficiency)
- **Playstyle**: Methodical, resource-focused gameplay

##### ⚔️ **Extermination Protocol**
- **Objective**: Eliminate all hostile threats in the sector
- **Victory Condition**: Destroy all space monsters AND regular enemies
- **Strategy**: Combat-focused with emphasis on weapon upgrades and tactical positioning
- **Best Ship**: Fighter (high damage and strong hull)
- **Playstyle**: Action-packed combat encounters

##### 🌍 **Colonial Expansion**
- **Objective**: Establish dominance over the sector
- **Victory Condition**: Control all planetary bodies (100% colonization)
- **Strategy**: Balanced approach with base building and territorial defense
- **Best Ship**: Explorer (versatile stats for varied challenges)
- **Playstyle**: Strategic expansion and resource management

### 🛸 **Ship Classes (Choose Your Role)**

#### **Explorer** (Balanced)
- Energy: 100 | Recharge: 15/sec | Hull: 100
- Cargo: 30 Materials + 20 Gems | Damage: 1.0x | Fire Rate: 0.15s
- *Best for: Colonial Expansion missions and versatile gameplay*

#### **Miner** (Resource Specialist)
- Energy: 120 | Recharge: 20/sec | Hull: 80
- Cargo: 50 Materials + 30 Gems | Damage: 0.8x | Fire Rate: 0.2s
- *Best for: Mining Operation missions and resource collection*

#### **Fighter** (Combat Specialist)
- Energy: 90 | Recharge: 12/sec | Hull: 130
- Cargo: 20 Materials + 15 Gems | Damage: 1.5x | Fire Rate: 0.1s
- *Best for: Extermination Protocol missions and combat*

### ⚡ **Emergency Lightning Weapon System (NEW!)**

#### **Devastating Area-of-Effect Weapon**
- **Activation**: Press K key (costs 10 Power Gems)
- **Effect**: Instantly destroys ALL enemies within 400-unit radius
- **Damage**: 25 damage to all targets (enough to kill most enemies)
- **Invincibility**: 1.5 seconds of complete invulnerability during charging
- **Cooldown**: Single use per gem cost (no cooldown timer)

#### **Spectacular Visual Effects**
- **Electric Rings**: 3 expanding cyan energy rings pulse outward from ship
- **Lightning Arcs**: 8 jagged lightning bolts radiate from ship center
- **Dynamic Animation**: Rings expand and fade, arcs pulse and change length
- **Warning Triangle**: Electric blue triangle in bottom-right corner during charging
- **Lightning Particles**: Dramatic spark effects when weapon discharges

#### **Strategic Usage**
- **Emergency Escape**: Perfect for overwhelming enemy situations
- **Space Monster Counter**: Effective against tough boss creatures
- **Resource Investment**: Requires careful gem management
- **Invincibility Window**: Use timing to avoid damage during activation

### 🏆 **Ship Level System**

#### **Visual Progression Indicator**
- **Ship Emblem**: Prominent circular badge at top of screen
- **Level Calculation**: Every 3 upgrades = 1 ship level
- **Color Progression**: Gray → Green → Blue → Gold → Purple
- **Rank Titles**: Recruit → Pilot → Lieutenant → Captain → Fleet Admiral

#### **Level Benefits**
- **Visual Recognition**: Show off your upgrade achievements
- **Progress Tracking**: Clear indication of advancement
- **Next Level Preview**: Motivation to continue upgrading
- **Master Level**: Special purple badge for level 10+

### 💎 **Resource System**

#### **Raw Materials (Blue)**
- **Primary Use**: Hull repair (10 HP per material)
- **Secondary Use**: Cargo storage when hull is full
- **Sources**: All destroyed asteroids (2-8 per asteroid)
- **Uses**: Ship upgrades, base construction (20 per base), bot purchases

#### **Power Gems (Orange)**
- **Primary Use**: Energy refill when below 50%
- **Secondary Use**: Cargo storage when energy is high
- **Special Use**: Emergency Lightning Weapon (10 gems per use)
- **Sources**: 25% of asteroids drop gems
- **Uses**: Advanced upgrades, bot purchases, lightning weapon

#### **Resource Attraction System**
- **Auto-Collection**: Resources are pulled toward ship within 80-unit radius
- **Smart Physics**: Stronger attraction when closer
- **Smooth Movement**: Resources accelerate naturally toward player

### 🏗️ **Planetary System**

#### **Planet Types & Ownership**
- **Unclaimed Planets** (Gray): Available for colonization
- **Player Planets** (Green): Generate passive resources
- **Enemy Planets** (Red): AI-controlled bases

#### **Base Building**
- **Claiming Cost**: 20 Materials per planet
- **Base Expansion**: 20 Materials per additional base (max 5 per planet)
- **Passive Generation**: 0.5 Materials/second per base
- **Defense Bots**: Planets automatically spawn defense bots (3 per base)

#### **Planet Combat**
- **Base HP System**: 100 base HP + 25 HP per base
- **Regeneration**: 5 HP/second for owned planets
- **Bomb Effectiveness**: Bombs deal 30 damage vs 1 for normal projectiles

### 🐛 **Space Monster System (BOSS ENCOUNTERS)**

#### **Cosmic Eggs**
- **Hidden Threats**: 3-6 asteroids contain space monsters
- **Crack to Release**: Destroying these asteroids unleashes boss creatures
- **Warning System**: Persistent triangle warning while monsters are alive
- **Monster Types**: Spider, Centipede, Beetle variants

#### **Space Monster Behavior**
- **Hatching Sequence**: 2 seconds dormant → 1 second awakening → active hunting
- **Spiral Movement**: Complex orbital patterns around player
- **Burst Movement**: Alternates between slow drift and fast attack bursts
- **Grace Period**: 3 seconds of harmless collision after hatching

#### **Boss Combat Mechanics**
- **High Health**: 50 HP each (true boss encounters)
- **Bomb Resistance**: Bombs stun for 3 seconds + deal 5 damage (no instant kills)
- **Stun Effects**: Monsters flash yellow and stop moving when stunned
- **Lightning Vulnerability**: Emergency Lightning Weapon instantly destroys them
- **Massive Rewards**: Drop enough resources to fill any ship's cargo completely

### ⚔️ **Combat System**

#### **Player Weapons**
- **Primary Fire**: Energy-based projectiles (10 energy per shot)
- **Heat-Seeking Bombs**: Smart missiles that track nearest enemy
- **Emergency Lightning**: Area-of-effect weapon that destroys all nearby enemies
- **Bomb Inventory**: Start with 3, max 10, purchase for 10 Materials each
- **Damage Scaling**: Based on selected ship role

#### **Enemy AI Behavior**
- **Hunting**: Default behavior - pursue and attack player
- **Planet Claiming**: AI attempts to claim unclaimed planets
- **Base Defense**: Protect owned planets from player attacks
- **Base Expansion**: Add more bases to owned planets

#### **Enemy Spawn System**
- **First Attack**: Single scout at 5 seconds (tutorial encounter)
- **Subsequent Waves**: 1-5 enemies every 8-120 seconds
- **Escalation**: More frequent attacks as game progresses
- **Despawn**: Enemies disappear if too far from player or after 10 minutes

### 🔧 **Upgrade System**

#### **Ship Upgrades**
- **Energy Capacity**: +20 per level (max 10 levels)
- **Energy Recharge**: +3/sec per level
- **Hull Strength**: +25 per level
- **Cargo Capacity**: +10 total per level
- **Weapon Damage**: +0.2 per level
- **Fire Rate**: -0.02s per level (faster firing)

#### **Base Upgrades**
- **Base HP Bonus**: +15 HP per level for all player planets
- **Base Regen Bonus**: +2 HP/sec per level for all player planets

#### **Upgrade Costs**
- **Scaling Cost**: Each level costs 1.5x more than previous
- **Material + Gem Requirements**: Both resources needed for upgrades
- **Max Level**: 10 levels per upgrade type

### 🤖 **Bot Companion System**

#### **Bot Types**
- **Defense Bots**: Orbit player, auto-fire at enemies, collect resources
- **Purchase Cost**: 15 Materials + 2 Power Gems (affordable!)
- **Maximum Bots**: 3 active bots
- **Unlock Requirement**: Collect 25 total cargo to unlock bot purchases

#### **Bot Capabilities**
- **Auto-Combat**: Fire at enemies within 180-unit range
- **Resource Collection**: Pick up resources within 50-unit range
- **Formation Flying**: Orbit around player at staggered distances (no overlap!)
- **Energy Efficiency**: Only consume energy when firing (5 per shot)

#### **Bot Formation**
- **Staggered Orbits**: Each bot orbits at different distance (60, 75, 90 units)
- **Visual Separation**: All 3 bots clearly visible and distinct
- **Defensive Pattern**: Provides 360-degree coverage around player

### 🎮 **Controls & Interface**

#### **Movement Controls**
- **WASD** or **Arrow Keys**: Thrust and rotation
- **Mouse Movement**: Cursor tracking (visual only)

#### **Combat Controls**
- **Spacebar** or **Left Click**: Fire primary weapons
- **B**: Launch heat-seeking bomb
- **N**: Purchase bomb (10 Materials)
- **K**: Emergency Lightning Weapon (10 Power Gems)

#### **Interface Controls**
- **M**: Toggle mini-map
- **U**: Open/close upgrade menu (pauses game)
- **P**: Open/close bot menu (pauses game)
- **UP/DOWN Arrows** or **WASD**: Navigate menu options
- **TAB**: Alternative menu navigation
- **ENTER**: Confirm purchases/selections
- **ESC**: Close menus or go back in selection screens
- **R**: Restart game
- **Q**: Quit game (with confirmation)

#### **Enhanced Menu System**
- **Improved Contrast**: Dark gray background with 95% opacity
- **Clean Design**: Streamlined interface without clutter
- **Multiple Navigation**: Arrow keys, WASD, and TAB all work
- **Pause Functionality**: Game pauses when menus are open

### 📊 **User Interface Elements**

#### **HUD Display**
- **Energy Bar**: Current/max energy with recharge indicator
- **Hull Bar**: Current/max hull with damage visualization
- **Lives Counter**: Remaining respawns (starts with 3)
- **Total Cargo Display**: Combined materials and gems with capacity limits
- **Material Breakdown**: Shows materials specifically (needed for bases)
- **Gem Breakdown**: Shows power gems separately
- **Bomb Inventory**: Current/max bombs available
- **Ship Level Badge**: Prominent upgrade achievement indicator
- **Mission Objective**: Current mission name and goal displayed

#### **Mini-Map (Toggle with M)**
- **World Overview**: Shows entire game area
- **Player Position**: Green triangle with rotation indicator
- **Asteroids**: Gray dots
- **Planets**: Colored circles (gray/green/red by ownership)
- **Enemies**: Red dots
- **Resources**: Blue/orange dots for materials/gems
- **Space Monsters**: Larger red dots for boss creatures

#### **Planet Information**
- **HP Bars**: Show current/max HP for owned planets
- **Base Count**: Number of bases per planet
- **Ownership Colors**: Visual indication of control
- **Damage Effects**: Cracks appear on damaged planets
- **Defense Bot Count**: Shows active planet defense bots

#### **Space Monster Warnings**
- **Persistent Alert**: Warning triangle stays visible while monsters are alive
- **Shake Effect**: Intense visual feedback when monsters are detected
- **Clear Messaging**: "SPACE MONSTER DETECTED" text
- **Strategic Information**: Helps plan escape routes and combat strategies

#### **Lightning Weapon Warnings**
- **Electric Blue Triangle**: Shows in bottom-right corner during charging
- **Lightning Bolt Icon**: Clear weapon identification
- **Charging Text**: "LIGHTNING CHARGING" message
- **Extended Duration**: Warning lasts longer than weapon charge time

### 🌍 **World Generation**

#### **Asteroid Field**
- **Count**: 35 asteroids per world
- **Size Range**: 15-40 radius with irregular polygon shapes
- **Health System**: 3-6 hits to destroy (size-based)
- **Spacing**: Minimum 80-unit separation
- **Resource Drops**: 2-8 materials + 25% chance for power gem
- **Cosmic Eggs**: 3-6 random asteroids contain space monsters

#### **Planet Generation**
- **Count**: 4 planets per sector
- **Size Range**: 60-100 radius
- **Strategic Placement**: Minimum 200-unit spacing from asteroids/planets
- **Claim Radius**: 60% of visual radius for interaction

#### **World Boundaries**
- **Dimensions**: 2000x2000 units
- **Projectile Limits**: Weapons despawn at world edges
- **Enemy Despawn**: Enemies removed if too far from action

### 🎯 **Game Balance & Difficulty**

#### **Resource Economy**
- **Material Generation**: 0.5 per second per planetary base
- **Energy Management**: Balance between movement, combat, and recharge
- **Cargo Limits**: Force strategic decisions about resource allocation
- **Affordable Bots**: Reduced gem cost makes bots accessible
- **Lightning Weapon Cost**: 10 gems for devastating area attack

#### **Combat Balance**
- **Player Advantages**: Upgrades, bombs, bot assistance, planet defenses, lightning weapon
- **Enemy Threats**: Numbers, persistence, planet claiming
- **Space Monster Challenge**: 50 HP boss encounters requiring sustained combat
- **Collision Damage**: Ship-enemy collisions drain 1/3 energy
- **Emergency Options**: Lightning weapon provides escape from overwhelming situations

#### **Mission-Specific Balance**
- **Mining**: Focuses on efficiency and resource management
- **Combat**: Emphasizes weapon upgrades and tactical positioning
- **Exploration**: Requires balanced approach to multiple systems

#### **Progression System**
- **Early Game**: Focus on asteroid mining and first planet claims
- **Mid Game**: Upgrade ship capabilities and purchase bots
- **Late Game**: Mission-specific endgame strategies
- **Visual Rewards**: Ship level progression provides satisfaction

### 🔊 **Audio System**
- **Procedural Audio**: Web Audio API for dynamic sound generation
- **Sound Effects**: Mining hits, resource collection, explosions, weapon fire
- **Space Monster Alerts**: Special warning sounds for boss encounters
- **Audio Feedback**: Clear indication of game events

### 🎨 **Visual Effects**

#### **Particle Systems**
- **Explosion Effects**: Asteroid destruction, enemy defeats, cosmic egg cracking
- **Collection Effects**: Resource pickup feedback
- **Spark Effects**: Weapon impacts and collisions
- **Lightning Effects**: Dramatic electrical discharge particles
- **Damage Visualization**: Planet cracks, hull damage indicators

#### **Space Monster Visual Design**
- **Unique Sprites**: Spider, Centipede, and Beetle designs
- **State Indicators**: Different colors for dormant/awakening/active/stunned states
- **Flashing Effects**: Visual feedback for different monster states
- **Size Scaling**: Larger than regular enemies to emphasize boss status

#### **Lightning Weapon Effects**
- **Electric Rings**: 3 expanding cyan rings that pulse outward
- **Lightning Arcs**: 8 jagged lightning bolts radiating from ship
- **Dynamic Animation**: Rings expand and fade, arcs pulse and flicker
- **Realistic Lightning**: Jagged, random lightning patterns with proper physics

#### **Rendering Features**
- **Smooth Camera**: Follows player with interpolation
- **Health Visualization**: Color-coded damage states
- **Formation Display**: Bot orbital patterns with proper spacing
- **Weapon Trails**: Visual projectile tracking
- **Ship Level Badge**: Prominent achievement display
- **Mission Display**: Clear objective tracking in HUD

## Technical Architecture

### Core Systems

#### **Game.ts - Main Controller**
- Central game loop and state management
- Phase handling (role selection → mission selection → gameplay)
- Input processing and menu management
- Victory/defeat condition checking based on selected mission

#### **Modular System Design**
- **AudioSystem**: Procedural sound generation
- **CameraSystem**: Smooth following and coordinate conversion
- **CollisionSystem**: Physics-based collision detection and resolution
- **CosmicEggSystem**: Space monster spawning, behavior, and combat mechanics
- **EnemySystem**: AI behavior, spawning, and combat
- **GameStateSystem**: Mission-specific victory condition checking
- **InputSystem**: Keyboard/mouse handling with frame-based state
- **MiningSystem**: Asteroid destruction and resource generation
- **ParticleSystem**: Visual effects and particle lifecycle
- **PlanetSystem**: Territorial control and base management
- **RenderSystem**: Canvas rendering, UI display, and mission selection screens
- **ResourceSystem**: Collection mechanics and attraction physics
- **ShipSystem**: Player movement, energy, and weapon systems
- **UpgradeSystem**: Progression and enhancement mechanics
- **WeaponSystem**: Projectile physics and combat mechanics
- **WorldGenerator**: Procedural world creation with cosmic egg placement
- **BotSystem**: AI companion management and behavior
- **UISystem**: Menu rendering and navigation

### Performance Features
- **Object Pooling**: Efficient projectile and particle management
- **Frustum Culling**: Only render visible objects
- **Delta Time Physics**: Frame rate independent movement
- **Efficient Collision Detection**: Spatial optimization

### Code Organization
```
src/
├── Game.ts                 # Main game controller with mission system
├── main.ts                 # Entry point and DOM setup
├── style.css              # Game styling
├── data/
│   ├── ShipRoles.ts       # Ship class definitions
│   └── Missions.ts        # Mission definitions and victory conditions
├── systems/               # Modular game systems
│   ├── CosmicEggSystem.ts # Space monster mechanics
│   ├── GameStateSystem.ts # Mission victory checking
│   └── ...                # Other game systems
├── types/
│   └── GameTypes.ts       # TypeScript interfaces including Mission types
└── utils/
    └── MathUtils.ts       # Mathematical utilities
```

## Development Status

### Current Version Features
- ✅ Complete role selection system
- ✅ Mission selection system with three distinct objectives
- ✅ Full resource mining and collection
- ✅ Planetary conquest mechanics
- ✅ Space monster boss encounters with cosmic eggs
- ✅ Bomb stun mechanics for strategic combat
- ✅ Persistent space monster warning system
- ✅ Comprehensive upgrade system
- ✅ Bot companion system with proper spacing
- ✅ Advanced enemy AI with planet claiming
- ✅ Heat-seeking bomb weapons
- ✅ Enhanced menu system with improved contrast
- ✅ Resource attraction mechanics
- ✅ Ship level progression system
- ✅ Complete audio and visual effects
- ✅ Mission-specific victory conditions
- ✅ Emergency Lightning Weapon with spectacular visual effects
- ✅ Quit game functionality with confirmation
- ✅ Enhanced visual feedback systems

### Recent Major Updates
- **Emergency Lightning Weapon**: Devastating area-of-effect weapon with 10 gem cost
- **Spectacular Visual Effects**: Electric rings, lightning arcs, and dynamic animations
- **Enhanced UI Feedback**: Lightning warning triangle with extended duration
- **Quit Game System**: Safe exit with confirmation dialog
- **Key Binding Optimization**: Separated minimap (M) and lightning weapon (K) controls
- **Combat Balance**: New strategic options for overwhelming enemy encounters

### Game Balance
- **Tested Mechanics**: All core systems functional across all mission types
- **Resource Economy**: Balanced progression curve with mission-specific strategies
- **Combat System**: Engaging boss encounters with tactical depth and emergency options
- **Victory Conditions**: Clear, achievable goals for each mission type
- **Visual Rewards**: Satisfying progression feedback throughout gameplay
- **Strategic Depth**: Multiple weapon systems provide varied tactical approaches

This represents a complete, polished space mining and conquest game with three distinct gameplay paths, terrifying boss encounters, deep strategic elements, spectacular visual effects, smooth gameplay mechanics, excellent visual feedback, and a rewarding progression system that keeps players engaged from Recruit to Fleet Admiral across multiple mission types with devastating new weapon systems.

## 🎮 **RESTORE POINT - v2.1.0 "Lightning Strike"**

**Date**: Current Build  
**Status**: Fully Functional  
**Key Features**: Complete game with Emergency Lightning Weapon system, enhanced visual effects, quit functionality, and polished UI feedback systems.

**Major Systems Working**:
- ✅ Role & Mission Selection
- ✅ Resource Mining & Collection  
- ✅ Planetary Conquest
- ✅ Space Monster Boss Battles
- ✅ Upgrade & Bot Systems
- ✅ Emergency Lightning Weapon
- ✅ Spectacular Visual Effects
- ✅ Complete UI/UX Polish
- ✅ Quit Game with Confirmation

**Performance**: Optimized and stable  
**Balance**: Well-tuned across all mission types  
**Visual Polish**: Professional-grade effects and feedback