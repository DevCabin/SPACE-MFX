import { Ship, Vector2D, Enemy, ResourceDrop, Projectile } from '../types/GameTypes';
import { MathUtils } from '../utils/MathUtils';
import { WeaponSystem } from './WeaponSystem';

export interface Bot {
  id: string;
  position: Vector2D;
  targetPosition: Vector2D;
  rotation: number;
  radius: number;
  lastFireTime: number;
  fireRate: number;
  damage: number;
  range: number;
  collectRange: number;
  energyDrainPerShot: number;
  energyDrainPerSecond: number;
  orbitAngle: number;
  orbitRadius: number;
  type: 'mining' | 'defense';
}

export interface BotState {
  bots: Bot[];
  maxBots: number;
  purchaseCost: {
    materials: number;
    gems: number;
  };
  cargoThreshold: number;
}

export class BotSystem {
  private static readonly BOT_FIRE_RATE = 0.3; // Slower than player
  private static readonly BOT_DAMAGE_MULTIPLIER = 0.6; // 60% of player damage
  private static readonly BOT_RANGE = 180;
  private static readonly BOT_COLLECT_RANGE = 50;
  private static readonly BOT_ENERGY_DRAIN_SHOT = 5;
  private static readonly BOT_ENERGY_DRAIN_SECOND = 1;
  private static readonly BOT_ORBIT_RADIUS = 60;
  private static readonly BOT_MOVE_SPEED = 3;

  static createInitialBotState(): BotState {
    return {
      bots: [],
      maxBots: 3,
      purchaseCost: {
        materials: 15,
        gems: 2
      },
      cargoThreshold: 25
    };
  }

  static canPurchaseBot(ship: Ship, botState: BotState): boolean {
    const totalCargo = ship.cargoMaterials + ship.cargoGems;
    const hasReachedThreshold = totalCargo >= botState.cargoThreshold;
    const hasSpace = botState.bots.length < botState.maxBots;
    const canAfford = ship.cargoMaterials >= botState.purchaseCost.materials && 
                     ship.cargoGems >= botState.purchaseCost.gems;
    
    return hasReachedThreshold && hasSpace && canAfford;
  }

  static purchaseBot(ship: Ship, botState: BotState, botType: 'mining' | 'defense' = 'defense'): boolean {
    if (!this.canPurchaseBot(ship, botState)) {
      return false;
    }

    // Deduct costs
    ship.cargoMaterials -= botState.purchaseCost.materials;
    ship.cargoGems -= botState.purchaseCost.gems;

    // Create new bot
    const bot = this.createBot(ship.position, botType, botState.bots.length);
    botState.bots.push(bot);

    console.log(`${botType} bot purchased! Bots: ${botState.bots.length}/${botState.maxBots}, Cost: ${botState.purchaseCost.materials} materials, ${botState.purchaseCost.gems} gems`);
    return true;
  }

  private static createBot(playerPosition: Vector2D, type: 'mining' | 'defense', index: number): Bot {
    const orbitAngle = (index / 3) * Math.PI * 2 + (Math.PI / 6); // Distribute evenly around player with offset
    
    return {
      id: MathUtils.generateId(),
      position: { ...playerPosition },
      targetPosition: { ...playerPosition },
      rotation: 0,
      radius: 8,
      lastFireTime: 0,
      fireRate: this.BOT_FIRE_RATE,
      damage: 1, // Will be scaled by player weapon damage
      range: this.BOT_RANGE,
      collectRange: this.BOT_COLLECT_RANGE,
      energyDrainPerShot: this.BOT_ENERGY_DRAIN_SHOT,
      energyDrainPerSecond: this.BOT_ENERGY_DRAIN_SECOND,
      orbitAngle,
      orbitRadius: this.BOT_ORBIT_RADIUS + (index * 15), // Stagger orbit distances
      type
    };
  }

