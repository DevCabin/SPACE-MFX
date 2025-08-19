import { Asteroid, ResourceDrop, Projectile } from '../types/GameTypes';
import { MathUtils } from '../utils/MathUtils';

export class MiningSystem {
  static checkProjectileAsteroidCollisions(
    projectiles: Projectile[], 
    asteroids: Asteroid[]
  ): { asteroid: Asteroid; projectile: Projectile }[] {
    const collisions: { asteroid: Asteroid; projectile: Projectile }[] = [];

    for (const projectile of projectiles) {
      if (!projectile.active) continue;

      for (const asteroid of asteroids) {
        const distance = MathUtils.distance(
          projectile.position, asteroid.position
        );

        if (distance < projectile.radius + asteroid.radius) {
          collisions.push({ asteroid, projectile });
          projectile.active = false;
          break; // Projectile can only hit one asteroid
        }
      }
    }

    return collisions;
  }

  static damageAsteroid(asteroid: Asteroid, damage: number = 1): boolean {
    asteroid.health -= damage;
    return asteroid.health <= 0;
  }

  static createResourceDrops(asteroid: Asteroid): ResourceDrop[] {
    const drops: ResourceDrop[] = [];

    // Drop multiple raw materials based on asteroid size
    // Small asteroids (15-25): 2-4 materials
    // Medium asteroids (25-35): 4-6 materials  
    // Large asteroids (35-40): 6-8 materials
    const sizeRatio = (asteroid.radius - 15) / (40 - 15); // 0 to 1
    const minMaterials = 2 + Math.floor(sizeRatio * 4); // 2-6
    const maxMaterials = 4 + Math.floor(sizeRatio * 4); // 4-8
    const materialCount = Math.floor(Math.random() * (maxMaterials - minMaterials + 1)) + minMaterials;
    
    for (let i = 0; i < materialCount; i++) {
      drops.push({
        id: Math.random().toString(36).substr(2, 9),
        position: {
          x: asteroid.position.x + (Math.random() - 0.5) * 40,
          y: asteroid.position.y + (Math.random() - 0.5) * 40
        },
        type: 'rawMaterial',
        radius: 6,
        collected: false,
        velocity: {
          x: (Math.random() - 0.5) * 80,
          y: (Math.random() - 0.5) * 80
        }
      });
    }

    // Maybe drop power gem
    if (asteroid.dropsPowerGem) {
      drops.push({
        id: Math.random().toString(36).substr(2, 9),
        position: {
          x: asteroid.position.x + (Math.random() - 0.5) * 20,
          y: asteroid.position.y + (Math.random() - 0.5) * 20
        },
        type: 'powerGem',
        radius: 8,
        collected: false,
        velocity: {
          x: (Math.random() - 0.5) * 70,
          y: (Math.random() - 0.5) * 70
        }
      });
    }

    return drops;
  }

  static removeDestroyedAsteroids(asteroids: Asteroid[]): Asteroid[] {
    return asteroids.filter(asteroid => asteroid.health > 0);
  }
}