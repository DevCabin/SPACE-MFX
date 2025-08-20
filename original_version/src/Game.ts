import { GameState, WorldConfig } from './types/GameTypes';
import { WorldGenerator } from './systems/WorldGenerator';
import { ShipSystem, ShipInput } from './systems/ShipSystem';
import { CollisionSystem } from './systems/CollisionSystem';
import { CameraSystem } from './systems/CameraSystem';
import { RenderSystem } from './systems/RenderSystem';
import { InputSystem } from './systems/InputSystem';
import { WeaponSystem } from './systems/WeaponSystem';
import { MiningSystem } from './systems/MiningSystem';
import { ResourceSystem } from './systems/ResourceSystem';
import { EnemySystem } from './systems/EnemySystem';
import { EnemyCombatSystem } from './systems/EnemyCombatSystem';
import { GameStateSystem } from './systems/GameStateSystem';
import { AudioSystem } from './systems/AudioSystem';
import { ParticleSystem } from './systems/ParticleSystem';
import { PlanetSystem } from './systems/PlanetSystem';
import { BaseCombatSystem } from './systems/BaseCombatSystem';
import { PlanetClaimAISystem } from './systems/PlanetClaimAISystem';
import { UpgradeSystem, UpgradeState } from './systems/UpgradeSystem';
import { BotSystem, BotState } from './systems/BotSystem';
import { UISystem } from './systems/UISystem';
import { SHIP_ROLES } from './data/ShipRoles';
import { ShipRole, Mission } from './types/GameTypes';
import { MISSIONS } from './data/Missions';
import { DIFFICULTIES } from './data/Difficulties';
import { Difficulty } from './types/GameTypes';
import { CosmicEggSystem } from './systems/CosmicEggSystem';
import { MathUtils } from './utils/MathUtils';
import { GameTimerSystem } from './systems/GameTimerSystem';

export class Game {
  private gameState: GameState;
  private renderSystem: RenderSystem;
  private inputSystem: InputSystem;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private gamePhase: 'roleSelection' | 'missionSelection' | 'difficultySelection' | 'playing' = 'roleSelection';
  private selectedRoleIndex: number = 0;
  private selectedMissionIndex: number = 0;
  private selectedDifficultyIndex: number = 0;
  private selectedRole: ShipRole | null = null;
  private selectedDifficulty: Difficulty | null = null;
  private showQuitConfirmation: boolean = false;
  private failsafeActive: boolean = false;
  private failsafeSpawnCounter: number = 0;
  private currentLevel: number = 1;

  constructor(canvas: HTMLCanvasElement) {
    // Initialize systems first
    this.renderSystem = new RenderSystem(canvas);
    this.inputSystem = new InputSystem(canvas);
    
    // Initialize audio
    AudioSystem.initialize();

    // Initialize with placeholder game state
    this.gameState = this.createInitialGameState();
  }

  private createInitialGameState(): GameState {
    // Initialize world configuration
    const worldConfig: WorldConfig = {
      asteroidCount: 35,
      asteroidSizeMin: 15,
      asteroidSizeMax: 40,
      minSpacing: 80,
      worldWidth: 2000,
      worldHeight: 2000,
      asteroidHealth: 3,
      powerGemDropRate: 0.25, // 25% chance for power gems
      enemySpawnInterval: 8, // 8 seconds between spawns (increased frequency)
      enemyHealth: 3,
      enemyDespawnDistance: 1200, // Increased from 800 to 1200
      enemyDespawnTime: 120, // Must be away for 2 minutes before despawn consideration
      enemyLifetime: 900, // Increased to 15 minutes
      planetCount: 4, // 2-5 planets
      planetSizeMin: 60,
      planetSizeMax: 100,
      planetMinSpacing: 200,
      baseCost: 20,
      maxBasesPerPlanet: 5,
      // Balance variables
      miningDamage: 1,
      enemyDamage: 1,
      collisionDamageMultiplier: 0.1
    };

    // Generate asteroids first
    const asteroids = WorldGenerator.generateAsteroidField(worldConfig, 1.0); // Normal difficulty for initial state
    
    // Generate planets with spacing from asteroids
    const planets = PlanetSystem.generatePlanets(worldConfig, asteroids);

    // Initialize upgrade and bot states
    const upgradeState = UpgradeSystem.createInitialUpgradeState();
    const botState = BotSystem.createInitialBotState();
    
    // Initialize game timer
    const gameTimer = GameTimerSystem.createTimer();

    // Initialize game state
    return {
      ship: ShipSystem.createShip(), // Will be recreated with selected role
      asteroids,
      planets,
      projectiles: [],
      resourceDrops: [],
      enemies: [],
      particles: [],
      worldConfig,
      camera: { x: 0, y: 0 },
      lastEnemySpawn: 0,
      lives: 3,
      maxLives: 3,
      gameStatus: 'playing',
      gameEndReason: '',
      upgradeState,
      botState,
      spaceMonsterWarnings: [],
      selectedMission: null,
      selectedRole: null,
      gameTimer,
      currentLevel: this.currentLevel,
      finalStats: {
        totalMaterials: 0,
        totalGems: 0,
        asteroidsDestroyed: 0,
        enemiesDestroyed: 0,
        planetsOwned: 0,
        spaceMonsterKills: 0,
        basesBuilt: 0,
        playTime: 0
      }
    };
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  stop(): void {
    this.isRunning = false;
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.016); // Cap at 60fps
    this.lastTime = currentTime;

    if (this.gamePhase === 'roleSelection') {
      this.updateRoleSelection();
    } else if (this.gamePhase === 'missionSelection') {
      this.updateMissionSelection();
    } else if (this.gamePhase === 'difficultySelection') {
      this.updateDifficultySelection();
    } else {
      this.update(deltaTime);
    }
    
    this.render();

    // Clear frame-specific input after processing
    this.inputSystem.clearFrameInput();

    requestAnimationFrame(this.gameLoop);
  };

  private updateRoleSelection(): void {
    // Handle quit confirmation
    if (this.showQuitConfirmation) {
      this.handleQuitConfirmation();
      return;
    }
    
    // Handle quit key
    if (this.inputSystem.wasKeyJustPressed('KeyQ')) {
      this.showQuitConfirmation = true;
      return;
    }
    
    // Handle role selection input
    if (this.inputSystem.wasKeyJustPressed('ArrowUp') || this.inputSystem.wasKeyJustPressed('KeyW')) {
      this.selectedRoleIndex = Math.max(0, this.selectedRoleIndex - 1);
    }
    
    if (this.inputSystem.wasKeyJustPressed('ArrowDown') || this.inputSystem.wasKeyJustPressed('KeyS')) {
      this.selectedRoleIndex = Math.min(SHIP_ROLES.length - 1, this.selectedRoleIndex + 1);
    }
    
    if (this.inputSystem.wasKeyJustPressed('Enter') || this.inputSystem.wasKeyJustPressed('Space')) {
      this.selectedRole = SHIP_ROLES[this.selectedRoleIndex];
      this.gamePhase = 'difficultySelection';
      this.selectedDifficultyIndex = 0;
      console.log(`Selected role: ${this.selectedRole.name}. Now select difficulty...`);
    }
  }

