import { Ship, Asteroid, Vector2D, Projectile } from '../types/GameTypes';
import { Enemy } from '../types/GameTypes';
import { MathUtils } from '../utils/MathUtils';

export class CollisionSystem {
  static checkShipAsteroidCollision(ship: Ship, asteroids: Asteroid[]): Asteroid | null {
    for (const asteroid of asteroids) {
      if (this.circleCollision(ship.position, ship.radius, asteroid.position, asteroid.radius)) {
        return asteroid;
      }
    }
    return null;
  }

  static checkShipEnemyCollision(ship: Ship, enemies: Enemy[]): Enemy | null {
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      
      if (this.circleCollision(ship.position, ship.radius, enemy.position, enemy.radius)) {
        return enemy;
      }
    }
    return null;
  }

  static checkShipProjectileCollision(ship: Ship, projectiles: Projectile[]): Projectile[] {
    const hitProjectiles: Projectile[] = [];

    for (const projectile of projectiles) {
      if (!projectile.active) continue;
      
      // Skip projectiles that belong to the player (assuming player projectiles have higher damage)
      if (projectile.damage >= 1) continue; // Player projectiles typically have damage >= 1
      
      if (this.circleCollision(ship.position, ship.radius, projectile.position, projectile.radius)) {
        hitProjectiles.push(projectile);
        projectile.active = false;
      }
    }

    return hitProjectiles;
  }

  private static circleCollision(
    pos1: Vector2D, 
    radius1: number, 
    pos2: Vector2D, 
    radius2: number
  ): boolean {
    const distance = MathUtils.distance(pos1, pos2);
    return distance < (radius1 + radius2);
  }

  static resolveShipEnemyCollision(ship: Ship, enemy: Enemy): { enemyDestroyed: boolean; shipDestroyed: boolean } {
    // Check if ship is invincible
    if (ship.isInvincible) {
      console.log('Ship is invincible - no collision damage!');
      return { enemyDestroyed: false, shipDestroyed: false };
    }
    
    // Check if this is a space monster in grace period
    if (enemy.enemyType && enemy.enemyType !== 'normal' && enemy.graceEndTime) {
      const currentTime = performance.now() / 1000;
      if (currentTime < enemy.graceEndTime) {
        // Grace period - bounce off harmlessly
        const dx = ship.position.x - enemy.position.x;
        const dy = ship.position.y - enemy.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          const normalX = dx / distance;
          const normalY = dy / distance;
          
          // Push ship away gently
          const pushForce = 100;
          ship.velocity.x += normalX * pushForce;
          ship.velocity.y += normalY * pushForce;
          
          console.log('Bounced off space monster during grace period!');
        }
        
        return { enemyDestroyed: false, shipDestroyed: false };
      }
    }
    
    // Enemy is always destroyed on collision
    enemy.active = false;
    
    // Ship loses 1/3 of energy
    const energyLoss = ship.maxEnergy / 3;
    ship.energy -= energyLoss;
    
    // Check if ship should be destroyed (energy < 1/3 of max)
    const shipDestroyed = ship.energy < (ship.maxEnergy / 3);
    
    if (shipDestroyed) {
      ship.hullStrength = 0; // This will trigger ship destruction in game logic
    }
    
    console.log(`Ship-Enemy collision! Energy lost: ${Math.round(energyLoss)}, Remaining: ${Math.round(ship.energy)}`);
    if (shipDestroyed) {
      console.log('Ship destroyed due to low energy!');
    }
    
    return { enemyDestroyed: true, shipDestroyed };
  }

  static resolveShipAsteroidCollision(ship: Ship, asteroid: Asteroid): void {
    // Calculate collision normal
    const dx = ship.position.x - asteroid.position.x;
    const dy = ship.position.y - asteroid.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return;
    
    const normalX = dx / distance;
    const normalY = dy / distance;
    
    // Push ship away from asteroid
    const overlap = (ship.radius + asteroid.radius) - distance;
    ship.position.x += normalX * overlap;
    ship.position.y += normalY * overlap;
    
    // Reflect velocity
    const dotProduct = ship.velocity.x * normalX + ship.velocity.y * normalY;
    ship.velocity.x -= 2 * dotProduct * normalX * 0.8; // 0.8 for some energy loss
    ship.velocity.y -= 2 * dotProduct * normalY * 0.8;
    
    // Take damage
    const impactForce = Math.sqrt(ship.velocity.x ** 2 + ship.velocity.y ** 2);
    const damage = Math.min(impactForce * 0.05, 8); // Reduced collision damage
    ship.hullStrength = Math.max(0, ship.hullStrength - damage);
  }

  static resolveShipProjectileHit(ship: Ship, projectile: Projectile): void {
    // Check if ship is invincible
    if (ship.isInvincible) {
      console.log('Ship is invincible - no projectile damage!');
      return;
    }
    
    // Enemy projectiles damage hull directly
    const damage = projectile.damage * 20 || 10; // Scale up enemy projectile damage for hull
    ship.hullStrength = Math.max(0, ship.hullStrength - damage);
    
    console.log(`Ship hit by enemy projectile! Hull damage: ${damage}, Hull remaining: ${Math.round(ship.hullStrength)}`);
    
    if (ship.hullStrength <= 0) {
      console.log('Ship destroyed by enemy fire!');
    }
  }
}