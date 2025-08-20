import { Asteroid, WorldConfig, Vector2D } from '../types/GameTypes';
import { MathUtils } from '../utils/MathUtils';

export class WorldGenerator {
  static generateAsteroidField(config: WorldConfig, difficultyMultiplier?: number): Asteroid[] {
    const asteroids: Asteroid[] = [];
    const attempts = config.asteroidCount * 10; // Max attempts to prevent infinite loops
    
    for (let i = 0; i < attempts && asteroids.length < config.asteroidCount; i++) {
      const position: Vector2D = {
        x: MathUtils.randomBetween(-config.worldWidth / 2, config.worldWidth / 2),
        y: MathUtils.randomBetween(-config.worldHeight / 2, config.worldHeight / 2)
      };

      // Skip if too close to center (player spawn area)
      if (MathUtils.distance(position, { x: 0, y: 0 }) < 150) {
        continue;
      }

      // Check spacing from existing asteroids
      const tooClose = asteroids.some(asteroid => 
        MathUtils.distance(position, asteroid.position) < config.minSpacing
      );

      if (!tooClose) {
        const radius = MathUtils.randomBetween(config.asteroidSizeMin, config.asteroidSizeMax);
        asteroids.push(this.createAsteroid(position, radius, config));
      }
    }

    // Convert 3-6 random asteroids to cosmic eggs
    this.createCosmicEggs(asteroids, difficultyMultiplier || config.cosmicEggMultiplier || 1.0);
    return asteroids;
  }

  private static createCosmicEggs(asteroids: Asteroid[], multiplier: number = 1.0): void {
    if (asteroids.length < 3) return;
    
    // Apply difficulty multiplier to cosmic egg count
    const baseEggCount = Math.floor(MathUtils.randomBetween(3, 7)); // 3-6 eggs
    const eggCount = Math.max(1, Math.floor(baseEggCount * multiplier));
    const selectedIndices = new Set<number>();
    
    // Randomly select asteroids to become cosmic eggs
    while (selectedIndices.size < Math.min(eggCount, asteroids.length)) {
      const randomIndex = Math.floor(Math.random() * asteroids.length);
      selectedIndices.add(randomIndex);
    }
    
    const monsterTypes: ('spider' | 'centipede' | 'beetle')[] = ['spider', 'centipede', 'beetle'];
    
    selectedIndices.forEach(index => {
      const asteroid = asteroids[index];
      asteroid.isCosmicEgg = true;
      asteroid.monsterType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
      // Cosmic eggs are slightly tougher
      asteroid.health += 2;
      asteroid.maxHealth += 2;
      // Initialize pulse timing with random offset so they don't all pulse together
      asteroid.lastPulseTime = (performance.now() / 1000) + (Math.random() * 11);
      asteroid.pulsePhase = 0;
    });
    
    console.log(`Generated ${selectedIndices.size} cosmic eggs containing space monsters! (${Math.round(multiplier * 100)}% of normal)`);
  }
  private static createAsteroid(position: Vector2D, radius: number, config: WorldConfig): Asteroid {
    // Generate irregular asteroid shape with 6-10 vertices
    const vertexCount = Math.floor(MathUtils.randomBetween(6, 11));
    const vertices: Vector2D[] = [];
    
    for (let i = 0; i < vertexCount; i++) {
      const angle = (i / vertexCount) * Math.PI * 2;
      const variance = MathUtils.randomBetween(0.7, 1.3); // Shape irregularity
      const distance = radius * variance;
      
      vertices.push({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance
      });
    }

    // Calculate health based on asteroid size
    // Small asteroids (15-25): 3 hits
    // Medium asteroids (25-35): 4-5 hits  
    // Large asteroids (35-40): 5-6 hits
    const sizeRatio = (radius - config.asteroidSizeMin) / (config.asteroidSizeMax - config.asteroidSizeMin);
    const minHealth = 3;
    const maxHealth = 6;
    const health = Math.floor(minHealth + (sizeRatio * (maxHealth - minHealth))) + Math.floor(Math.random() * 2);
    const clampedHealth = Math.max(minHealth, Math.min(maxHealth, health));

    return {
      id: MathUtils.generateId(),
      position,
      radius,
      vertices,
      health: clampedHealth,
      maxHealth: clampedHealth,
      dropsPowerGem: Math.random() < config.powerGemDropRate,
      isCosmicEgg: false
    };
  }
}