import { Planet, Vector2D, WorldConfig, Ship, Enemy } from '../types/GameTypes';
import { MathUtils } from '../utils/MathUtils';

export class PlanetSystem {
  private static readonly BASE_HP = 100;
  private static readonly HP_PER_BASE = 25;
  private static readonly REGEN_RATE = 5; // HP per second
  private static readonly CLAIM_RADIUS_RATIO = 0.6; // Claim radius is 60% of visual radius

  static generatePlanets(worldConfig: WorldConfig, existingAsteroids: any[]): Planet[] {
    const planets: Planet[] = [];
    const attempts = worldConfig.planetCount * 20; // Max attempts to prevent infinite loops
    
    for (let i = 0; i < attempts && planets.length < worldConfig.planetCount; i++) {
      const position: Vector2D = {
        x: MathUtils.randomBetween(-worldConfig.worldWidth / 2, worldConfig.worldWidth / 2),
        y: MathUtils.randomBetween(-worldConfig.worldHeight / 2, worldConfig.worldHeight / 2)
      };

      // Skip if too close to center (player spawn area)
      if (MathUtils.distance(position, { x: 0, y: 0 }) < 200) {
        continue;
      }

      // Check spacing from existing planets
      const tooCloseToOtherPlanets = planets.some(planet => 
        MathUtils.distance(position, planet.position) < worldConfig.planetMinSpacing
      );

      // Check spacing from asteroids
      const tooCloseToAsteroids = existingAsteroids.some(asteroid => 
        MathUtils.distance(position, asteroid.position) < worldConfig.planetMinSpacing
      );

      if (!tooCloseToOtherPlanets && !tooCloseToAsteroids) {
        const radius = MathUtils.randomBetween(worldConfig.planetSizeMin, worldConfig.planetSizeMax);
        planets.push(this.createPlanet(position, radius));
      }
    }

    console.log(`Generated ${planets.length} planets`);
    return planets;
  }

  private static createPlanet(position: Vector2D, radius: number): Planet {
    return {
      id: MathUtils.generateId(),
      position,
      radius,
      baseHP: this.BASE_HP,
      currentHP: this.BASE_HP,
      maxHP: this.BASE_HP,
      owner: 'none',
      bases: 0,
      lastRegenTime: performance.now() / 1000,
      regenRate: this.REGEN_RATE,
      claimRadius: radius * this.CLAIM_RADIUS_RATIO,
      materialsMined: 0,
      planetBots: []
    };
  }

  static checkPlanetClaiming(ship: Ship, planets: Planet[]): Planet | null {
    for (const planet of planets) {
      if (planet.owner !== 'none') continue;

      const distance = MathUtils.distance(ship.position, planet.position);
      if (distance <= planet.claimRadius) {
        return planet;
      }
    }
    return null;
  }

  static checkEnemyPlanetClaiming(enemy: Enemy, planets: Planet[]): Planet | null {
    for (const planet of planets) {
      if (planet.owner !== 'none') continue;

      const distance = MathUtils.distance(enemy.position, planet.position);
      if (distance <= planet.claimRadius) {
        return planet;
      }
    }
    return null;
  }

  static checkBaseExpansion(ship: Ship, planets: Planet[]): Planet | null {
    for (const planet of planets) {
      if (planet.owner !== 'player') continue;
      if (planet.bases >= 5) continue; // Max bases reached

      const distance = MathUtils.distance(ship.position, planet.position);
      if (distance <= planet.claimRadius) {
        return planet;
      }
    }
    return null;
  }

  static checkEnemyBaseExpansion(enemy: Enemy, planets: Planet[]): Planet | null {
    for (const planet of planets) {
      if (planet.owner !== 'enemy') continue;
      if (planet.bases >= 5) continue; // Max bases reached

      const distance = MathUtils.distance(enemy.position, planet.position);
      if (distance <= planet.claimRadius) {
        return planet;
      }
    }
    return null;
  }