  private updateDifficultySelection(): void {
    // Handle quit confirmation
    if (this.showQuitConfirmation) {
      this.handleQuitConfirmation();
      return;
    }
    
    // Handle quit key
    if (this.inputSystem.wasKeyJustPressed('KeyQ')) {
      this.showQuitConfirmation = true;
      return;
    }
    
    // Handle difficulty selection input
    if (this.inputSystem.wasKeyJustPressed('ArrowUp') || this.inputSystem.wasKeyJustPressed('KeyW')) {
      this.selectedDifficultyIndex = Math.max(0, this.selectedDifficultyIndex - 1);
    }
    
    if (this.inputSystem.wasKeyJustPressed('ArrowDown') || this.inputSystem.wasKeyJustPressed('KeyS')) {
      this.selectedDifficultyIndex = Math.min(DIFFICULTIES.length - 1, this.selectedDifficultyIndex + 1);
    }
    
    if (this.inputSystem.wasKeyJustPressed('Enter') || this.inputSystem.wasKeyJustPressed('Space')) {
      this.selectedDifficulty = DIFFICULTIES[this.selectedDifficultyIndex];
      this.gamePhase = 'missionSelection';
      this.selectedMissionIndex = 0;
      console.log(`Selected difficulty: ${this.selectedDifficulty.name}. Now select mission...`);
    }
    
    // Allow going back to role selection
    if (this.inputSystem.wasKeyJustPressed('Escape')) {
      this.gamePhase = 'roleSelection';
      console.log('Returned to role selection');
    }
  }

  private updateMissionSelection(): void {
    // Handle quit confirmation
    if (this.showQuitConfirmation) {
      this.handleQuitConfirmation();
      return;
    }
    
    // Handle quit key
    if (this.inputSystem.wasKeyJustPressed('KeyQ')) {
      this.showQuitConfirmation = true;
      return;
    }
    
    // Handle mission selection input
    if (this.inputSystem.wasKeyJustPressed('ArrowUp') || this.inputSystem.wasKeyJustPressed('KeyW')) {
      this.selectedMissionIndex = Math.max(0, this.selectedMissionIndex - 1);
    }
    
    if (this.inputSystem.wasKeyJustPressed('ArrowDown') || this.inputSystem.wasKeyJustPressed('KeyS')) {
      this.selectedMissionIndex = Math.min(MISSIONS.length - 1, this.selectedMissionIndex + 1);
    }
    
    if (this.inputSystem.wasKeyJustPressed('Enter') || this.inputSystem.wasKeyJustPressed('Space')) {
      this.selectMission(MISSIONS[this.selectedMissionIndex]);
    }
    
    // Allow going back to role selection
    if (this.inputSystem.wasKeyJustPressed('Escape')) {
      this.gamePhase = 'roleSelection';
      console.log('Returned to role selection');
    }
  }

  private selectMission(mission: Mission): void {
    this.gamePhase = 'playing';
    
    // Recreate game state with selected role and mission
    this.gameState = this.createInitialGameState();
    this.gameState.ship = ShipSystem.createShip(this.selectedRole!);
    this.gameState.selectedMission = mission;
    this.gameState.selectedRole = this.selectedRole;
    
    // Apply difficulty settings to world config
    if (this.selectedDifficulty) {
      this.gameState.worldConfig.enemySpawnInterval *= this.selectedDifficulty.enemySpawnMultiplier;
      this.gameState.worldConfig.cosmicEggMultiplier = this.selectedDifficulty.cosmicEggMultiplier;
      
      // Regenerate asteroids with difficulty multiplier for cosmic eggs
      this.gameState.asteroids = WorldGenerator.generateAsteroidField(
        this.gameState.worldConfig, 
        this.selectedDifficulty.cosmicEggMultiplier
      );
      
      // Regenerate planets with new asteroid positions
      this.gameState.planets = PlanetSystem.generatePlanets(this.gameState.worldConfig, this.gameState.asteroids);
      
      console.log(`Difficulty: ${this.selectedDifficulty.name}`);
      console.log(`Enemy spawn interval: ${this.gameState.worldConfig.enemySpawnInterval}s (${Math.round(this.selectedDifficulty.enemySpawnMultiplier * 100)}% of normal)`);
      console.log(`Cosmic egg multiplier: ${this.selectedDifficulty.cosmicEggMultiplier}x`);
    }
    
    // Start the game timer
    this.gameState.gameTimer = GameTimerSystem.createTimer();
    
    // Set first enemy attack for 5 seconds - single ship only
    this.gameState.worldConfig.enemySpawnInterval = 3; // Faster first attack
    this.gameState.lastEnemySpawn = performance.now() / 1000; // Start timing from now
    
    console.log(`Mission selected: ${mission.name}`);
    console.log(`Objective: ${mission.objective}`);
    console.log(`Generated ${this.gameState.asteroids.length} asteroids`);
  }

