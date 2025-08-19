import { Enemy, Planet, Ship, Vector2D } from '../types/GameTypes';
import { MathUtils } from '../utils/MathUtils';
import { PlanetSystem } from './PlanetSystem';

export class PlanetClaimAISystem {
  private static readonly CLAIM_PRIORITY_DISTANCE = 300;
  private static readonly DEFEND_PRIORITY_DISTANCE = 400;

  static updateEnemyAI(
    enemies: Enemy[], 
    planets: Planet[], 
    playerShip: Ship, 
    _deltaTime: number
  ): { claimAttempts: Enemy[], expansionAttempts: Enemy[] } {
    const claimAttempts: Enemy[] = [];
    const expansionAttempts: Enemy[] = [];

    for (const enemy of enemies) {
      if (!enemy.active) continue;

      // Determine AI state and target
      this.updateAIState(enemy, planets, playerShip);

      // Execute behavior based on state
      switch (enemy.aiState) {
        case 'claiming':
          this.executeClaiming(enemy, planets, claimAttempts);
          break;
        case 'defending':
          this.executeDefending(enemy, planets, playerShip);
          break;
        case 'expanding':
          this.executeExpanding(enemy, planets, expansionAttempts);
          break;
        case 'hunting':
        default:
          this.executeHunting(enemy, playerShip);
          break;
      }
    }

    return { claimAttempts, expansionAttempts };
  }

  private static updateAIState(enemy: Enemy, planets: Planet[], playerShip: Ship): void {
    const unclaimedPlanets = PlanetSystem.getUnclaimedPlanets(planets);
    const enemyPlanets = PlanetSystem.getEnemyPlanets(planets);

    // Priority 1: Defend owned planets under attack
    const threatenedPlanet = this.findThreatenedPlanet(enemyPlanets, playerShip);
    if (threatenedPlanet) {
      enemy.aiState = 'defending';
      enemy.targetPlanetId = threatenedPlanet.id;
      return;
    }

    // Priority 2: Expand existing bases (if we have planets and can expand)
    const expandablePlanet = this.findExpandablePlanet(enemyPlanets, enemy.position);
    if (expandablePlanet && Math.random() < 0.3) { // 30% chance to prioritize expansion
      enemy.aiState = 'expanding';
      enemy.targetPlanetId = expandablePlanet.id;
      return;
    }

    // Priority 3: Claim unclaimed planets
    const nearestUnclaimed = this.findNearestPlanet(unclaimedPlanets, enemy.position);
    if (nearestUnclaimed) {
      const distanceToUnclaimed = MathUtils.distance(enemy.position, nearestUnclaimed.position);
      if (distanceToUnclaimed < this.CLAIM_PRIORITY_DISTANCE) {
        enemy.aiState = 'claiming';
        enemy.targetPlanetId = nearestUnclaimed.id;
        return;
      }
    }

    // Default: Hunt player
    enemy.aiState = 'hunting';
    enemy.targetPlanetId = undefined;
  }

  private static executeClaiming(enemy: Enemy, planets: Planet[], claimAttempts: Enemy[]): void {
    const targetPlanet = planets.find(p => p.id === enemy.targetPlanetId);
    if (!targetPlanet || targetPlanet.owner !== 'none') {
      enemy.aiState = 'hunting';
      return;
    }

    // Move toward planet
    this.moveTowardTarget(enemy, targetPlanet.position);

    // Check if close enough to claim
    const distance = MathUtils.distance(enemy.position, targetPlanet.position);
    if (distance <= targetPlanet.claimRadius) {
      claimAttempts.push(enemy);
    }
  }

  private static executeDefending(enemy: Enemy, planets: Planet[], playerShip: Ship): void {
    const targetPlanet = planets.find(p => p.id === enemy.targetPlanetId);
    if (!targetPlanet || targetPlanet.owner !== 'enemy') {
      enemy.aiState = 'hunting';
      return;
    }

    // Position between planet and player
    const planetToPlayer = {
      x: playerShip.position.x - targetPlanet.position.x,
      y: playerShip.position.y - targetPlanet.position.y
    };
    const normalized = MathUtils.normalize(planetToPlayer);
    const defendPosition = {
      x: targetPlanet.position.x + normalized.x * (targetPlanet.radius + 50),
      y: targetPlanet.position.y + normalized.y * (targetPlanet.radius + 50)
    };

    this.moveTowardTarget(enemy, defendPosition);
  }

  private static executeExpanding(enemy: Enemy, planets: Planet[], expansionAttempts: Enemy[]): void {
    const targetPlanet = planets.find(p => p.id === enemy.targetPlanetId);
    if (!targetPlanet || targetPlanet.owner !== 'enemy' || targetPlanet.bases >= 5) {
      enemy.aiState = 'hunting';
      return;
    }

    // Move toward planet
    this.moveTowardTarget(enemy, targetPlanet.position);

    // Check if close enough to expand
    const distance = MathUtils.distance(enemy.position, targetPlanet.position);
    if (distance <= targetPlanet.claimRadius) {
      expansionAttempts.push(enemy);
    }
  }

  private static executeHunting(enemy: Enemy, playerShip: Ship): void {
    // Default hunting behavior - move toward player
    this.moveTowardTarget(enemy, playerShip.position);
  }

  private static moveTowardTarget(enemy: Enemy, targetPosition: Vector2D): void {
    const direction = {
      x: targetPosition.x - enemy.position.x,
      y: targetPosition.y - enemy.position.y
    };
    const normalized = MathUtils.normalize(direction);

    // Update enemy velocity (this will be used by EnemySystem for actual movement)
    const speed = 80; // Same as EnemySystem.ENEMY_SPEED
    enemy.velocity.x = normalized.x * speed;
    enemy.velocity.y = normalized.y * speed;

    // Update rotation to face target
    enemy.rotation = Math.atan2(direction.x, -direction.y);
  }

  private static findThreatenedPlanet(enemyPlanets: Planet[], playerShip: Ship): Planet | null {
    for (const planet of enemyPlanets) {
      const distance = MathUtils.distance(planet.position, playerShip.position);
      if (distance < this.DEFEND_PRIORITY_DISTANCE) {
        return planet;
      }
    }
    return null;
  }

  private static findExpandablePlanet(enemyPlanets: Planet[], enemyPosition: Vector2D): Planet | null {
    const expandablePlanets = enemyPlanets.filter(p => p.bases < 5);
    return this.findNearestPlanet(expandablePlanets, enemyPosition);
  }

  private static findNearestPlanet(planets: Planet[], position: Vector2D): Planet | null {
    if (planets.length === 0) return null;

    let nearest = planets[0];
    let nearestDistance = MathUtils.distance(position, nearest.position);

    for (let i = 1; i < planets.length; i++) {
      const distance = MathUtils.distance(position, planets[i].position);
      if (distance < nearestDistance) {
        nearest = planets[i];
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  static getAIStateDescription(enemy: Enemy): string {
    switch (enemy.aiState) {
      case 'claiming': return 'Claiming Planet';
      case 'defending': return 'Defending Base';
      case 'expanding': return 'Expanding Base';
      case 'hunting': return 'Hunting Player';
      default: return 'Unknown';
    }
  }
}
