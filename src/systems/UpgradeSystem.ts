import { Ship, Planet } from '../types/GameTypes';

export interface UpgradeLevel {
  level: number;
  cost: {
    materials: number;
    gems: number;
  };
  benefit: number;
}

export interface ShipUpgrades {
  energyCapacity: number;
  energyRecharge: number;
  hullStrength: number;
  cargoCapacity: number;
  weaponDamage: number;
  weaponFireRate: number;
}

export interface BaseUpgrades {
  hpBonus: number;
  regenBonus: number;
}

export interface UpgradeState {
  shipUpgrades: ShipUpgrades;
  baseUpgrades: BaseUpgrades;
  shipLevel: number;
}

export class UpgradeSystem {
  private static readonly BASE_COSTS = {
    energyCapacity: { materials: 15, gems: 3 },
    energyRecharge: { materials: 12, gems: 4 },
    hullStrength: { materials: 20, gems: 2 },
    cargoCapacity: { materials: 10, gems: 2 },
    weaponDamage: { materials: 25, gems: 5 },
    weaponFireRate: { materials: 18, gems: 4 },
    baseHP: { materials: 30, gems: 5 },
    baseRegen: { materials: 20, gems: 3 }
  };

  private static readonly COST_SCALING = 1.2;
  private static readonly MAX_UPGRADE_LEVEL = 15;

  static createInitialUpgradeState(): UpgradeState {
    return {
      shipUpgrades: {
        energyCapacity: 0,
        energyRecharge: 0,
        hullStrength: 0,
        cargoCapacity: 0,
        weaponDamage: 0,
        weaponFireRate: 0
      },
      baseUpgrades: {
        hpBonus: 0,
        regenBonus: 0
      },
      shipLevel: 1
    };
  }

  static calculateUpgradeCost(upgradeType: keyof typeof UpgradeSystem.BASE_COSTS, currentLevel: number): { materials: number; gems: number } {
    if (currentLevel >= this.MAX_UPGRADE_LEVEL) {
      return { materials: -1, gems: -1 }; // Indicates max level reached
    }

    const baseCost = this.BASE_COSTS[upgradeType];
    const multiplier = Math.pow(this.COST_SCALING, currentLevel);
    
    return {
      materials: Math.ceil(baseCost.materials * multiplier),
      gems: Math.ceil(baseCost.gems * multiplier)
    };
  }

  static canAffordUpgrade(ship: Ship, upgradeType: keyof typeof UpgradeSystem.BASE_COSTS, currentLevel: number): boolean {
    const cost = this.calculateUpgradeCost(upgradeType, currentLevel);
    if (cost.materials === -1) return false; // Max level reached
    
    return ship.cargoMaterials >= cost.materials && ship.cargoGems >= cost.gems;
  }

  static purchaseShipUpgrade(
    ship: Ship, 
    upgradeState: UpgradeState, 
    upgradeType: keyof ShipUpgrades
  ): boolean {
    const currentLevel = upgradeState.shipUpgrades[upgradeType];
    const cost = this.calculateUpgradeCost(upgradeType, currentLevel);
    
    if (cost.materials === -1 || !this.canAffordUpgrade(ship, upgradeType, currentLevel)) {
      return false;
    }

    // Deduct costs
    ship.cargoMaterials -= cost.materials;
    ship.cargoGems -= cost.gems;

    // Apply upgrade
    upgradeState.shipUpgrades[upgradeType]++;
    this.applyShipUpgrades(ship, upgradeState);

    // Update ship level based on total upgrades
    this.updateShipLevel(upgradeState);

    console.log(`Upgraded ${upgradeType} to level ${upgradeState.shipUpgrades[upgradeType]}! Cost: ${cost.materials} materials, ${cost.gems} gems`);
    return true;
  }

  static purchaseBaseUpgrade(
    ship: Ship, 
    upgradeState: UpgradeState, 
    upgradeType: 'baseHP' | 'baseRegen',
    planets: Planet[]
  ): boolean {
    const upgradeKey = upgradeType === 'baseHP' ? 'hpBonus' : 'regenBonus';
    const currentLevel = upgradeState.baseUpgrades[upgradeKey];
    const cost = this.calculateUpgradeCost(upgradeType, currentLevel);
    
    if (cost.materials === -1 || !this.canAffordUpgrade(ship, upgradeType, currentLevel)) {
      return false;
    }

    // Deduct costs
    ship.cargoMaterials -= cost.materials;
    ship.cargoGems -= cost.gems;

    // Apply upgrade
    upgradeState.baseUpgrades[upgradeKey]++;
    this.applyBaseUpgrades(upgradeState, planets);

    // Update ship level based on total upgrades
    this.updateShipLevel(upgradeState);

    console.log(`Upgraded ${upgradeType} to level ${upgradeState.baseUpgrades[upgradeKey]}! Cost: ${cost.materials} materials, ${cost.gems} gems`);
    return true;
  }