  private update(deltaTime: number): void {
    // Skip update if game is over
    if (this.gameState.gameStatus !== 'playing') {
      // Handle quit confirmation
      if (this.showQuitConfirmation) {
        this.handleQuitConfirmation();
        return;
      }
      
      // Handle quit key
      if (this.inputSystem.wasKeyJustPressed('KeyQ')) {
        this.showQuitConfirmation = true;
        return;
      }
      
      // Check for restart input
      if (this.inputSystem.wasKeyJustPressed('KeyR')) {
        this.restartGame();
      }
      
      // Check for next level input (only on victory)
      if (this.gameState.gameStatus === 'victory' && this.inputSystem.wasKeyJustPressed('KeyN')) {
        this.advanceToNextLevel();
      }
      
      // Allow minimap toggle even when game is over
      if (this.inputSystem.wasKeyJustPressed('KeyM')) {
        this.renderSystem.toggleMinimap();
      }
      return;
    }

    // Pause game when menus are open
    if (UISystem.isUpgradeMenuOpen() || UISystem.isBotMenuOpen()) {
      // Only handle menu navigation and toggle inputs when paused
      this.handleMenuInputs();
      return;
    }

    // Handle quit confirmation
    if (this.showQuitConfirmation) {
      this.handleQuitConfirmation();
      return;
    }
    
    // Handle quit key
    if (this.inputSystem.wasKeyJustPressed('KeyQ')) {
      this.showQuitConfirmation = true;
      return;
    }
    
    const gameTime = performance.now() / 1000;
    const shipInput = this.inputSystem.getShipInput();
    
    // Allow restart during gameplay too
    if (this.inputSystem.wasKeyJustPressed('KeyR')) {
      this.restartGame();
      return;
    }
    
    // Handle minimap toggle
    if (this.inputSystem.wasKeyJustPressed('KeyM')) {
      this.renderSystem.toggleMinimap();
      console.log(`Minimap ${this.renderSystem.isMinimapVisible() ? 'enabled' : 'disabled'}`);
    }
    
    // Handle menu toggles
    this.handleMenuInputs();
    
    // Handle planet claiming and base expansion
    this.handlePlanetInteractions();
    
    // Update planet AI
    const aiActions = PlanetClaimAISystem.updateEnemyAI(
      this.gameState.enemies,
      this.gameState.planets,
      this.gameState.ship,
      deltaTime
    );
    
    // Process AI planet claims
    for (const enemy of aiActions.claimAttempts) {
      const claimablePlanet = PlanetSystem.checkEnemyPlanetClaiming(enemy, this.gameState.planets);
      if (claimablePlanet) {
        PlanetSystem.claimPlanet(claimablePlanet, 'enemy');
      }
    }
    
    // Process AI base expansions
    for (const enemy of aiActions.expansionAttempts) {
      const expandablePlanet = PlanetSystem.checkEnemyBaseExpansion(enemy, this.gameState.planets);
      if (expandablePlanet) {
        PlanetSystem.addBase(expandablePlanet, 'enemy');
      }
    }
    
    // Handle enemy spawning
    if (EnemySystem.shouldSpawnEnemy(gameTime, this.gameState.lastEnemySpawn, this.gameState.worldConfig.enemySpawnInterval)) {
      this.spawnEnemyWave();
      this.scheduleNextAttack();
    }
    
    // Update enemies
    const enemyUpdate = EnemySystem.updateEnemies(
      this.gameState.enemies, 
      this.gameState.ship, 
      deltaTime, 
      this.gameState.worldConfig
    );
    
    // Update space monsters with special spiral movement
    CosmicEggSystem.updateSpaceMonsters(
      this.gameState.enemies,
      this.gameState.ship.position,
      deltaTime
    );
    
    // Handle enemy firing
    for (const enemy of enemyUpdate.shouldFire) {
      const enemyProjectile = EnemyCombatSystem.createEnemyProjectile(enemy);
      this.gameState.projectiles.push(enemyProjectile);
    }
    
    // Handle weapon firing
    if (shipInput.fire && ShipSystem.canFire(this.gameState.ship, gameTime)) {
      const projectile = WeaponSystem.createProjectile(this.gameState.ship);
      this.gameState.projectiles.push(projectile);
      ShipSystem.consumeFireEnergy(this.gameState.ship, gameTime);
      AudioSystem.playWeaponFire();
    }
    
    // Handle bomb launching/purchasing
    if (shipInput.bomb && this.inputSystem.wasKeyJustPressed('KeyB')) {
      if (ShipSystem.canLaunchBomb(this.gameState.ship)) {
        // Launch bomb
        const bomb = WeaponSystem.createBomb(this.gameState.ship, this.gameState.enemies);
        this.gameState.projectiles.push(bomb);
        ShipSystem.launchBomb(this.gameState.ship);
        console.log(`Heat-seeking bomb launched! Bombs remaining: ${this.gameState.ship.bombs}`);
      } else {
        console.log('Cannot launch bomb: no bombs available');
      }
    }
    
    // Handle bomb purchasing with N key
    if (shipInput.buyBomb && this.inputSystem.wasKeyJustPressed('KeyN')) {
      if (ShipSystem.canBuyBomb(this.gameState.ship)) {
        if (ShipSystem.buyBomb(this.gameState.ship)) {
          console.log(`Bomb purchased for 10 materials! Bombs: ${this.gameState.ship.bombs}/${this.gameState.ship.maxBombs}, Materials: ${this.gameState.ship.cargoMaterials}`);
        }
      } else if (this.gameState.ship.bombs >= this.gameState.ship.maxBombs) {
        console.log(`Cannot buy bomb: already at maximum capacity (${this.gameState.ship.maxBombs}/${this.gameState.ship.maxBombs})`);
      } else {
        console.log('Cannot buy bomb: insufficient materials (need 10)');
      }
    }
    
    // Handle emergency melee weapon
    if (shipInput.emergencyMelee && this.inputSystem.wasKeyJustPressed('KeyK')) {
      if (ShipSystem.canUseMeleeWeapon(this.gameState.ship)) {
        if (ShipSystem.activateMeleeWeapon(this.gameState.ship)) {
          // Weapon will discharge when invincibility ends
        }
      } else if (this.gameState.ship.cargoGems < 10) {
        console.log('Cannot use melee weapon: need 10 power gems');
      } else {
        console.log('Cannot use melee weapon: already charging');
      }
    }
    
    // Check if melee weapon should discharge
    if (ShipSystem.isMeleeReady(this.gameState.ship)) {
      const meleeResult = WeaponSystem.createMeleeLightning(this.gameState.ship, this.gameState.enemies);
      
      // Deal damage to all targets
      const destroyedEnemies = WeaponSystem.damageMeleeTargets(meleeResult.targets, 25);
      
      // Create drops for destroyed enemies
      for (const enemy of destroyedEnemies) {
        let drops: any[];
        if (CosmicEggSystem.isSpaceMonster(enemy)) {
          drops = CosmicEggSystem.createSpaceMonsterDrops(enemy);
        } else {
          drops = EnemyCombatSystem.createEnemyDrops(enemy);
        }
        this.gameState.resourceDrops.push(...drops);
        
        // Create explosion particles
        const explosionParticles = ParticleSystem.createExplosionParticles(enemy.position, 10);
        this.gameState.particles.push(...explosionParticles);
      }
      
      // Create lightning visual effects
      for (const bolt of meleeResult.lightningBolts) {
        // Create lightning particles
        const lightningParticles = ParticleSystem.createSparkParticles(
          bolt.startPos,
          { x: bolt.endPos.x - bolt.startPos.x, y: bolt.endPos.y - bolt.startPos.y },
          15
        );
        this.gameState.particles.push(...lightningParticles);
      }
      
      AudioSystem.playEnemyDestruction(); // Lightning sound
      
      // Reset melee state
      this.gameState.ship.meleeCharging = false;
      this.gameState.ship.isInvincible = false;
      // Warning will continue until meleeWarningEndTime
    }
    
    // Update ship
    ShipSystem.updateShip(this.gameState.ship, shipInput, deltaTime);
    
    // Check if ship is out of bounds
    this.checkShipBoundary();
    
    // Update bots
    const botUpdate = BotSystem.updateBots(
      this.gameState.botState,
      this.gameState.ship,
      this.gameState.enemies,
      this.gameState.resourceDrops,
      this.gameState.asteroids,
      deltaTime
    );
    
    // Add bot projectiles to game projectiles
    this.gameState.projectiles.push(...botUpdate.projectiles);
    
    // Handle bot contact damage results
    if (botUpdate.contactDamageResults) {
      // Create drops for destroyed enemies
      for (const enemy of botUpdate.contactDamageResults.enemies) {
        let drops: any[];
        if (CosmicEggSystem.isSpaceMonster(enemy)) {
          drops = CosmicEggSystem.createSpaceMonsterDrops(enemy);
        } else {
          drops = EnemyCombatSystem.createEnemyDrops(enemy);
        }
        this.gameState.resourceDrops.push(...drops);
        
        // Create explosion particles
        const explosionParticles = ParticleSystem.createExplosionParticles(enemy.position, 10);
        this.gameState.particles.push(...explosionParticles);
      }
      
      // Handle destroyed asteroids
      for (const asteroid of botUpdate.contactDamageResults.asteroids) {
        const drops = MiningSystem.createResourceDrops(asteroid);
        this.gameState.resourceDrops.push(...drops);
        
        // Create explosion particles
        const explosionParticles = ParticleSystem.createExplosionParticles(asteroid.position, 12);
        this.gameState.particles.push(...explosionParticles);
      }
    }
    
    // Handle bot resource collection
    for (const resource of botUpdate.collectedResources) {
      const collectionParticles = ParticleSystem.createCollectionParticles(resource.position, resource.type);
      this.gameState.particles.push(...collectionParticles);
      AudioSystem.playResourceCollection();
    }
    
    // Update passive generation from planetary bases
    ShipSystem.updatePassiveGeneration(this.gameState.ship, this.gameState.planets, deltaTime);
    
    // Update projectiles
    WeaponSystem.updateProjectiles(this.gameState.projectiles, deltaTime, this.gameState.worldConfig);
    WeaponSystem.updateBombs(this.gameState.projectiles, this.gameState.enemies, deltaTime);
    this.gameState.projectiles = WeaponSystem.removeInactiveProjectiles(this.gameState.projectiles);
    
    // Check projectile-asteroid collisions
    const collisions = MiningSystem.checkProjectileAsteroidCollisions(
      this.gameState.projectiles, 
      this.gameState.asteroids
    );
    
    // Check projectile-planet collisions
    const planetCollisions = BaseCombatSystem.checkProjectilePlanetCollisions(
      this.gameState.projectiles,
      this.gameState.planets
    );
    
    // Check projectile-enemy collisions
    const enemyCollisions = EnemyCombatSystem.checkProjectileEnemyCollisions(
      this.gameState.projectiles,
      this.gameState.enemies
    );
    
    // Process collisions
    for (const collision of collisions) {
      const destroyed = MiningSystem.damageAsteroid(collision.asteroid, this.gameState.worldConfig.miningDamage);
      if (destroyed) {
        // Track asteroid destruction
        this.gameState.finalStats.asteroidsDestroyed++;
        
        // Check if this was a cosmic egg
        if (collision.asteroid.isCosmicEgg) {
          const { spaceMonsters } = CosmicEggSystem.checkCosmicEggDestruction(
            [collision.asteroid], 
            this.gameState.ship.position
          );
          
          // Add space monsters to the game
          this.gameState.enemies.push(...spaceMonsters);
          
          // Create warning for each space monster
          for (const monster of spaceMonsters) {
            const warning = {
              id: MathUtils.generateId(),
              startTime: performance.now() / 1000,
              duration: 4.0, // Show warning for 4 seconds
              monsterId: monster.id
            };
            this.gameState.spaceMonsterWarnings.push(warning);
            
            // Play warning sound
            AudioSystem.playSpaceMonsterWarning();
            console.log(`⚠️ SPACE MONSTER WARNING! ${monster.enemyType?.toUpperCase()} detected!`);
          }
          
          // Create dramatic explosion for cosmic egg
          const eggExplosionParticles = ParticleSystem.createExplosionParticles(collision.asteroid.position, 20);
          this.gameState.particles.push(...eggExplosionParticles);
          
          AudioSystem.playEnemyDestruction(); // Special sound for egg cracking
        }
        
        const drops = MiningSystem.createResourceDrops(collision.asteroid);
        this.gameState.resourceDrops.push(...drops);
        
        // Create explosion particles (unless it was a cosmic egg - already handled above)
        if (!collision.asteroid.isCosmicEgg) {
          const explosionParticles = ParticleSystem.createExplosionParticles(collision.asteroid.position, 12);
          this.gameState.particles.push(...explosionParticles);
        }
      } else {
        // Create spark particles for hits
        const sparkParticles = ParticleSystem.createSparkParticles(
          collision.projectile.position,
          collision.projectile.velocity
        );
        this.gameState.particles.push(...sparkParticles);
      }
      
      AudioSystem.playMiningHit();
    }
    
    // Process planet collisions
    for (const collision of planetCollisions) {
      const damage = BaseCombatSystem.calculatePlanetDamage(collision.projectile);
      const destroyed = PlanetSystem.damagePlanet(collision.planet, damage);
      
      // Create spark particles for planet hits
      const sparkParticles = ParticleSystem.createSparkParticles(
        collision.projectile.position,
        collision.projectile.velocity,
        8
      );
      this.gameState.particles.push(...sparkParticles);
      
      if (destroyed) {
        const weaponType = collision.projectile.type === 'bomb' ? 'bomb' : 'projectile';
        console.log(`Planet base destroyed by ${weaponType} (${damage} damage) and unclaimed!`);
        // Create explosion particles for destroyed base
        const explosionParticles = ParticleSystem.createExplosionParticles(collision.planet.position, 15);
        this.gameState.particles.push(...explosionParticles);
      } else {
        const weaponType = collision.projectile.type === 'bomb' ? 'bomb' : 'projectile';
        console.log(`Planet hit by ${weaponType} for ${damage} damage! HP: ${Math.ceil(collision.planet.currentHP)}/${collision.planet.maxHP}`);
      }
      
      AudioSystem.playMiningHit();
    }
    
    // Process enemy collisions
    for (const collision of enemyCollisions) {
      // Handle bomb vs space monster special case
      if (collision.projectile.type === 'bomb' && CosmicEggSystem.isSpaceMonster(collision.enemy)) {
        // Bomb stuns space monster instead of killing it
        CosmicEggSystem.stunSpaceMonster(collision.enemy, 3.0); // 3 second stun
        const damage = 5; // Bomb deals 5 damage to space monsters
        const destroyed = EnemySystem.damageEnemy(collision.enemy, damage);
        
        if (destroyed) {
          collision.enemy.active = false;
          
          // Track space monster kill
          this.gameState.finalStats.spaceMonsterKills++;
          this.gameState.finalStats.enemiesDestroyed++;
          
          const drops = CosmicEggSystem.createSpaceMonsterDrops(collision.enemy);
          this.gameState.resourceDrops.push(...drops);
          
          // Create explosion particles
          const explosionParticles = ParticleSystem.createExplosionParticles(collision.enemy.position, 10);
          this.gameState.particles.push(...explosionParticles);
          
          AudioSystem.playEnemyDestruction();
          console.log(`Space monster ${collision.enemy.enemyType} destroyed by bomb after taking damage!`);
        } else {
          console.log(`Space monster ${collision.enemy.enemyType} stunned by bomb! HP: ${collision.enemy.health}/${collision.enemy.maxHealth}`);
        }
      } else {
        // Normal collision handling
        const damage = collision.projectile.type === 'bomb' ? 999 : this.gameState.worldConfig.enemyDamage;
        const destroyed = EnemySystem.damageEnemy(collision.enemy, damage);
        
        if (destroyed) {
          collision.enemy.active = false;
          
          // Track enemy destruction
          if (CosmicEggSystem.isSpaceMonster(collision.enemy)) {
            this.gameState.finalStats.spaceMonsterKills++;
          }
          this.gameState.finalStats.enemiesDestroyed++;
          
          // Check if this is a space monster for special drops
          let drops: any[];
          if (CosmicEggSystem.isSpaceMonster(collision.enemy)) {
            drops = CosmicEggSystem.createSpaceMonsterDrops(collision.enemy);
            console.log(`Space monster ${collision.enemy.enemyType} defeated! Massive resource drop!`);
          } else {
            drops = EnemyCombatSystem.createEnemyDrops(collision.enemy);
          }
          
          this.gameState.resourceDrops.push(...drops);
          
          // Create explosion particles
          const explosionParticles = ParticleSystem.createExplosionParticles(collision.enemy.position, 10);
          this.gameState.particles.push(...explosionParticles);
          
          AudioSystem.playEnemyDestruction();
          
          if (CosmicEggSystem.isSpaceMonster(collision.enemy)) {
            const weaponType = collision.projectile.type === 'bomb' ? 'bomb' : 'projectile';
            console.log(`Space monster ${collision.enemy.enemyType} destroyed by ${weaponType}!`);
          } else {
            const weaponType = collision.projectile.type === 'bomb' ? 'bomb' : 'projectile';
            console.log(`Enemy destroyed by ${weaponType}!`);
          }
        }
      }
    }
    
    // Remove destroyed asteroids
    this.gameState.asteroids = MiningSystem.removeDestroyedAsteroids(this.gameState.asteroids);
    
    // Remove inactive enemies
    this.gameState.enemies = EnemySystem.removeInactiveEnemies(this.gameState.enemies);
    
    // Update planet regeneration
    PlanetSystem.updatePlanetRegen(this.gameState.planets, deltaTime);
    
    // Update planet bot generation and combat
    PlanetSystem.updatePlanetBotGeneration(this.gameState.planets, deltaTime);
    const planetBotProjectiles = PlanetSystem.updatePlanetBots(this.gameState.planets, this.gameState.enemies, deltaTime);
    this.gameState.projectiles.push(...planetBotProjectiles);
    
    // Update resource drops
    ResourceSystem.updateResourceDrops(this.gameState.resourceDrops, deltaTime);
    
    // Update resource attraction to ship
    ResourceSystem.updateResourceAttraction(this.gameState.resourceDrops, this.gameState.ship, deltaTime);
    
    // Check resource collection
    const collectedResources = ResourceSystem.checkResourceCollection(this.gameState.ship, this.gameState.resourceDrops);
    
    // Create collection particles and play sounds
    for (const resource of collectedResources) {
      const collectionParticles = ParticleSystem.createCollectionParticles(resource.position, resource.type);
      this.gameState.particles.push(...collectionParticles);
      AudioSystem.playResourceCollection();
    }
    
    this.gameState.resourceDrops = ResourceSystem.removeCollectedResources(this.gameState.resourceDrops);
    
    // Check collisions
    const collidedAsteroid = CollisionSystem.checkShipAsteroidCollision(
      this.gameState.ship, 
      this.gameState.asteroids
    );
    
    if (collidedAsteroid) {
      CollisionSystem.resolveShipAsteroidCollision(this.gameState.ship, collidedAsteroid);
    }
    
    // Check ship-projectile collisions (enemy projectiles hitting player)
    const hitProjectiles = CollisionSystem.checkShipProjectileCollision(
      this.gameState.ship,
      this.gameState.projectiles
    );
    
    for (const projectile of hitProjectiles) {
      CollisionSystem.resolveShipProjectileHit(this.gameState.ship, projectile);
      
      // Create impact particles
      const impactParticles = ParticleSystem.createSparkParticles(
        projectile.position,
        { x: -projectile.velocity.x, y: -projectile.velocity.y },
        6
      );
      this.gameState.particles.push(...impactParticles);
    }
    
    // Check ship-enemy collisions
    const collidedEnemy = CollisionSystem.checkShipEnemyCollision(
      this.gameState.ship,
      this.gameState.enemies
    );
    
    if (collidedEnemy) {
      const collisionResult = CollisionSystem.resolveShipEnemyCollision(this.gameState.ship, collidedEnemy);
      
      if (collisionResult.enemyDestroyed) {
        // Create explosion particles for destroyed enemy
        const explosionParticles = ParticleSystem.createExplosionParticles(collidedEnemy.position, 10);
        this.gameState.particles.push(...explosionParticles);
        
        // Track enemy destruction
        if (CosmicEggSystem.isSpaceMonster(collidedEnemy)) {
          this.gameState.finalStats.spaceMonsterKills++;
        }
        this.gameState.finalStats.enemiesDestroyed++;
        
        // Create drops (special drops for space monsters)
        let drops: any[];
        if (CosmicEggSystem.isSpaceMonster(collidedEnemy)) {
          drops = CosmicEggSystem.createSpaceMonsterDrops(collidedEnemy);
          console.log(`Space monster ${collidedEnemy.enemyType} destroyed by collision! Massive resource drop!`);
        } else {
          drops = EnemyCombatSystem.createEnemyDrops(collidedEnemy);
        }
        this.gameState.resourceDrops.push(...drops);
        
        AudioSystem.playEnemyDestruction();
        
        if (CosmicEggSystem.isSpaceMonster(collidedEnemy)) {
          console.log(`Space monster ${collidedEnemy.enemyType} destroyed by collision!`);
        } else {
          console.log('Enemy destroyed by collision!');
        }
      }
    }
    
    // Update particles
    ParticleSystem.updateParticles(this.gameState.particles, deltaTime);
    this.gameState.particles = ParticleSystem.removeDeadParticles(this.gameState.particles);
    
    // Update space monster warnings - remove expired ones
    this.gameState.spaceMonsterWarnings = this.gameState.spaceMonsterWarnings.filter(
      warning => (gameTime - warning.startTime) < warning.duration
    );
    
    // Update camera
    CameraSystem.updateCamera(this.gameState.camera, this.gameState.ship, deltaTime);
    
    // Update cosmic egg pulse effects
    this.updateCosmicEggPulses(deltaTime);
    
    // Check for ship destruction
    GameStateSystem.checkShipDestruction(this.gameState);
    
    // Check game end conditions
    GameStateSystem.checkGameEndConditions(this.gameState);
  }

