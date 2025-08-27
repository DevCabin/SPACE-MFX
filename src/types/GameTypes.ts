export interface Vector2D {
  x: number;
  y: number;
}

export interface Ship {
  position: Vector2D;
  velocity: Vector2D;
  rotation: number;
  radius: number;
  energy: number;
  maxEnergy: number;
  energyRechargeRate: number;
  hullStrength: number;
  maxHullStrength: number;
  cargoMaterials: number;
  cargoGems: number;
  maxCargoMaterials: number;
  maxCargoGems: number;
  weaponDamage: number;
  weaponFireRate: number;
  lastFireTime: number;
  bombs: number;
  maxBombs: number;
  isInvincible: boolean;
  invincibilityEndTime: number;
  meleeCharging: boolean;
  meleeChargeStartTime: number;
  meleeWarningEndTime: number;
  isOutOfBounds: boolean;
  totalCargoCollected: number; // Track total cargo collected over time
}

export interface Asteroid {
  id: string;
  position: Vector2D;
  radius: number;
  vertices: Vector2D[];
  health: number;
  maxHealth: number;
  dropsPowerGem: boolean;
  isCosmicEgg: boolean;
  monsterType?: 'spider' | 'centipede' | 'beetle';
  lastPulseTime?: number;
  pulsePhase?: number;
}

export interface Projectile {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  radius: number;
  active: boolean;
  damage: number;
  type?: 'normal' | 'bomb';
  targetId?: string;
  seekingSpeed?: number;
}

export interface ResourceDrop {
  id: string;
  position: Vector2D;
  type: 'rawMaterial' | 'powerGem';
  radius: number;
  collected: boolean;
  velocity: Vector2D;
}

export interface Particle {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: 'explosion' | 'collection' | 'spark';
}

export interface Enemy {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  rotation: number;
  radius: number;
  health: number;
  maxHealth: number;
  lastFireTime: number;
  active: boolean;
  spawnTime: number;
  aiState: 'hunting' | 'claiming' | 'defending' | 'expanding';
  targetPlanetId?: string;
  lastNearPlayerTime?: number; // Track when enemy was last near player
  enemyType?: 'normal' | 'advanced' | 'spider' | 'centipede' | 'beetle';
  // Space monster specific properties
  spiralAngle?: number; // Current spiral angle
  spiralRadius?: number; // Distance from player
  hatchState?: 'dormant' | 'awakening' | 'active'; // Hatching state
  hatchTime?: number; // Time since hatching started
  burstCooldown?: number; // Time until next burst
  burstDuration?: number; // How long current burst lasts
  graceEndTime?: number; // Time when grace period ends (no collision damage)
  stunEndTime?: number; // Time when stun effect ends
}

export interface WorldConfig {
  asteroidCount: number;
  asteroidSizeMin: number;
  asteroidSizeMax: number;
  minSpacing: number;
  worldWidth: number;
  worldHeight: number;
  asteroidHealth: number;
  powerGemDropRate: number;
  enemySpawnInterval: number; // seconds
  enemyHealth: number;
  enemyDespawnDistance: number; // Distance from player before despawn
  enemyDespawnTime: number; // Time enemy must be far away before despawn
  enemyLifetime: number; // seconds
  planetCount: number;
  planetSizeMin: number;
  planetSizeMax: number;
  planetMinSpacing: number;
  baseCost: number;
  maxBasesPerPlanet: number;
  cosmicEggMultiplier?: number; // Difficulty multiplier for cosmic eggs
  // Balance tweaking variables
  miningDamage: number;
  enemyDamage: number;
  collisionDamageMultiplier: number;
}

export interface GameState {
  ship: Ship;
  asteroids: Asteroid[];
  planets: Planet[];
  projectiles: Projectile[];
  resourceDrops: ResourceDrop[];
  enemies: Enemy[];
  particles: Particle[];
  worldConfig: WorldConfig;
  camera: Vector2D;
  lastEnemySpawn: number;
  lives: number;
  maxLives: number;
  gameStatus: 'playing' | 'gameOver' | 'victory' | 'leaderboard';
  gameEndReason: string;
  upgradeState: import('../systems/UpgradeSystem').UpgradeState;
  botState: import('../systems/BotSystem').BotState;
  spaceMonsterWarnings: SpaceMonsterWarning[];
  selectedMission: Mission | null;
  selectedRole: ShipRole | null;
  gameTimer: import('../systems/GameTimerSystem').GameTimer;
  currentLevel: number;
  finalStats: {
    totalMaterials: number;
    totalGems: number;
    asteroidsDestroyed: number;
    enemiesDestroyed: number;
    planetsOwned: number;
    spaceMonsterKills: number;
    basesBuilt: number;
    playTime: number;
  };
}

export interface SpaceMonsterWarning {
  id: string;
  startTime: number;
  duration: number;
  monsterId: string;
}

export interface Planet {
  id: string;
  position: Vector2D;
  radius: number;
  baseHP: number; // Base planet HP (100)
  currentHP: number;
  maxHP: number; // baseHP + (bases * 25)
  owner: 'none' | 'player' | 'enemy';
  bases: number; // Number of bases (0-5)
  lastRegenTime: number;
  regenRate: number; // HP per second
  claimRadius: number; // Radius for claiming (smaller than visual radius)
  materialsMined: number; // Track materials generated for bot spawning
  planetBots: PlanetBot[]; // Bots defending this planet
}

export interface PlanetBot {
  id: string;
  position: Vector2D;
  rotation: number;
  radius: number;
  orbitAngle: number;
  orbitRadius: number;
  baseIndex: number; // Which base this bot belongs to (0-4)
  botIndex: number; // Which bot slot for this base (0-2)
  lastFireTime: number;
  fireRate: number;
  range: number;
  active: boolean;
}
export interface ShipRole {
  id: string;
  name: string;
  description: string;
  stats: {
    maxEnergy: number;
    energyRechargeRate: number;
    maxHullStrength: number;
    maxCargoMaterials: number;
    maxCargoGems: number;
    weaponDamage: number;
    weaponFireRate: number; // seconds between shots
  };
}

export interface Mission {
  id: string;
  name: string;
  description: string;
  objective: string;
  victoryCondition: 'allAsteroidsMined' | 'allEnemiesDefeated' | 'allPlanetsColonized';
}

export interface Difficulty {
  id: string;
  name: string;
  description: string;
  enemySpawnMultiplier: number;
  enemyCountMultiplier: number;
  cosmicEggMultiplier: number;
}