  static claimPlanet(planet: Planet, owner: 'player' | 'enemy'): boolean {
    if (planet.owner !== 'none') return false;

    planet.owner = owner;
    planet.bases = 1;
    planet.maxHP = this.BASE_HP + this.HP_PER_BASE;
    planet.currentHP = planet.maxHP;

    console.log(`Planet claimed by ${owner}! HP: ${planet.currentHP}/${planet.maxHP}`);
    return true;
  }

  static addBase(planet: Planet, owner: 'player' | 'enemy'): boolean {
    if (planet.owner !== owner) return false;
    if (planet.bases >= 5) return false;

    planet.bases++;
    planet.maxHP = this.BASE_HP + (planet.bases * this.HP_PER_BASE);
    planet.currentHP = planet.maxHP;

    console.log(`Base added to planet! Bases: ${planet.bases}, HP: ${planet.currentHP}/${planet.maxHP}`);
    return true;
  }

  static damagePlanet(planet: Planet, damage: number): boolean {
    planet.currentHP = Math.max(0, planet.currentHP - damage);
    
    console.log(`Planet damaged for ${damage} HP! Current: ${Math.ceil(planet.currentHP)}/${planet.maxHP}, Owner: ${planet.owner}, Bases: ${planet.bases}`);
    
    if (planet.currentHP <= 0) {
      // Planet destroyed - becomes unclaimed
      const wasOwned = planet.owner !== 'none';
      planet.owner = 'none';
      planet.bases = 0;
      planet.maxHP = this.BASE_HP;
      planet.currentHP = this.BASE_HP;
      
      if (wasOwned) {
        console.log(`Planet base destroyed! Planet is now unclaimed and restored to ${this.BASE_HP} HP.`);
      }
      
      // Remove all planet bots when planet is destroyed
      planet.planetBots = [];
      planet.materialsMined = 0;
      
      return true; // Planet was destroyed/unclaimed
    }
    
    return false; // Planet still owned
  }

  static updatePlanetRegen(planets: Planet[], _deltaTime: number): void {
    const currentTime = performance.now() / 1000;
    
    for (const planet of planets) {
      // Only regen if owned and not at full HP
      if (planet.owner !== 'none' && planet.currentHP < planet.maxHP) {
        const timeSinceLastRegen = currentTime - planet.lastRegenTime;
        
        if (timeSinceLastRegen >= 1.0) { // Regen every second
          const regenAmount = planet.regenRate * Math.floor(timeSinceLastRegen);
          planet.currentHP = Math.min(planet.maxHP, planet.currentHP + regenAmount);
          planet.lastRegenTime = currentTime;
        }
      }
    }
  }

  static getPlayerPlanets(planets: Planet[]): Planet[] {
    return planets.filter(planet => planet.owner === 'player');
  }

  static getEnemyPlanets(planets: Planet[]): Planet[] {
    return planets.filter(planet => planet.owner === 'enemy');
  }

  static getUnclaimedPlanets(planets: Planet[]): Planet[] {
    return planets.filter(planet => planet.owner === 'none');
  }

  static canPlayerAffordBase(ship: Ship, baseCost: number): boolean {
    return ship.cargoMaterials >= baseCost;
  }

  static consumeBaseCost(ship: Ship, baseCost: number): boolean {
    if (ship.cargoMaterials >= baseCost) {
      ship.cargoMaterials -= baseCost;
      return true;
    }
    return false;
  }

  static updatePlanetBotGeneration(planets: Planet[], deltaTime: number): void {
    for (const planet of planets) {
      if (planet.owner !== 'player') continue;
      
      // Track materials generated (0.5 per base per second)
      const materialGenRate = planet.bases * 0.5;
      planet.materialsMined += materialGenRate * deltaTime;
      
      // Check if we can spawn a new bot (every 10 materials mined)
      const botsEarned = Math.floor(planet.materialsMined / 10);
      const maxBots = planet.bases * 3; // 3 bots per base
      const currentBots = planet.planetBots.filter(bot => bot.active).length;
      
      if (botsEarned > currentBots && currentBots < maxBots) {
        this.spawnPlanetBot(planet, currentBots);
        console.log(`Planet spawned defense bot! Total bots: ${currentBots + 1}/${maxBots}`);
      }
    }
  }