  private updateCosmicEggPulses(deltaTime: number): void {
    const currentTime = performance.now() / 1000;
    const canvas = this.renderSystem.getCanvas();
    
    for (const asteroid of this.gameState.asteroids) {
      if (!asteroid.isCosmicEgg) continue;
      
      // Initialize pulse timing if not set
      if (asteroid.lastPulseTime === undefined) {
        asteroid.lastPulseTime = currentTime + (Math.random() * 12);
        asteroid.pulsePhase = 0;
      }
      
      // Check if it's time for a pulse (every 12 seconds)
      if (currentTime - asteroid.lastPulseTime >= 12) {
        asteroid.lastPulseTime = currentTime;
        asteroid.pulsePhase = 1.0; // Start pulse at full intensity
        
        // Check if asteroid is visible on screen before playing sound
        const screenPos = CameraSystem.worldToScreen(asteroid.position, this.gameState.camera, canvas);
        const isVisible = (
          screenPos.x >= -asteroid.radius && 
          screenPos.x <= canvas.width + asteroid.radius &&
          screenPos.y >= -asteroid.radius && 
          screenPos.y <= canvas.height + asteroid.radius
        );
        
        if (isVisible) {
          AudioSystem.playCosmicEggHeartbeat();
        }
      }
      
      // Update pulse phase (fade out over 1 second)
      if (asteroid.pulsePhase !== undefined && asteroid.pulsePhase > 0) {
        asteroid.pulsePhase = Math.max(0, asteroid.pulsePhase - deltaTime); // Fade over 1 second
      }
    }
  }

