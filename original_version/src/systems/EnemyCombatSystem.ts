import { Enemy, Projectile, ResourceDrop } from '../types/GameTypes';
import { MathUtils } from '../utils/MathUtils';
import { WeaponSystem } from './WeaponSystem';

export class EnemyCombatSystem {
  private static firstEnemyKilled = false;

  static checkProjectileEnemyCollisions(
    projectiles: Projectile[], 
    enemies: Enemy[]
  ): { enemy: Enemy; projectile: Projectile }[] {
    const collisions: { enemy: Enemy; projectile: Projectile }[] = [];

    for (const projectile of projectiles) {
      if (!projectile.active) continue;

      for (const enemy of enemies) {
        if (!enemy.active) continue;

        const distance = MathUtils.distance(projectile.position, enemy.position);
        if (distance < projectile.radius + enemy.radius) {
          collisions.push({ enemy, projectile });
          projectile.active = false;
          break; // Projectile can only hit one enemy
        }
      }
    }

    return collisions;
  }

  static createEnemyProjectile(enemy: Enemy): Projectile {
    const spawnDistance = enemy.radius + 5;
    const direction = { x: Math.sin(enemy.rotation), y: -Math.cos(enemy.rotation) };
    
    return {
      id: MathUtils.generateId(),
      position: {
        x: enemy.position.x + direction.x * spawnDistance,
        y: enemy.position.y + direction.y * spawnDistance
      },
      velocity: {
        x: direction.x * 250,
        y: direction.y * 250
      },
      radius: 2,
      active: true,
      damage: 0.5 // Enemy projectiles - will be scaled for hull damage
    };
  }

  static createEnemyDrops(enemy: Enemy): ResourceDrop[] {
    const drops: ResourceDrop[] = [];
    
    // Check if this is a resource-carrying enemy (fail-safe system)
    const isResourceCarrier = (enemy as any).isResourceCarrier;
    if (isResourceCarrier) {
      console.log('💰 Resource-carrying enemy defeated! Dropping substantial resources...');
      
      // Drop substantial resources (15-25 materials, 5-10 gems)
      const materialCount = Math.floor(Math.random() * 11) + 15; // 15-25 materials
      const gemCount = Math.floor(Math.random() * 6) + 5; // 5-10 gems
      
      // Create material drops
      for (let i = 0; i < materialCount; i++) {
        drops.push({
          id: MathUtils.generateId(),
          position: {
            x: enemy.position.x + (Math.random() - 0.5) * 80,
            y: enemy.position.y + (Math.random() - 0.5) * 80
          },
          type: 'rawMaterial',
          radius: 6,
          collected: false,
          velocity: {
            x: (Math.random() - 0.5) * 120,
            y: (Math.random() - 0.5) * 120
          }
        });
      }
      
      // Create gem drops
      for (let i = 0; i < gemCount; i++) {
        drops.push({
          id: MathUtils.generateId(),
          position: {
            x: enemy.position.x + (Math.random() - 0.5) * 60,
            y: enemy.position.y + (Math.random() - 0.5) * 60
          },
          type: 'powerGem',
          radius: 8,
          collected: false,
          velocity: {
            x: (Math.random() - 0.5) * 100,
            y: (Math.random() - 0.5) * 100
          }
        });
      }
      
      return drops;
    }
    
    // Special case: First enemy drops massive resources for testing
    if (!this.firstEnemyKilled) {
      this.firstEnemyKilled = true;
      console.log('First enemy killed - dropping 50 materials and 20 gems for testing!');
      
      // Drop 50 raw materials
      for (let i = 0; i < 50; i++) {
        drops.push({
          id: MathUtils.generateId(),
          position: {
            x: enemy.position.x + (Math.random() - 0.5) * 100,
            y: enemy.position.y + (Math.random() - 0.5) * 100
          },
          type: 'rawMaterial',
          radius: 6,
          collected: false,
          velocity: {
            x: (Math.random() - 0.5) * 150,
            y: (Math.random() - 0.5) * 150
          }
        });
      }
      
      // Drop 20 power gems
      for (let i = 0; i < 20; i++) {
        drops.push({
          id: MathUtils.generateId(),
          position: {
            x: enemy.position.x + (Math.random() - 0.5) * 80,
            y: enemy.position.y + (Math.random() - 0.5) * 80
          },
          type: 'powerGem',
          radius: 8,
          collected: false,
          velocity: {
            x: (Math.random() - 0.5) * 120,
            y: (Math.random() - 0.5) * 120
          }
        });
      }
      
      return drops;
    }

    // Normal enemy drops (1-3 items)
    const dropCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < dropCount; i++) {
      const dropType = Math.random() < 0.7 ? 'rawMaterial' : 'powerGem';
      
      drops.push({
        id: MathUtils.generateId(),
        position: {
          x: enemy.position.x + (Math.random() - 0.5) * 30,
          y: enemy.position.y + (Math.random() - 0.5) * 30
        },
        type: dropType,
        radius: dropType === 'rawMaterial' ? 6 : 8,
        collected: false,
        velocity: {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100
        }
      });
    }

    return drops;
  }
}