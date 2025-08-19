import { Enemy, Ship, Vector2D, WorldConfig } from '../types/GameTypes';
import { MathUtils } from '../utils/MathUtils';

export class EnemySystem {
  private static readonly ENEMY_SPEED = 80;
  private static readonly ENEMY_ROTATION_SPEED = 2;
  private static readonly ENEMY_FIRE_RATE = 2; // seconds between shots
  private static readonly ENEMY_FIRE_RANGE = 200;
  private static readonly ENEMY_SPAWN_DISTANCE = 400;

  static createEnemy(playerPosition: Vector2D): Enemy {
    // Spawn enemy at random position around player
    const angle = Math.random() * Math.PI * 2;
    const spawnDistance = this.ENEMY_SPAWN_DISTANCE + Math.random() * 200;
    
    return {
      id: MathUtils.generateId(),
      position: {
        x: playerPosition.x + Math.cos(angle) * spawnDistance,
        y: playerPosition.y + Math.sin(angle) * spawnDistance
      },
      velocity: { x: 0, y: 0 },
      rotation: 0,
      radius: 15,
      health: 3,
      maxHealth: 3,
      lastFireTime: 0,
      active: true,
      spawnTime: performance.now() / 1000,
      aiState: 'hunting',
      targetPlanetId: undefined,
      lastNearPlayerTime: performance.now() / 1000 // Track when enemy was last near player
    };
  }

  static shouldSpawnEnemy(gameTime: number, lastSpawnTime: number, spawnInterval: number): boolean {
    return (gameTime - lastSpawnTime) >= spawnInterval;
  }

  static updateEnemies(
    enemies: Enemy[], 
    playerShip: Ship, 
    deltaTime: number, 
    worldConfig: WorldConfig
  ): { shouldFire: Enemy[], toRemove: Enemy[] } {
    const shouldFire: Enemy[] = [];
    const toRemove: Enemy[] = [];
    const currentTime = performance.now() / 1000;

    for (const enemy of enemies) {
      if (!enemy.active) continue;

      // Check despawn conditions - much more lenient
      const distanceToPlayer = MathUtils.distance(enemy.position, playerShip.position);
      const age = currentTime - enemy.spawnTime;

      // Update last near player time if enemy is close
      if (distanceToPlayer <= worldConfig.enemyDespawnDistance) {
        enemy.lastNearPlayerTime = currentTime;
      }
      
      // Only despawn if enemy has been far away for a long time AND is very old
      const timeSinceNearPlayer = currentTime - (enemy.lastNearPlayerTime || enemy.spawnTime);
      const shouldDespawn = (
        age > worldConfig.enemyLifetime && // Must be very old (10+ minutes)
        timeSinceNearPlayer > worldConfig.enemyDespawnTime && // Must be away for extended time
        distanceToPlayer > worldConfig.enemyDespawnDistance * 1.5 // Must be very far away
      );
      
      if (shouldDespawn) {
        enemy.active = false;
        toRemove.push(enemy);
        console.log(`Enemy despawned after ${Math.round(age)}s total age and ${Math.round(timeSinceNearPlayer)}s away from player`);
        continue;
      }

      // AI Movement - move toward player
      const directionToPlayer = {
        x: playerShip.position.x - enemy.position.x,
        y: playerShip.position.y - enemy.position.y
      };
      const normalizedDirection = MathUtils.normalize(directionToPlayer);

      // Update velocity toward player
      enemy.velocity.x = normalizedDirection.x * this.ENEMY_SPEED;
      enemy.velocity.y = normalizedDirection.y * this.ENEMY_SPEED;

      // Update rotation to face player
      const targetRotation = Math.atan2(directionToPlayer.x, -directionToPlayer.y);
      const rotationDiff = targetRotation - enemy.rotation;
      
      // Normalize rotation difference to [-π, π]
      let normalizedDiff = rotationDiff;
      while (normalizedDiff > Math.PI) normalizedDiff -= 2 * Math.PI;
      while (normalizedDiff < -Math.PI) normalizedDiff += 2 * Math.PI;
      
      // Rotate toward target
      const rotationStep = this.ENEMY_ROTATION_SPEED * deltaTime;
      if (Math.abs(normalizedDiff) < rotationStep) {
        enemy.rotation = targetRotation;
      } else {
        enemy.rotation += Math.sign(normalizedDiff) * rotationStep;
      }

      // Update position
      enemy.position.x += enemy.velocity.x * deltaTime;
      enemy.position.y += enemy.velocity.y * deltaTime;

      // Check if should fire
      if (distanceToPlayer < this.ENEMY_FIRE_RANGE && 
          (currentTime - enemy.lastFireTime) >= this.ENEMY_FIRE_RATE) {
        shouldFire.push(enemy);
        enemy.lastFireTime = currentTime;
      }
    }

    return { shouldFire, toRemove };
  }

  static damageEnemy(enemy: Enemy, damage: number): boolean {
    enemy.health -= damage;
    return enemy.health <= 0;
  }

  static removeInactiveEnemies(enemies: Enemy[]): Enemy[] {
    return enemies.filter(enemy => enemy.active);
  }
}