  private handleMenuInputs(): void {
    // Handle ESC key to close any open menu
    if (this.inputSystem.wasKeyJustPressed('Escape')) {
      if (UISystem.isUpgradeMenuOpen() || UISystem.isBotMenuOpen()) {
        UISystem.closeAllMenus();
        console.log('Menu closed with ESC key');
        return;
      }
    }
    
    // Handle upgrade menu toggle
    if (this.inputSystem.wasKeyJustPressed('KeyU')) {
      UISystem.toggleUpgradeMenu();
      if (UISystem.isUpgradeMenuOpen()) {
        console.log('Upgrade menu opened - use TAB to navigate, ENTER to purchase');
      }
      console.log(`Upgrade menu ${UISystem.isUpgradeMenuOpen() ? 'opened' : 'closed'}`);
    }
    
    // Handle bot menu toggle
    if (this.inputSystem.wasKeyJustPressed('KeyP')) {
      UISystem.toggleBotMenu();
      
      if (UISystem.isBotMenuOpen()) {
        // Menu just opened
        const canShow = BotSystem.canShowPurchaseOption(this.gameState.ship, this.gameState.botState);
        if (canShow) {
          console.log('Bot menu opened - use TAB to navigate, ENTER to purchase');
        } else {
          console.log(`Bot menu opened - collect ${this.gameState.botState.cargoThreshold} total cargo to unlock bot purchases`);
        }
      } else {
        console.log('Bot menu closed');
      }
    }
    
    // Handle menu navigation with TAB
    if (this.inputSystem.wasKeyJustPressed('Tab')) {
      if (UISystem.isUpgradeMenuOpen()) {
        UISystem.navigateUpgradeMenu('down');
      } else if (UISystem.isBotMenuOpen()) {
        UISystem.navigateBotMenu('down');
      }
    }
    
    // Handle menu navigation with arrow keys
    if (this.inputSystem.wasKeyJustPressed('ArrowUp') || this.inputSystem.wasKeyJustPressed('KeyW')) {
      if (UISystem.isUpgradeMenuOpen()) {
        UISystem.navigateUpgradeMenu('up');
      } else if (UISystem.isBotMenuOpen()) {
        UISystem.navigateBotMenu('up');
      }
    }
    
    if (this.inputSystem.wasKeyJustPressed('ArrowDown') || this.inputSystem.wasKeyJustPressed('KeyS')) {
      if (UISystem.isUpgradeMenuOpen()) {
        UISystem.navigateUpgradeMenu('down');
      } else if (UISystem.isBotMenuOpen()) {
        UISystem.navigateBotMenu('down');
      }
    }
    
    // Handle menu selection with ENTER
    if (this.inputSystem.wasKeyJustPressed('Enter')) {
      if (UISystem.isUpgradeMenuOpen()) {
        this.handleUpgradePurchase();
      } else if (UISystem.isBotMenuOpen()) {
        this.handleBotPurchase();
      }
    }
  }

