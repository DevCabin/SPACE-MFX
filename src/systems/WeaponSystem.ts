import { Ship, Projectile } from '../types/GameTypes';
import { Enemy } from '../types/GameTypes';
import { MathUtils } from '../utils/MathUtils';

export class WeaponSystem {
  private static readonly MELEE_RANGE = 400; // Half viewport width (assuming 800px viewport)
  private static readonly MELEE_DAMAGE = 25; // Heavy damage
  
  static createProjectile(ship: Ship): Projectile {
    const spawnDistance = ship.radius + 5;
    const direction = { x: Math.sin(ship.rotation), y: -Math.cos(ship.rotation) };
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      position: {
        x: ship.position.x + direction.x * spawnDistance,
        y: ship.position.y + direction.y * spawnDistance
      },
      velocity: {
        x: direction.x * 300 + ship.velocity.x * 0.5,
        y: direction.y * 300 + ship.velocity.y * 0.5
      },
      radius: 2,
      active: true,
      damage: ship.weaponDamage,
      type: 'normal'
    };
  }

  static updateProjectiles(projectiles: Projectile[], deltaTime: number, worldConfig: any): void {
    for (const projectile of projectiles) {
      if (!projectile.active) continue;

      // Update position
      projectile.position.x += projectile.velocity.x * deltaTime;
      projectile.position.y += projectile.velocity.y * deltaTime;

      // Check world bounds
      const halfWidth = worldConfig.worldWidth / 2;
      const halfHeight = worldConfig.worldHeight / 2;
      
      if (projectile.position.x < -halfWidth || projectile.position.x > halfWidth ||
          projectile.position.y < -halfHeight || projectile.position.y > halfHeight) {
        projectile.active = false;
      }
    }
  }
  
  static removeInactiveProjectiles(projectiles: Projectile[]): Projectile[] {
    return projectiles.filter(projectile => projectile.active);
  }

  static createBomb(ship: Ship, enemies: Enemy[]): Projectile {
    const spawnDistance = ship.radius + 8;
    const direction = { x: Math.sin(ship.rotation), y: -Math.cos(ship.rotation) };
    
    // Find nearest enemy for targeting
    let nearestEnemy: Enemy | null = null;
    let nearestDistance = Infinity;
    
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const distance = MathUtils.distance(ship.position, enemy.position);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestEnemy = enemy;
      }
    }
    
    return {
      id: MathUtils.generateId(),
      position: {
        x: ship.position.x + direction.x * spawnDistance,
        y: ship.position.y + direction.y * spawnDistance
      },
      velocity: {
        x: direction.x * 200 + ship.velocity.x * 0.3,
        y: direction.y * 200 + ship.velocity.y * 0.3
      },
      radius: 4,
      active: true,
      damage: 5, // High damage bomb
      type: 'bomb',
      targetId: nearestEnemy?.id,
      seekingSpeed: 400
    };
  }

  static updateBombs(projectiles: Projectile[], enemies: Enemy[], deltaTime: number): void {
    for (const projectile of projectiles) {
      if (!projectile.active || projectile.type !== 'bomb') continue;
      
      // If bomb has a target, seek it
      if (projectile.targetId && projectile.seekingSpeed) {
        const target = enemies.find(e => e.id === projectile.targetId && e.active);
        
        if (target) {
          // Calculate direction to target
          const direction = {
            x: target.position.x - projectile.position.x,
            y: target.position.y - projectile.position.y
          };
          const normalized = MathUtils.normalize(direction);
          
          // Update velocity to seek target
          projectile.velocity.x = normalized.x * projectile.seekingSpeed;
          projectile.velocity.y = normalized.y * projectile.seekingSpeed;
        } else {
          // Target lost, clear targeting
          projectile.targetId = undefined;
        }
      }
    }
  }

  static createMeleeLightning(ship: Ship, enemies: Enemy[]): { targets: Enemy[], lightningBolts: any[] } {
    const targets: Enemy[] = [];
    const lightningBolts: any[] = [];
    
    // Find all enemies within range
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      
      const distance = MathUtils.distance(ship.position, enemy.position);
      if (distance <= this.MELEE_RANGE) {
        targets.push(enemy);
        
        // Create lightning bolt visual
        lightningBolts.push({
          id: MathUtils.generateId(),
          startPos: { ...ship.position },
          endPos: { ...enemy.position },
          duration: 0.3,
          startTime: performance.now() / 1000
        });
      }
    }
    
    console.log(`Melee lightning strikes ${targets.length} enemies!`);
    return { targets, lightningBolts };
  }

  static damageMeleeTargets(targets: Enemy[], damage: number): Enemy[] {
    const destroyedEnemies: Enemy[] = [];
    
    for (const enemy of targets) {
      enemy.health -= damage;
      if (enemy.health <= 0) {
        enemy.active = false;
        destroyedEnemies.push(enemy);
      }
    }
    
    return destroyedEnemies;
  }
}