  static updateBots(
    botState: BotState, 
    ship: Ship, 
    enemies: Enemy[], 
    resourceDrops: ResourceDrop[], 
    asteroids: any[],
    deltaTime: number
  ): { projectiles: Projectile[], collectedResources: ResourceDrop[], contactDamageResults?: { enemies: Enemy[], asteroids: any[] } } {
    const projectiles: Projectile[] = [];
    const collectedResources: ResourceDrop[] = [];
    const contactDamageResults: { enemies: Enemy[], asteroids: any[] } = { enemies: [], asteroids: [] };
    const currentTime = performance.now() / 1000;

    for (let i = 0; i < botState.bots.length; i++) {
      const bot = botState.bots[i];
      
      // Update orbit position around player
      bot.orbitAngle += deltaTime * 0.5; // Slow orbit
      bot.targetPosition = {
        x: ship.position.x + Math.cos(bot.orbitAngle) * bot.orbitRadius,
        y: ship.position.y + Math.sin(bot.orbitAngle) * bot.orbitRadius
      };

      // Smooth movement to target position
      const direction = {
        x: bot.targetPosition.x - bot.position.x,
        y: bot.targetPosition.y - bot.position.y
      };
      const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
      
      if (distance > 5) {
        const normalized = MathUtils.normalize(direction);
        bot.position.x += normalized.x * this.BOT_MOVE_SPEED * deltaTime * 60;
        bot.position.y += normalized.y * this.BOT_MOVE_SPEED * deltaTime * 60;
      }

      // Drain energy over time
      ship.energy = Math.max(0, ship.energy - bot.energyDrainPerSecond * deltaTime);

      // Defense bot behavior: target and fire at enemies
      if (bot.type === 'defense' || bot.type === 'mining') { // Mining bots also defend
        const nearestEnemy = this.findNearestEnemy(bot.position, enemies, bot.range);
        
        if (nearestEnemy && (currentTime - bot.lastFireTime) >= bot.fireRate) {
          // Check if ship has enough energy for bot to fire
          if (ship.energy >= bot.energyDrainPerShot) {
            // Aim at enemy
            const aimDirection = {
              x: nearestEnemy.position.x - bot.position.x,
              y: nearestEnemy.position.y - bot.position.y
            };
            bot.rotation = Math.atan2(aimDirection.x, -aimDirection.y);

            // Create projectile
            const projectile = this.createBotProjectile(bot, ship.weaponDamage);
            projectiles.push(projectile);

            // Drain energy and update fire time
            ship.energy -= bot.energyDrainPerShot;
            bot.lastFireTime = currentTime;
          }
        }
      }

      // Mining bot behavior: collect nearby resources
      if (bot.type === 'mining' || bot.type === 'defense') { // Both types collect resources
        const nearbyResources = this.findNearbyResources(bot.position, resourceDrops, bot.collectRange);
        
        for (const resource of nearbyResources) {
          if (!resource.collected) {
            // Try to add resource to ship cargo
            if (this.tryCollectResource(ship, resource)) {
              resource.collected = true;
              collectedResources.push(resource);
            }
          }
        }
      }

      // Check contact damage with enemies
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        
        const distance = MathUtils.distance(bot.position, enemy.position);
        if (distance < bot.radius + enemy.radius) {
          // Deal 2x damage on contact
          const contactDamage = ship.weaponDamage * 2;
          enemy.health -= contactDamage;
          
          if (enemy.health <= 0) {
            enemy.active = false;
            contactDamageResults.enemies.push(enemy);
          }
          
          console.log(`Bot dealt ${contactDamage} contact damage to enemy! Enemy HP: ${enemy.health}`);
        }
      }

      // Check contact damage with asteroids
      for (const asteroid of asteroids) {
        const distance = MathUtils.distance(bot.position, asteroid.position);
        if (distance < bot.radius + asteroid.radius) {
          // Deal 2x damage on contact
          const contactDamage = Math.floor(ship.weaponDamage * 2);
          asteroid.health -= contactDamage;
          
          if (asteroid.health <= 0) {
            contactDamageResults.asteroids.push(asteroid);
          }
          
          console.log(`Bot dealt ${contactDamage} contact damage to asteroid! Asteroid HP: ${asteroid.health}`);
        }
      }
    }

    return { projectiles, collectedResources, contactDamageResults };
  }

  private static findNearestEnemy(botPosition: Vector2D, enemies: Enemy[], range: number): Enemy | null {
    let nearest: Enemy | null = null;
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

  private static findNearbyResources(botPosition: Vector2D, resources: ResourceDrop[], range: number): ResourceDrop[] {
    const nearby: ResourceDrop[] = [];

    for (const resource of resources) {
      if (resource.collected) continue;
      
      const distance = MathUtils.distance(botPosition, resource.position);
      if (distance <= range) {
        nearby.push(resource);
      }
    }

    return nearby;
  }

  private static tryCollectResource(ship: Ship, resource: ResourceDrop): boolean {
    const totalCargo = ship.cargoMaterials + ship.cargoGems;
    const maxCargo = ship.maxCargoMaterials + ship.maxCargoGems;
    
    if (totalCargo >= maxCargo) {
      return false; // Cargo full
    }

    if (resource.type === 'rawMaterial') {
      // First priority: repair hull if damaged
      if (ship.hullStrength < ship.maxHullStrength) {
        const repairAmount = 10;
        const actualRepair = Math.min(repairAmount, ship.maxHullStrength - ship.hullStrength);
        ship.hullStrength += actualRepair;
        return true;
      } else {
        ship.cargoMaterials++;
        return true;
      }
    } else if (resource.type === 'powerGem') {
      // If energy is below 50%, use power gem to refill energy
      if (ship.energy < ship.maxEnergy * 0.5) {
        ship.energy = ship.maxEnergy;
        return true;
      } else {
        ship.cargoGems++;
        return true;
      }
    }

    return false;
  }

  private static createBotProjectile(bot: Bot, playerWeaponDamage: number): Projectile {
    const spawnDistance = bot.radius + 3;
    const direction = { x: Math.sin(bot.rotation), y: -Math.cos(bot.rotation) };
    
    return {
      id: MathUtils.generateId(),
      position: {
        x: bot.position.x + direction.x * spawnDistance,
        y: bot.position.y + direction.y * spawnDistance
      },
      velocity: {
        x: direction.x * 250, // Slightly slower than player projectiles
        y: direction.y * 250
      },
      radius: 1.5,
      active: true,
      damage: playerWeaponDamage * this.BOT_DAMAGE_MULTIPLIER,
      type: 'normal'
    };
  }

  static getTotalEnergyDrain(botState: BotState): number {
    return 0; // No passive energy drain
  }

  static getBotCount(botState: BotState): number {
    return botState.bots.length;
  }

  static getMaxBots(botState: BotState): number {
    return botState.maxBots;
  }

  static canShowPurchaseOption(ship: Ship, botState: BotState): boolean {
    const totalCargo = ship.cargoMaterials + ship.cargoGems;
    return totalCargo >= botState.cargoThreshold;
  }
}