  private handlePlanetInteractions(): void {
    // Check for planet claiming
    const claimablePlanet = PlanetSystem.checkPlanetClaiming(this.gameState.ship, this.gameState.planets);
    if (claimablePlanet && PlanetSystem.canPlayerAffordBase(this.gameState.ship, this.gameState.worldConfig.baseCost)) {
      if (PlanetSystem.consumeBaseCost(this.gameState.ship, this.gameState.worldConfig.baseCost)) {
        PlanetSystem.claimPlanet(claimablePlanet, 'player');
        console.log(`Planet claimed! Cost: ${this.gameState.worldConfig.baseCost} materials`);
      }
    }
    
    // Check for base expansion
    const expandablePlanet = PlanetSystem.checkBaseExpansion(this.gameState.ship, this.gameState.planets);
    if (expandablePlanet && PlanetSystem.canPlayerAffordBase(this.gameState.ship, this.gameState.worldConfig.baseCost)) {
      if (PlanetSystem.consumeBaseCost(this.gameState.ship, this.gameState.worldConfig.baseCost)) {
        PlanetSystem.addBase(expandablePlanet, 'player');
        console.log(`Base expanded! Cost: ${this.gameState.worldConfig.baseCost} materials`);
      }
    }
  }

  private render(): void {
    if (this.gamePhase === 'roleSelection') {
      this.renderSystem.renderRoleSelection(SHIP_ROLES, this.selectedRoleIndex);
    } else if (this.gamePhase === 'difficultySelection') {
      this.renderSystem.renderDifficultySelection(DIFFICULTIES, this.selectedDifficultyIndex, this.gameState);
    } else if (this.gamePhase === 'missionSelection') {
      this.renderSystem.renderMissionSelection(MISSIONS, this.selectedMissionIndex);
    } else {
      this.renderSystem.render(this.gameState);
    }
    
    // Render quit confirmation overlay if needed
    if (this.showQuitConfirmation) {
      this.renderSystem.renderQuitConfirmation();
    }
  }

