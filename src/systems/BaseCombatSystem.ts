import { Planet, Projectile } from '../types/GameTypes';
import { MathUtils } from '../utils/MathUtils';

export class BaseCombatSystem {
  static checkProjectilePlanetCollisions(
    projectiles: Projectile[], 
    planets: Planet[]
  ): { planet: Planet; projectile: Projectile }[] {
    const collisions: { planet: Planet; projectile: Projectile }[] = [];

    for (const projectile of projectiles) {
      if (!projectile.active) continue;

      for (const planet of planets) {
        // Only damage owned planets (unclaimed planets are indestructible for now)
        if (planet.owner === 'none') continue;

        const distance = MathUtils.distance(projectile.position, planet.position);
        if (distance < projectile.radius + planet.radius) {
          collisions.push({ planet, projectile });
          projectile.active = false;
          break; // Projectile can only hit one planet
        }
      }
    }

    return collisions;
  }

  static calculatePlanetDamage(projectile: Projectile): number {
    // Bombs deal massive damage to planets (30), normal projectiles deal standard damage (1)
    if (projectile.type === 'bomb') {
      return 30;
    }
    return projectile.damage || 1;
  }

  static calculatePlanetHP(planet: Planet): { current: number; max: number; baseHP: number; baseCount: number } {
    return {
      current: planet.currentHP,
      max: planet.maxHP,
      baseHP: planet.baseHP,
      baseCount: planet.bases
    };
  }

  static getPlanetHealthRatio(planet: Planet): number {
    return planet.maxHP > 0 ? planet.currentHP / planet.maxHP : 0;
  }

  static isPlanetDestroyed(planet: Planet): boolean {
    return planet.currentHP <= 0;
  }

  static isPlanetDamaged(planet: Planet): boolean {
    return planet.currentHP < planet.maxHP;
  }

  static getPlanetDamageLevel(planet: Planet): 'healthy' | 'damaged' | 'critical' | 'destroyed' {
    const healthRatio = this.getPlanetHealthRatio(planet);
    
    if (healthRatio <= 0) return 'destroyed';
    if (healthRatio <= 0.25) return 'critical';
    if (healthRatio <= 0.75) return 'damaged';
    return 'healthy';
  }

  static getRegenInfo(planet: Planet): { isRegening: boolean; regenRate: number; timeToFull: number } {
    const isRegening = planet.owner !== 'none' && planet.currentHP < planet.maxHP;
    const hpNeeded = planet.maxHP - planet.currentHP;
    const timeToFull = isRegening ? hpNeeded / planet.regenRate : 0;

    return {
      isRegening,
      regenRate: planet.regenRate,
      timeToFull
    };
  }

  static canAddMoreBases(planet: Planet, maxBases: number): boolean {
    return planet.bases < maxBases;
  }

  static getBaseExpansionCost(baseCost: number): number {
    return baseCost;
  }

  static calculateTotalPlanetValue(planet: Planet): number {
    // Strategic value calculation for AI decision making
    let value = 100; // Base value
    value += planet.bases * 50; // Each base adds value
    value += (planet.currentHP / planet.maxHP) * 100; // Health factor
    
    return value;
  }
}