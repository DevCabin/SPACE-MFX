export interface Difficulty {
  id: string;
  name: string;
  description: string;
  enemySpawnMultiplier: number; // Multiplier for spawn frequency
  enemyCountMultiplier: number; // Multiplier for enemy count per wave
  cosmicEggMultiplier: number; // Multiplier for cosmic egg count
}

export const DIFFICULTIES: Difficulty[] = [
  {
    id: 'normal',
    name: 'Normal',
    description: 'Standard difficulty. Balanced enemy attacks and moderate space monster encounters.',
    enemySpawnMultiplier: 1.0,
    enemyCountMultiplier: 1.0,
    cosmicEggMultiplier: 1.0
  },
  {
    id: 'hard',
    name: 'Hard',
    description: 'Increased enemy aggression. More frequent attacks and additional space monsters lurking.',
    enemySpawnMultiplier: 0.6, // 40% faster spawns
    enemyCountMultiplier: 1.5, // 50% more enemies per wave
    cosmicEggMultiplier: 1.5 // 50% more cosmic eggs
  },
  {
    id: 'nightmare',
    name: 'Make it Stop!',
    description: 'Relentless assault. Overwhelming enemy forces and space monsters everywhere!',
    enemySpawnMultiplier: 0.4, // 60% faster spawns
    enemyCountMultiplier: 2.0, // Double enemies per wave
    cosmicEggMultiplier: 2.0 // Double cosmic eggs
  }
];