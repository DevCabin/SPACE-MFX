import { Ship } from '../types/GameTypes';
import { MathUtils } from '../utils/MathUtils';
import { ShipRole } from '../types/GameTypes';

export interface ShipInput {
  thrust: boolean;
  rotateLeft: boolean;
  rotateRight: boolean;
  fire: boolean;
  bomb: boolean;
  buyBomb: boolean;
  emergencyMelee: boolean;
  reverse: boolean;
  mousePosition?: { x: number; y: number };
}

export class ShipSystem {
  private static readonly THRUST_POWER = 300;
  private static readonly MAX_VELOCITY = 600;
  private static readonly ROTATION_SPEED = 4;
  private static readonly ENERGY_DRAIN_MOVE = 2;
  private static readonly ENERGY_DRAIN_FIRE = 10;
  private static readonly FRICTION = 0.99;
  private static readonly MELEE_GEM_COST = 10;
  private static readonly MELEE_INVINCIBILITY_DURATION = 1.5; // seconds
  private static readonly MELEE_WARNING_DURATION = 2.0; // Warning lasts longer than weapon

  static createShip(role?: ShipRole): Ship {
    const stats = role?.stats || {
      maxEnergy: 100,
      energyRechargeRate: 15,
      maxHullStrength: 100,
      maxCargoMaterials: 30,
      maxCargoGems: 20,
      weaponDamage: 1,
      weaponFireRate: 0.15
    };

    return {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      rotation: 0,
      radius: 12,
      energy: stats.maxEnergy,
      maxEnergy: stats.maxEnergy,
      energyRechargeRate: stats.energyRechargeRate,
      hullStrength: stats.maxHullStrength,
      maxHullStrength: stats.maxHullStrength,
      cargoMaterials: 0,
      cargoGems: 0,
      maxCargoMaterials: stats.maxCargoMaterials,
      maxCargoGems: stats.maxCargoGems,
      weaponDamage: stats.weaponDamage,
      weaponFireRate: stats.weaponFireRate,
      lastFireTime: 0,
      bombs: 3,
      maxBombs: 10,
      isInvincible: false,
      invincibilityEndTime: 0,
      meleeCharging: false,
      meleeChargeStartTime: 0,
      meleeWarningEndTime: 0,
      isOutOfBounds: false
    };
  }

  static updateShip(ship: Ship, input: ShipInput, deltaTime: number): void {
    const currentTime = performance.now() / 1000;
    
    // Update invincibility status
    if (ship.isInvincible && currentTime >= ship.invincibilityEndTime) {
      ship.isInvincible = false;
      console.log('Invincibility ended');
    }
    
    // Handle rotation - keyboard only for now
    if (input.rotateLeft) {
      ship.rotation -= this.ROTATION_SPEED * deltaTime;
    }
    if (input.rotateRight) {
      ship.rotation += this.ROTATION_SPEED * deltaTime;
    }

    // Handle thrust
    if (input.thrust && ship.energy > 0) {
      const thrustVector = MathUtils.rotate(
        { x: 0, y: -this.THRUST_POWER },
        ship.rotation
      );
      
      ship.velocity.x += thrustVector.x * deltaTime;
      ship.velocity.y += thrustVector.y * deltaTime;
      
      // Drain energy
      ship.energy = Math.max(0, ship.energy - this.ENERGY_DRAIN_MOVE * deltaTime);
    }

    // Handle reverse thrust
    if (input.reverse && ship.energy > 0) {
      const reverseVector = MathUtils.rotate(
        { x: 0, y: this.THRUST_POWER * 0.7 }, // 70% power for reverse
        ship.rotation
      );
      
      ship.velocity.x += reverseVector.x * deltaTime;
      ship.velocity.y += reverseVector.y * deltaTime;
      
      // Drain energy (same as forward thrust)
      ship.energy = Math.max(0, ship.energy - this.ENERGY_DRAIN_MOVE * deltaTime);
    }

    // Apply velocity limits
    const speed = Math.sqrt(ship.velocity.x ** 2 + ship.velocity.y ** 2);
    if (speed > this.MAX_VELOCITY) {
      const normalized = MathUtils.normalize(ship.velocity);
      ship.velocity.x = normalized.x * this.MAX_VELOCITY;
      ship.velocity.y = normalized.y * this.MAX_VELOCITY;
    }

    // Apply friction
    ship.velocity.x *= this.FRICTION;
    ship.velocity.y *= this.FRICTION;

    // Update position
    ship.position.x += ship.velocity.x * deltaTime;
    ship.position.y += ship.velocity.y * deltaTime;

    // Slowly regenerate energy
    ship.energy = Math.min(ship.maxEnergy, ship.energy + ship.energyRechargeRate * deltaTime);
  }