  private static spawnPlanetBot(planet: Planet, botIndex: number): void {
    const baseIndex = Math.floor(botIndex / 3); // Which base (0-4)
    const botSlot = botIndex % 3; // Which slot for this base (0-2)
    
    // Calculate orbit parameters
    const baseOrbitRadius = planet.radius + 25 + (baseIndex * 15); // Stagger orbits by base
    const baseAngle = (baseIndex / Math.max(planet.bases, 1)) * Math.PI * 2;
    const botAngleOffset = (botSlot / 3) * (Math.PI * 2 / 3); // 3 bots per base
    
    const newBot: import('../types/GameTypes').PlanetBot = {
      id: MathUtils.generateId(),
      position: { ...planet.position },
      rotation: 0,
      radius: 6,
      orbitAngle: baseAngle + botAngleOffset,
      orbitRadius: baseOrbitRadius,
      baseIndex,
      botIndex: botSlot,
      lastFireTime: 0,
      fireRate: 0.4, // Slightly slower than player bots
      range: 150,
      active: true
    };
    
    planet.planetBots.push(newBot);
  }

  static updatePlanetBots(planets: Planet[], enemies: import('../types/GameTypes').Enemy[], deltaTime: number): import('../types/GameTypes').Projectile[] {
    const projectiles: import('../types/GameTypes').Projectile[] = [];
    const currentTime = performance.now() / 1000;

    for (const planet of planets) {
      if (planet.owner !== 'player') continue;

      for (const bot of planet.planetBots) {
        if (!bot.active) continue;

        // Update orbit position
        bot.orbitAngle += deltaTime * 0.3; // Slow orbit
        bot.position.x = planet.position.x + Math.cos(bot.orbitAngle) * bot.orbitRadius;
        bot.position.y = planet.position.y + Math.sin(bot.orbitAngle) * bot.orbitRadius;

        // Find nearest enemy to attack
        const nearestEnemy = this.findNearestEnemyToPlanet(bot.position, enemies, bot.range);
        
        if (nearestEnemy && (currentTime - bot.lastFireTime) >= bot.fireRate) {
          // Aim at enemy
          const aimDirection = {
            x: nearestEnemy.position.x - bot.position.x,
            y: nearestEnemy.position.y - bot.position.y
          };
          bot.rotation = Math.atan2(aimDirection.x, -aimDirection.y);

          // Create projectile
          const projectile = this.createPlanetBotProjectile(bot);
          projectiles.push(projectile);
          bot.lastFireTime = currentTime;
        }
      }
    }

    return projectiles;
  }

  private static findNearestEnemyToPlanet(botPosition: Vector2D, enemies: import('../types/GameTypes').Enemy[], range: number): import('../types/GameTypes').Enemy | null {
    let nearest: import('../types/GameTypes').Enemy | null = null;
    let nearestDistance = range;

    for (const enemy of enemies) {
      if (!enemy.active) continue;
      
      const distance = MathUtils.distance(botPosition, enemy.position);
      if (distance < nearestDistance) {
        nearest = enemy;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  private static createPlanetBotProjectile(bot: import('../types/GameTypes').PlanetBot): import('../types/GameTypes').Projectile {
    const spawnDistance = bot.radius + 3;
    const direction = { x: Math.sin(bot.rotation), y: -Math.cos(bot.rotation) };
    
    return {
      id: MathUtils.generateId(),
      position: {
        x: bot.position.x + direction.x * spawnDistance,
        y: bot.position.y + direction.y * spawnDistance
      },
      velocity: {
        x: direction.x * 200,
        y: direction.y * 200
      },
      radius: 1.5,
      active: true,
      damage: 0.8, // Slightly weaker than player
      type: 'normal'
    };
  }
}
