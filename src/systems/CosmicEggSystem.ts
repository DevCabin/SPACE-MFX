import { Asteroid, Enemy, ResourceDrop, Vector2D } from '../types/GameTypes';
import { MathUtils } from '../utils/MathUtils';

export class CosmicEggSystem {
  static checkCosmicEggDestruction(
    asteroids: Asteroid[], 
    playerPosition: Vector2D
  ): { spaceMonsters: Enemy[], eggPositions: Vector2D[] } {
    const spaceMonsters: Enemy[] = [];
    const eggPositions: Vector2D[] = [];
    
    for (const asteroid of asteroids) {
      if (asteroid.isCosmicEgg && asteroid.health <= 0) {
        // Create space monster from destroyed cosmic egg
        const monster = this.createSpaceMonster(asteroid, playerPosition);
        spaceMonsters.push(monster);
        eggPositions.push({ ...asteroid.position });
        
        console.log(`Cosmic egg cracked! ${asteroid.monsterType} space monster emerges!`);
      }
    }
    
    return { spaceMonsters, eggPositions };
  }

  private static createSpaceMonster(asteroid: Asteroid, _playerPosition: Vector2D): Enemy {
    const monsterType = asteroid.monsterType || 'spider';
    
    // Boss-level stats - much tougher!
    const health = 50; // All space monsters now have 50 HP
    let radius: number;
    
    switch (monsterType) {
      case 'spider':
        radius = 18;
        break;
      case 'centipede':
        radius = 20;
        break;
      case 'beetle':
        radius = 19;
        break;
      default:
        radius = 18;
    }
    
    return {
      id: MathUtils.generateId(),
      position: { ...asteroid.position },
      velocity: { x: 0, y: 0 },
      rotation: 0,
      radius,
      health,
      maxHealth: health,
      lastFireTime: 0,
      active: true,
      spawnTime: performance.now() / 1000,
      aiState: 'hunting',
      targetPlanetId: undefined,
      enemyType: monsterType,
      spiralAngle: Math.random() * Math.PI * 2,
      spiralRadius: MathUtils.randomBetween(80, 120),
      hatchState: 'dormant',
      hatchTime: 0,
      burstCooldown: 0,
      burstDuration: 0,
      graceEndTime: (performance.now() / 1000) + 3.0, // 3 seconds of grace period
      stunEndTime: 0 // Time when stun effect ends
    };
  }

  static updateSpaceMonsters(
    enemies: Enemy[], 
    playerPosition: Vector2D, 
    deltaTime: number
  ): void {
    const currentTime = performance.now() / 1000;
    
    for (const enemy of enemies) {
      if (!enemy.active || !enemy.enemyType || enemy.enemyType === 'normal') continue;
      
      // Update hatching state
      if (enemy.hatchTime !== undefined) {
        enemy.hatchTime += deltaTime;
      }
      
      // Handle hatching sequence
      if (enemy.hatchState === 'dormant') {
        // Stay still for 2 seconds
        if (enemy.hatchTime! >= 2.0) {
          enemy.hatchState = 'awakening';
          console.log(`${enemy.enemyType} space monster awakening...`);
        }
        continue; // Don't move while dormant
      } else if (enemy.hatchState === 'awakening') {
        // Awakening phase for 1 second with fast flashing
        if (enemy.hatchTime! >= 3.0) {
          enemy.hatchState = 'active';
          enemy.burstCooldown = 0; // Start first burst immediately
          console.log(`${enemy.enemyType} space monster is now active and hunting!`);
        }
        continue; // Don't move while awakening
      }
      
      // Only move if fully active
      if (enemy.hatchState !== 'active') continue;
      
      // Check if stunned by bomb
      if (enemy.stunEndTime !== undefined && currentTime < enemy.stunEndTime) {
        // Monster is stunned - don't move, just flash
        enemy.velocity.x = 0;
        enemy.velocity.y = 0;
        continue;
      }
      
      // Update spiral movement
      if (enemy.spiralAngle !== undefined && enemy.spiralRadius !== undefined) {
        // Update burst timing
        if (enemy.burstCooldown !== undefined) {
          enemy.burstCooldown -= deltaTime;
        }
        if (enemy.burstDuration !== undefined) {
          enemy.burstDuration -= deltaTime;
        }
        
        // Check if we should start a new burst
        const shouldBurst = (enemy.burstCooldown! <= 0 && enemy.burstDuration! <= 0);
        const inBurst = enemy.burstDuration! > 0;
        
        if (shouldBurst) {
          // Start new burst
          enemy.burstDuration = MathUtils.randomBetween(0.8, 1.5); // Burst for 0.8-1.5 seconds
          enemy.burstCooldown = MathUtils.randomBetween(2.0, 4.0); // Wait 2-4 seconds before next burst
        }
        
        let moveSpeed = 0;
        if (inBurst) {
          // Fast burst movement
          moveSpeed = 140; // Very fast during bursts
          enemy.spiralAngle += deltaTime * 2.0; // Faster spiral during burst
        } else {
          // Slow drift between bursts
          moveSpeed = 30; // Much slower between bursts
          enemy.spiralAngle += deltaTime * 0.5; // Slow spiral drift
        }
        
        // Calculate spiral target position around player
        const spiralTarget = {
          x: playerPosition.x + Math.cos(enemy.spiralAngle) * enemy.spiralRadius,
          y: playerPosition.y + Math.sin(enemy.spiralAngle) * enemy.spiralRadius
        };
        
        // Move toward spiral target
        const direction = {
          x: spiralTarget.x - enemy.position.x,
          y: spiralTarget.y - enemy.position.y
        };
        const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        
        if (distance > 0) {
          const normalized = MathUtils.normalize(direction);
          enemy.velocity.x = normalized.x * moveSpeed;
          enemy.velocity.y = normalized.y * moveSpeed;
          
          // Face movement direction
          enemy.rotation = Math.atan2(direction.x, -direction.y);
        }
        
        // Update position
        enemy.position.x += enemy.velocity.x * deltaTime;
        enemy.position.y += enemy.velocity.y * deltaTime;
        
        // Gradually decrease spiral radius to close in on player (slower)
        if (inBurst) {
          enemy.spiralRadius = Math.max(40, enemy.spiralRadius - deltaTime * 15);
        } else {
          enemy.spiralRadius = Math.max(40, enemy.spiralRadius - deltaTime * 5);
        }
      }
    }
  }