  static updatePassiveGeneration(ship: Ship, planets: any[], deltaTime: number): void {
    // Generate raw materials from owned planetary bases
    const playerPlanets = planets.filter(planet => planet.owner === 'player');
    
    if (playerPlanets.length > 0) {
      // Calculate total material generation rate based on owned bases
      let totalMaterialGenRate = 0;
      for (const planet of playerPlanets) {
        // Each base generates 0.5 materials per second (1 material every 2 seconds)
        totalMaterialGenRate += planet.bases * 0.5;
      }
      
      // Only generate if we have cargo space for materials
      if (ship.cargoMaterials < ship.maxCargoMaterials) {
        const materialsToAdd = totalMaterialGenRate * deltaTime;
        const actualMaterialsAdded = Math.min(
          materialsToAdd,
          ship.maxCargoMaterials - ship.cargoMaterials
        );
        
        ship.cargoMaterials += actualMaterialsAdded;
      }
    }
  }
  static canFire(ship: Ship, currentTime: number): boolean {
    return ship.energy >= this.ENERGY_DRAIN_FIRE && 
           (currentTime - ship.lastFireTime) >= ship.weaponFireRate &&
           !ship.meleeCharging && // Don't fire normal weapons while charging melee
           !ship.isOutOfBounds; // Don't fire weapons outside map boundary
  }

  static consumeFireEnergy(ship: Ship, currentTime: number): void {
    ship.energy -= this.ENERGY_DRAIN_FIRE;
    ship.lastFireTime = currentTime;
  }


  static addResource(ship: Ship, resourceType: 'rawMaterial' | 'powerGem'): boolean {
    if (resourceType === 'rawMaterial') {
      // First priority: repair hull if damaged
      if (ship.hullStrength < ship.maxHullStrength) {
        const repairAmount = 10; // Each raw material repairs 10 hull points
        const actualRepair = Math.min(repairAmount, ship.maxHullStrength - ship.hullStrength);
        ship.hullStrength += actualRepair;
        console.log(`Hull repaired! +${actualRepair} hull strength (${Math.round(ship.hullStrength)}/${ship.maxHullStrength})`);
        return true;
      }
      // If hull is full, add to cargo
      else {
        // Check total cargo space instead of just material limit
        const totalCargo = ship.cargoMaterials + ship.cargoGems;
        const totalCapacity = ship.maxCargoMaterials + ship.maxCargoGems;
        if (totalCargo >= totalCapacity) {
          console.log(`Cannot collect material: total cargo full (${totalCargo}/${totalCapacity})`);
          return false;
        }
        ship.cargoMaterials++;
        console.log(`Material collected! Materials: ${ship.cargoMaterials}, Total cargo: ${totalCargo + 1}/${totalCapacity}`);
      }
    } else if (resourceType === 'powerGem') {
      // If energy is below 50%, use power gem to refill energy
      if (ship.energy < ship.maxEnergy * 0.5) {
        ship.energy = ship.maxEnergy; // Fill to 100%
        console.log('Power gem used to refill energy!');
      } else {
        // Otherwise add to cargo if there's space
        const totalCargo = ship.cargoMaterials + ship.cargoGems;
        const totalCapacity = ship.maxCargoMaterials + ship.maxCargoGems;
        if (totalCargo >= totalCapacity) {
          console.log(`Cannot collect gem: total cargo full (${totalCargo}/${totalCapacity})`);
          return false;
        }
        ship.cargoGems++;
        console.log(`Power gem collected! Gems: ${ship.cargoGems}, Total cargo: ${totalCargo + 1}/${totalCapacity}`);
      }
    }
    return true;
  }

  static getTotalCargoSpace(ship: Ship): number {
    return ship.maxCargoMaterials + ship.maxCargoGems;
  }

  static canLaunchBomb(ship: Ship): boolean {
    return ship.bombs > 0 && !ship.isOutOfBounds;
  }

  static canBuyBomb(ship: Ship): boolean {
    return ship.bombs < ship.maxBombs && ship.cargoMaterials >= 10;
  }

  static launchBomb(ship: Ship): void {
    if (ship.bombs > 0) {
      ship.bombs--;
    }
  }

  static buyBomb(ship: Ship): boolean {
    if (ship.cargoMaterials >= 10 && ship.bombs < ship.maxBombs) {
      ship.cargoMaterials -= 10;
      ship.bombs++;
      return true;
    }
    return false;
  }

  static canUseMeleeWeapon(ship: Ship): boolean {
    return ship.cargoGems >= this.MELEE_GEM_COST && !ship.meleeCharging && !ship.isOutOfBounds;
  }

  static activateMeleeWeapon(ship: Ship): boolean {
    if (!this.canUseMeleeWeapon(ship)) {
      return false;
    }

    const currentTime = performance.now() / 1000;
    
    // Consume gems
    ship.cargoGems -= this.MELEE_GEM_COST;
    
    // Activate invincibility and charging state
    ship.isInvincible = true;
    ship.meleeCharging = true;
    ship.meleeChargeStartTime = currentTime;
    ship.invincibilityEndTime = currentTime + this.MELEE_INVINCIBILITY_DURATION;
    ship.meleeWarningEndTime = currentTime + this.MELEE_WARNING_DURATION;
    
    console.log(`Emergency Melee activated! Invincible for ${this.MELEE_INVINCIBILITY_DURATION} seconds. Gems: ${ship.cargoGems}`);
    return true;
  }

  static isMeleeReady(ship: Ship): boolean {
    if (!ship.meleeCharging) return false;
    
    const currentTime = performance.now() / 1000;
    const chargeTime = currentTime - ship.meleeChargeStartTime;
    return chargeTime >= this.MELEE_INVINCIBILITY_DURATION;
  }
}