  static applyShipUpgrades(ship: Ship, upgradeState: UpgradeState): void {
    // Get base stats from ship's role (we need to store these or calculate from role)
    // For now, we'll assume some reasonable base values and calculate from there
    
    // Energy capacity: +20 per level
    const energyBonus = upgradeState.shipUpgrades.energyCapacity * 20;
    
    // Energy recharge: +3 per level
    const rechargeBonus = upgradeState.shipUpgrades.energyRecharge * 3;
    
    // Hull strength: +25 per level
    const hullBonus = upgradeState.shipUpgrades.hullStrength * 25;
    
    // Cargo capacity: +10 per level
    const cargoBonus = upgradeState.shipUpgrades.cargoCapacity * 10;
    
    // Weapon damage: +0.2 per level
    const damageBonus = upgradeState.shipUpgrades.weaponDamage * 0.2;
    
    // Weapon fire rate: -0.02 per level (faster firing)
    const fireRateBonus = upgradeState.shipUpgrades.weaponFireRate * 0.02;

    // Apply bonuses to base stats (don't stack on current values)
    // We need to calculate from base values to avoid corruption
    // This is a temporary fix - ideally we'd store base stats
    const currentEnergyRatio = ship.energy / ship.maxEnergy;
    const currentHullRatio = ship.hullStrength / ship.maxHullStrength;
    
    // Apply upgrades (only if this is the first time applying or we have a clean state)
    if (upgradeState.shipUpgrades.energyCapacity > 0) {
      ship.maxEnergy = Math.max(ship.maxEnergy, 100 + energyBonus); // Assume base 100
      ship.energy = ship.maxEnergy * currentEnergyRatio;
    }
    
    if (upgradeState.shipUpgrades.energyRecharge > 0) {
      ship.energyRechargeRate = Math.max(ship.energyRechargeRate, 15 + rechargeBonus); // Assume base 15
    }
    
    if (upgradeState.shipUpgrades.hullStrength > 0) {
      ship.maxHullStrength = Math.max(ship.maxHullStrength, 100 + hullBonus); // Assume base 100
      ship.hullStrength = ship.maxHullStrength * currentHullRatio;
    }
    
    if (upgradeState.shipUpgrades.cargoCapacity > 0) {
      ship.maxCargoMaterials = Math.max(ship.maxCargoMaterials, 20 + Math.floor(cargoBonus * 0.6)); // Assume base 20
      ship.maxCargoGems = Math.max(ship.maxCargoGems, 10 + Math.floor(cargoBonus * 0.4)); // Assume base 10
    }
    
    if (upgradeState.shipUpgrades.weaponDamage > 0) {
      ship.weaponDamage = Math.max(ship.weaponDamage, 1 + damageBonus); // Assume base 1
    }
    
    if (upgradeState.shipUpgrades.weaponFireRate > 0) {
      ship.weaponFireRate = Math.max(0.05, Math.min(ship.weaponFireRate, 0.3 - fireRateBonus)); // Assume base 0.3s
    }
  }

  static applyBaseUpgrades(upgradeState: UpgradeState, planets: Planet[]): void {
    const hpBonus = upgradeState.baseUpgrades.hpBonus * 15; // +15 HP per level
    const regenBonus = upgradeState.baseUpgrades.regenBonus * 2; // +2 regen per level

    for (const planet of planets) {
      if (planet.owner === 'player') {
        // Apply HP bonus to max HP
        const baseMaxHP = 100 + (planet.bases * 25); // Original calculation
        planet.maxHP = baseMaxHP + hpBonus;
        
        // Apply regen bonus
        planet.regenRate = 5 + regenBonus; // Base 5 + bonus
        
        // Heal planet if current HP is below new max
        if (planet.currentHP < planet.maxHP) {
          planet.currentHP = Math.min(planet.maxHP, planet.currentHP + hpBonus);
        }
      }
    }
  }

  static getUpgradeBenefit(upgradeType: keyof ShipUpgrades | 'baseHP' | 'baseRegen'): string {
    switch (upgradeType) {
      case 'energyCapacity': return '+20 Energy Capacity';
      case 'energyRecharge': return '+3 Energy Recharge Rate';
      case 'hullStrength': return '+25 Hull Strength';
      case 'cargoCapacity': return '+10 Cargo Capacity';
      case 'weaponDamage': return '+0.2 Weapon Damage';
      case 'weaponFireRate': return '-0.02s Fire Rate (faster)';
      case 'baseHP': return '+15 Base HP per Planet';
      case 'baseRegen': return '+2 Base Regen per Planet';
      default: return 'Unknown Upgrade';
    }
  }

  static isMaxLevel(upgradeState: UpgradeState, upgradeType: keyof ShipUpgrades | 'baseHP' | 'baseRegen'): boolean {
    if (upgradeType === 'baseHP') {
      return upgradeState.baseUpgrades.hpBonus >= this.MAX_UPGRADE_LEVEL;
    } else if (upgradeType === 'baseRegen') {
      return upgradeState.baseUpgrades.regenBonus >= this.MAX_UPGRADE_LEVEL;
    } else {
      return upgradeState.shipUpgrades[upgradeType as keyof ShipUpgrades] >= this.MAX_UPGRADE_LEVEL;
    }
  }

  static updateShipLevel(upgradeState: UpgradeState): void {
    // Calculate total upgrade levels
    const shipUpgrades = upgradeState.shipUpgrades;
    const totalShipUpgrades = shipUpgrades.energyCapacity + shipUpgrades.energyRecharge + 
                             shipUpgrades.hullStrength + shipUpgrades.cargoCapacity + 
                             shipUpgrades.weaponDamage + shipUpgrades.weaponFireRate;
    
    const baseUpgrades = upgradeState.baseUpgrades;
    const totalBaseUpgrades = baseUpgrades.hpBonus + baseUpgrades.regenBonus;
    
    const totalUpgrades = totalShipUpgrades + totalBaseUpgrades;
    upgradeState.shipLevel = Math.floor(totalUpgrades / 3) + 1; // Every 3 upgrades = 1 level
  }
}
