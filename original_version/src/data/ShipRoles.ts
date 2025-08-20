import { ShipRole } from '../types/GameTypes';

export const SHIP_ROLES: ShipRole[] = [
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Balanced stats for versatile gameplay. Good energy and moderate cargo capacity.',
    stats: {
      maxEnergy: 100,
      energyRechargeRate: 15,
      maxHullStrength: 100,
      maxCargoMaterials: 30,
      maxCargoGems: 20,
      weaponDamage: 1,
      weaponFireRate: 0.15
    }
  },
  {
    id: 'miner',
    name: 'Miner',
    description: 'High cargo capacity and energy efficiency. Lower combat effectiveness.',
    stats: {
      maxEnergy: 120,
      energyRechargeRate: 20,
      maxHullStrength: 80,
      maxCargoMaterials: 50,
      maxCargoGems: 30,
      weaponDamage: 0.8,
      weaponFireRate: 0.2
    }
  },
  {
    id: 'fighter',
    name: 'Fighter',
    description: 'High damage and fast firing weapons. Strong hull but limited cargo space.',
    stats: {
      maxEnergy: 90,
      energyRechargeRate: 12,
      maxHullStrength: 130,
      maxCargoMaterials: 20,
      maxCargoGems: 15,
      weaponDamage: 1.5,
      weaponFireRate: 0.1
    }
  },
];