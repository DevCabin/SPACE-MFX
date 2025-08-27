import { Enemy, Ship, Vector2D, WorldConfig } from '../types/GameTypes';
import { MathUtils } from '../utils/MathUtils';

export class EnemySystem {
  private static readonly ENEMY_SPEED = 80;
  private static readonly ENEMY_ROTATION_SPEED = 2;
  private static readonly ENEMY_FIRE_RATE = 2; // seconds between shots
  private static readonly ENEMY_FIRE_RANGE = 200;
  private static readonly ENEMY_SPAWN_DISTANCE = 400;
  private static advancedEnemyKillCount = 0;

  static createEnemy(playerPosition: Vector2D, gameLevel: number, shipLevel: number): Enemy {
    // Spawn enemy at random position around player
    const angle = Math.random() * Math.PI * 2;
    const spawnDistance = this.ENEMY_SPAWN_DISTANCE + Math.random() * 200;
    
    // Determine enemy type based on game and ship levels
    // More accessible conditions: either high game level OR moderate ship level
    let enemyType: 'normal' | 'advanced' = 'normal';
    if (gameLevel >= 2 || shipLevel >= 2) {
      // 25% chance for advanced enemy when conditions are met
      enemyType = Math.random() < 0.25 ? 'advanced' : 'normal';
    }
    
    // Set stats based on enemy type
    const radius = enemyType === 'advanced' ? 20 : 15;
    const health = enemyType === 'advanced' ? 9 : 3; // 3x stronger
    
    return {
      id: MathUtils.generateId(),
      position: {
        x: playerPosition.x + Math.cos(angle) * spawnDistance,
        y: playerPosition.y + Math.sin(angle) * spawnDistance
      },
      velocity: { x: 0, y: 0 },
      rotation: 0,
      radius: radius,
      health: health,
      maxHealth: health,
      lastFireTime: 0,
      active: true,
      spawnTime: performance.now() / 1000,
      aiState: 'hunting',
      targetPlanetId: undefined,
      lastNearPlayerTime: performance.now() / 1000,
      enemyType: enemyType
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

      // Check if should fire - advanced enemies fire 2x faster
      const fireRate = enemy.enemyType === 'advanced' ? this.ENEMY_FIRE_RATE / 2 : this.ENEMY_FIRE_RATE;
      if (distanceToPlayer < this.ENEMY_FIRE_RANGE && 
          (currentTime - enemy.lastFireTime) >= fireRate) {
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

  static onAdvancedEnemyKilled(enemy: Enemy): any[] {
    if (enemy.enemyType !== 'advanced') {
      return []; // Not an advanced enemy, return empty array
    }

    this.advancedEnemyKillCount++;
    console.log(`Advanced enemy killed! Count: ${this.advancedEnemyKillCount}`);

    // Every 3rd advanced enemy kill gets special loot
    if (this.advancedEnemyKillCount % 3 === 0) {
      console.log(`🎉 Special loot drop! (${this.advancedEnemyKillCount}/3 advanced enemies killed)`);
      return this.createSpecialLootDrop(enemy);
    }

    // Regular loot for non-3rd kills
    return this.createRegularLootDrop(enemy);
  }

  private static createSpecialLootDrop(enemy: Enemy): any[] {
    const drops = [];
    const basePosition = enemy.position;

    // Create 3-5 power gems in a circle pattern
    const gemCount = 3 + Math.floor(Math.random() * 3); // 3-5 gems
    for (let i = 0; i < gemCount; i++) {
      const angle = (i / gemCount) * Math.PI * 2;
      const distance = 25 + Math.random() * 15; // 25-40 units from center
      drops.push({
        id: MathUtils.generateId(),
        type: 'powerGem',
        position: {
          x: basePosition.x + Math.cos(angle) * distance,
          y: basePosition.y + Math.sin(angle) * distance
        },
        velocity: {
          x: Math.cos(angle) * (20 + Math.random() * 30),
          y: Math.sin(angle) * (20 + Math.random() * 30)
        },
        radius: 4,
        collected: false,
        attractionStartTime: performance.now() / 1000 + 1.0, // Start attraction after 1 second
        value: 2 // Double value power gems
      });
    }

    // Create 2-4 materials
    const materialCount = 2 + Math.floor(Math.random() * 3); // 2-4 materials
    for (let i = 0; i < materialCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 20; // 30-50 units from center
      drops.push({
        id: MathUtils.generateId(),
        type: 'rawMaterial',
        position: {
          x: basePosition.x + Math.cos(angle) * distance,
          y: basePosition.y + Math.sin(angle) * distance
        },
        velocity: {
          x: Math.cos(angle) * (15 + Math.random() * 25),
          y: Math.sin(angle) * (15 + Math.random() * 25)
        },
        radius: 3,
        collected: false,
        attractionStartTime: performance.now() / 1000 + 0.8, // Start attraction after 0.8 seconds
        value: 3 // Triple value materials
      });
    }

    return drops;
  }

  private static createRegularLootDrop(enemy: Enemy): any[] {
    const drops = [];
    const basePosition = enemy.position;

    // 50% chance for a power gem
    if (Math.random() < 0.5) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 15 + Math.random() * 10;
      drops.push({
        id: MathUtils.generateId(),
        type: 'powerGem',
        position: {
          x: basePosition.x + Math.cos(angle) * distance,
          y: basePosition.y + Math.sin(angle) * distance
        },
        velocity: {
          x: Math.cos(angle) * (10 + Math.random() * 20),
          y: Math.sin(angle) * (10 + Math.random() * 20)
        },
        radius: 4,
        collected: false,
        attractionStartTime: performance.now() / 1000 + 0.5,
        value: 1
      });
    }

    // Always drop 1-2 materials
    const materialCount = 1 + Math.floor(Math.random() * 2); // 1-2 materials
    for (let i = 0; i < materialCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 10 + Math.random() * 15;
      drops.push({
        id: MathUtils.generateId(),
        type: 'rawMaterial',
        position: {
          x: basePosition.x + Math.cos(angle) * distance,
          y: basePosition.y + Math.sin(angle) * distance
        },
        velocity: {
          x: Math.cos(angle) * (8 + Math.random() * 15),
          y: Math.sin(angle) * (8 + Math.random() * 15)
        },
        radius: 3,
        collected: false,
        attractionStartTime: performance.now() / 1000 + 0.3,
        value: 1
      });
    }

    return drops;
  }

  static resetAdvancedEnemyKillCount(): void {
    this.advancedEnemyKillCount = 0;
  }
}