  static createSpaceMonsterDrops(enemy: Enemy): ResourceDrop[] {
    if (!enemy.enemyType || enemy.enemyType === 'normal') {
      return [];
    }
    
    const drops: ResourceDrop[] = [];
    
    // Space monsters drop massive amounts of resources
    // Enough to fill any ship's cargo completely
    const maxPossibleCargo = 80; // Generous amount to fill any ship type
    
    // Drop 60% materials, 40% gems
    const materialCount = Math.floor(maxPossibleCargo * 0.6);
    const gemCount = Math.floor(maxPossibleCargo * 0.4);
    
    console.log(`Space monster defeated! Dropping ${materialCount} materials and ${gemCount} gems!`);
    
    // Create material drops
    for (let i = 0; i < materialCount; i++) {
      drops.push({
        id: MathUtils.generateId(),
        position: {
          x: enemy.position.x + (Math.random() - 0.5) * 120,
          y: enemy.position.y + (Math.random() - 0.5) * 120
        },
        type: 'rawMaterial',
        radius: 6,
        collected: false,
        velocity: {
          x: (Math.random() - 0.5) * 200,
          y: (Math.random() - 0.5) * 200
        }
      });
    }
    
    // Create gem drops
    for (let i = 0; i < gemCount; i++) {
      drops.push({
        id: MathUtils.generateId(),
        position: {
          x: enemy.position.x + (Math.random() - 0.5) * 100,
          y: enemy.position.y + (Math.random() - 0.5) * 100
        },
        type: 'powerGem',
        radius: 8,
        collected: false,
        velocity: {
          x: (Math.random() - 0.5) * 180,
          y: (Math.random() - 0.5) * 180
        }
      });
    }
    
    return drops;
  }

  static isSpaceMonster(enemy: Enemy): boolean {
    return enemy.enemyType !== undefined && enemy.enemyType !== 'normal';
  }

  static stunSpaceMonster(enemy: Enemy, stunDuration: number = 3.0): void {
    if (!this.isSpaceMonster(enemy)) return;
    
    const currentTime = performance.now() / 1000;
    enemy.stunEndTime = currentTime + stunDuration;
    enemy.velocity.x = 0;
    enemy.velocity.y = 0;
    
    console.log(`${enemy.enemyType} space monster stunned for ${stunDuration} seconds!`);
  }

  static isSpaceMonsterStunned(enemy: Enemy): boolean {
    if (!this.isSpaceMonster(enemy) || enemy.stunEndTime === undefined) return false;
    
    const currentTime = performance.now() / 1000;
    return currentTime < enemy.stunEndTime;
  }
}