  // Public methods for debugging and future expansion
  getGameState(): GameState {
    return this.gameState;
  }

  regenerateWorld(): void {
    this.gameState.asteroids = WorldGenerator.generateAsteroidField(this.gameState.worldConfig);
    this.gameState.planets = PlanetSystem.generatePlanets(this.gameState.worldConfig, this.gameState.asteroids);
    this.gameState.projectiles = [];
    this.gameState.resourceDrops = [];
    this.gameState.enemies = [];
    this.gameState.particles = [];
    this.gameState.lastEnemySpawn = 0;
    console.log(`Regenerated ${this.gameState.asteroids.length} asteroids and ${this.gameState.planets.length} planets`);
  }

  startNewGame(): void {
    // Return to role selection
    this.currentLevel = 1; // Reset level
    this.gamePhase = 'roleSelection';
    this.selectedRoleIndex = 0;
    this.selectedMissionIndex = 0;
    this.selectedRole = null;
    
    console.log('Returning to role selection...');
  }

  restartGame(): void {
    if (this.selectedRole && this.gameState.selectedMission) {
      // Quick restart with current role
      const currentMission = this.gameState.selectedMission; // Store mission before reset
      this.gameState = this.createInitialGameState();
      this.gameState.ship = ShipSystem.createShip(this.selectedRole);
      this.gameState.selectedMission = currentMission; // Restore the stored mission
      
      // Start new timer
      this.gameState.gameTimer = GameTimerSystem.createTimer();
      
      // Set first enemy attack timing
      this.gameState.worldConfig.enemySpawnInterval = 3;
      this.gameState.lastEnemySpawn = performance.now() / 1000;
      
      console.log(`Game restarted with ${this.selectedRole.name} role and ${this.gameState.selectedMission.name} mission!`);
      console.log(`Generated ${this.gameState.asteroids.length} asteroids and ${this.gameState.planets.length} planets`);
    } else {
      // No role/mission selected, go to role selection
      this.startNewGame();
    }
  }

  startNewGameWithCurrentRole(): void {
    // Reset game state
    GameStateSystem.resetGame(this.gameState);
    
    // Generate new world
    this.gameState.asteroids = WorldGenerator.generateAsteroidField(this.gameState.worldConfig);
    
    // Generate new planets
    this.gameState.planets = PlanetSystem.generatePlanets(this.gameState.worldConfig, this.gameState.asteroids);
    
    // Schedule first attack for 30 seconds
    this.gameState.worldConfig.enemySpawnInterval = 30;
    
    console.log(`New game started with ${this.gameState.asteroids.length} asteroids and ${this.gameState.planets.length} planets`);
  }

  private handleQuitConfirmation(): void {
    // Handle confirmation input
    if (this.inputSystem.wasKeyJustPressed('KeyQ') || this.inputSystem.wasKeyJustPressed('Enter')) {
      // Quit to title screen - return to role selection
      this.gamePhase = 'roleSelection';
      this.selectedRoleIndex = 0;
      this.selectedMissionIndex = 0;
      this.selectedRole = null;
      this.showQuitConfirmation = false;
      console.log('Returned to title screen');
    }
    
    if (this.inputSystem.wasKeyJustPressed('KeyN') || this.inputSystem.wasKeyJustPressed('Escape')) {
      // Cancel quit
      this.showQuitConfirmation = false;
    }
  }

  private advanceToNextLevel(): void {
    // Increment level
    this.currentLevel++;
    this.gameState.currentLevel = this.currentLevel;
    
    // Apply level scaling to world config
    const baseAsteroidCount = 35;
    const baseSpawnInterval = this.selectedDifficulty?.enemySpawnMultiplier ? 
      8 * this.selectedDifficulty.enemySpawnMultiplier : 8;
    
    // Each level: +3 asteroids, 5% faster enemy spawns
    this.gameState.worldConfig.asteroidCount = baseAsteroidCount + ((this.currentLevel - 1) * 3);
    this.gameState.worldConfig.enemySpawnInterval = baseSpawnInterval * Math.pow(0.95, this.currentLevel - 1);
    
    // Generate new world with level scaling
    this.gameState.asteroids = WorldGenerator.generateAsteroidField(
      this.gameState.worldConfig, 
      this.selectedDifficulty?.cosmicEggMultiplier || 1.0
    );
    this.gameState.planets = PlanetSystem.generatePlanets(this.gameState.worldConfig, this.gameState.asteroids);
    
    // Reset game state but keep ship upgrades and bots
    this.gameState.projectiles = [];
    this.gameState.resourceDrops = [];
    this.gameState.enemies = [];
    this.gameState.particles = [];
    this.gameState.spaceMonsterWarnings = [];
    this.gameState.lastEnemySpawn = 0;
    this.gameState.gameStatus = 'playing';
    this.gameState.gameEndReason = '';
    
    // Reset ship position and health but keep upgrades
    this.gameState.ship.position = { x: 0, y: 0 };
    this.gameState.ship.velocity = { x: 0, y: 0 };
    this.gameState.ship.hullStrength = this.gameState.ship.maxHullStrength;
    this.gameState.ship.energy = this.gameState.ship.maxEnergy;
    this.gameState.ship.isInvincible = false;
    this.gameState.ship.meleeCharging = false;
    
    // Reset camera
    this.gameState.camera = { x: 0, y: 0 };
    
    // Start new timer
    this.gameState.gameTimer = GameTimerSystem.createTimer();
    
    // Schedule first enemy attack
    this.gameState.lastEnemySpawn = performance.now() / 1000;
    
    console.log(`Advanced to Level ${this.currentLevel}!`);
    console.log(`Asteroids: ${this.gameState.worldConfig.asteroidCount}, Enemy spawn rate: ${this.gameState.worldConfig.enemySpawnInterval.toFixed(1)}s`);
  }

  private spawnEnemyWave(gameTime: number): void {
    // Check if we need to activate fail-safe system
    this.checkFailsafeActivation();
    
    // Check if this is the first attack (within 10 seconds of game start)
    const isFirstAttack = (gameTime - this.gameState.lastEnemySpawn) < 10;
    
    // Apply difficulty multiplier to enemy count
    const baseEnemyCount = isFirstAttack ? 1 : Math.floor(Math.random() * 5) + 1;
    const difficultyMultiplier = this.selectedDifficulty?.enemyCountMultiplier || 1.0;
    const enemyCount = Math.max(1, Math.floor(baseEnemyCount * difficultyMultiplier));
    
    // Check if this should be a fail-safe spawn (every other spawn when fail-safe is active)
    const isFailsafeSpawn = this.failsafeActive && (this.failsafeSpawnCounter % 2 === 0);
    if (this.failsafeActive) {
      this.failsafeSpawnCounter++;
    }
    
    if (isFirstAttack) {
      console.log(`First enemy scout incoming!`);
    } else {
      console.log(`Enemy attack wave incoming! ${enemyCount} enemies spawning! (${Math.round(difficultyMultiplier * 100)}% of normal)`);
    }
    
    for (let i = 0; i < enemyCount; i++) {
      // Slight delay between each enemy spawn in the wave (0-2 seconds)
      setTimeout(() => {
        const newEnemy = EnemySystem.createEnemy(this.gameState.ship.position);
        
        // Mark enemy as resource carrier if this is a fail-safe spawn
        if (isFailsafeSpawn) {
          (newEnemy as any).isResourceCarrier = true;
        }
        
        this.gameState.enemies.push(newEnemy);
        if (isFirstAttack) {
          console.log(`Scout enemy spawned!`);
        } else {
          console.log(`Enemy ${i + 1}/${enemyCount} spawned!`);
        }
      }, i * Math.random() * 2000);
    }
  }

  private checkFailsafeActivation(): void {
    const asteroidsRemaining = this.gameState.asteroids.length;
    const gameNotWon = this.gameState.gameStatus === 'playing';
    
    if (asteroidsRemaining === 0 && gameNotWon && !this.failsafeActive) {
      this.failsafeActive = true;
      this.failsafeSpawnCounter = 0;
      console.log('🚨 FAIL-SAFE ACTIVATED: All asteroids mined but mission not complete! Resource-carrying enemies will spawn every other wave.');
    }
  }

  private scheduleNextAttack(): void {
    // Randomize next attack time (8-120 seconds) - more frequent attacks
    const minDelay = 8;
    const maxDelay = 120;
    const nextAttackDelay = Math.random() * (maxDelay - minDelay) + minDelay;
    
    this.gameState.worldConfig.enemySpawnInterval = nextAttackDelay;
    this.gameState.lastEnemySpawn = performance.now() / 1000;
    
    console.log(`Next enemy attack scheduled in ${Math.round(nextAttackDelay)} seconds`);
  }

  private handleUpgradePurchase(): void {
    const selectedTab = UISystem.getSelectedUpgradeTab();
    const upgradeType = UISystem.getSelectedUpgradeType();
    
    if (!upgradeType) return;
    
    if (selectedTab === 'ship') {
      const shipUpgradeType = upgradeType as keyof import('./systems/UpgradeSystem').ShipUpgrades;
      if (UpgradeSystem.purchaseShipUpgrade(this.gameState.ship, this.gameState.upgradeState, shipUpgradeType)) {
        console.log(`Successfully upgraded ${upgradeType}!`);
      } else {
        console.log(`Cannot upgrade ${upgradeType} - insufficient resources or max level reached`);
      }
    } else if (selectedTab === 'base') {
      const baseUpgradeType = upgradeType as 'baseHP' | 'baseRegen';
      if (UpgradeSystem.purchaseBaseUpgrade(this.gameState.ship, this.gameState.upgradeState, baseUpgradeType, this.gameState.planets)) {
        console.log(`Successfully upgraded ${upgradeType}!`);
      } else {
        console.log(`Cannot upgrade ${upgradeType} - insufficient resources or max level reached`);
      }
    }
  }

  private handleBotPurchase(): void {
    const canPurchase = BotSystem.canPurchaseBot(this.gameState.ship, this.gameState.botState);
    const canShow = BotSystem.canShowPurchaseOption(this.gameState.ship, this.gameState.botState);
    
    if (canShow && canPurchase) {
      if (BotSystem.purchaseBot(this.gameState.ship, this.gameState.botState, 'defense')) {
        console.log('Defense bot purchased successfully!');
      } else {
        console.log('Failed to purchase bot - unknown error');
      }
    } else if (!canShow) {
      console.log(`Cannot purchase bot: need ${this.gameState.botState.cargoThreshold} total cargo to unlock bots`);
    } else if (this.gameState.botState.bots.length >= this.gameState.botState.maxBots) {
      console.log('Cannot purchase bot: maximum bots reached');
    } else {
      console.log(`Cannot purchase bot: need ${this.gameState.botState.purchaseCost.materials} materials and ${this.gameState.botState.purchaseCost.gems} gems`);
    }
  }

  private checkShipBoundary(): void {
    const ship = this.gameState.ship;
    const worldConfig = this.gameState.worldConfig;
    const halfWidth = worldConfig.worldWidth / 2;
    const halfHeight = worldConfig.worldHeight / 2;
    
    // Check if ship is outside world boundaries
    const wasOutOfBounds = ship.isOutOfBounds;
    ship.isOutOfBounds = (
      ship.position.x < -halfWidth || 
      ship.position.x > halfWidth ||
      ship.position.y < -halfHeight || 
      ship.position.y > halfHeight
    );
    
    // Log boundary crossing for debugging
    if (!wasOutOfBounds && ship.isOutOfBounds) {
      console.log('Ship crossed outside map boundary - weapons disabled!');
    } else if (wasOutOfBounds && !ship.isOutOfBounds) {
      console.log('Ship returned to map boundary - weapons enabled!');
    }
  }
}