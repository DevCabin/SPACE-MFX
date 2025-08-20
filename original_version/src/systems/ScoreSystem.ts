import { GameState } from '../types/GameTypes';
import { GameTimer, GameTimerSystem } from './GameTimerSystem';

export interface GameStats {
  playTime: number;
  materialsCollected: number;
  asteroidsDestroyed: number;
  enemiesDestroyed: number;
  planetsConquered: number;
  basesBuilt: number;
  spaceMonsterKills: number;
}

export interface ScoreBreakdown {
  timeScore: number;
  materialScore: number;
  asteroidScore: number;
  enemyScore: number;
  planetScore: number;
  baseScore: number;
  monsterBonus: number;
  totalScore: number;
  rank: string;
  rankColor: string;
}

export class ScoreSystem {
  private static readonly WEIGHTS = {
    TIME_MULTIPLIER: 1000, // Base time score
    MATERIAL_WEIGHT: 2,
    ASTEROID_WEIGHT: 5,
    ENEMY_WEIGHT: 10, // Base enemy weight
    ENEMY_MULTIPLIER: 1.3, // 1.3x multiplier for enemies (reduced from 1.5x)
    PLANET_WEIGHT: 25,
    BASE_WEIGHT: 15,
    MONSTER_BONUS: 100 // Bonus per space monster
  };

  private static readonly RANK_THRESHOLDS = [
    { min: 2000, rank: 'COSMIC LEGEND', color: '#ff00ff' },
    { min: 1500, rank: 'FLEET ADMIRAL', color: '#ffaa00' },
    { min: 1200, rank: 'SPACE CAPTAIN', color: '#00aaff' },
    { min: 900, rank: 'STAR PILOT', color: '#00ff00' },
    { min: 600, rank: 'ASTEROID MINER', color: '#6699cc' },
    { min: 300, rank: 'SPACE CADET', color: '#cccccc' },
    { min: 0, rank: 'ROOKIE', color: '#888888' }
  ];

  static calculateScore(stats: GameStats): ScoreBreakdown {
    // Time score - better time = higher score (diminishing returns)
    const timeScore = Math.max(0, this.WEIGHTS.TIME_MULTIPLIER - (stats.playTime * 2));
    
    // Resource and destruction scores
    const materialScore = stats.materialsCollected * this.WEIGHTS.MATERIAL_WEIGHT;
    const asteroidScore = stats.asteroidsDestroyed * this.WEIGHTS.ASTEROID_WEIGHT;
    const enemyScore = Math.floor(stats.enemiesDestroyed * this.WEIGHTS.ENEMY_WEIGHT * this.WEIGHTS.ENEMY_MULTIPLIER);
    const planetScore = stats.planetsConquered * this.WEIGHTS.PLANET_WEIGHT;
    const baseScore = stats.basesBuilt * this.WEIGHTS.BASE_WEIGHT;
    const monsterBonus = stats.spaceMonsterKills * this.WEIGHTS.MONSTER_BONUS;

    const totalScore = Math.floor(
      timeScore + materialScore + asteroidScore + 
      enemyScore + planetScore + baseScore + monsterBonus
    );

    // Determine rank
    const rankInfo = this.RANK_THRESHOLDS.find(threshold => totalScore >= threshold.min) || 
                     this.RANK_THRESHOLDS[this.RANK_THRESHOLDS.length - 1];

    return {
      timeScore: Math.floor(timeScore),
      materialScore,
      asteroidScore,
      enemyScore,
      planetScore,
      baseScore,
      monsterBonus,
      totalScore,
      rank: rankInfo.rank,
      rankColor: rankInfo.color
    };
  }

  static extractStatsFromGameState(gameState: GameState, timer: GameTimer): GameStats {
    const playTime = GameTimerSystem.getElapsedTime(timer);
    
    // Use final stats for enemy counts (tracks all destroyed enemies throughout the game)
    const totalEnemiesDestroyed = gameState.finalStats.enemiesDestroyed;
    const spaceMonsterKills = gameState.finalStats.spaceMonsterKills;

    // Count player-owned planets and bases
    const playerPlanets = gameState.planets.filter(planet => planet.owner === 'player');
    const totalBases = playerPlanets.reduce((sum, planet) => sum + planet.bases, 0);

    return {
      playTime,
      materialsCollected: gameState.ship.cargoMaterials + gameState.finalStats.totalMaterials,
      asteroidsDestroyed: 35 - gameState.asteroids.length, // Assuming 35 starting asteroids
      enemiesDestroyed: totalEnemiesDestroyed,
      planetsConquered: playerPlanets.length,
      basesBuilt: totalBases,
      spaceMonsterKills
    };
  }

  static getScoreDescription(score: number): string {
    if (score >= 2000) return 'Legendary performance! You are a master of space!';
    if (score >= 1500) return 'Outstanding! You command the stars!';
    if (score >= 1200) return 'Excellent work, Captain!';
    if (score >= 900) return 'Great piloting skills!';
    if (score >= 600) return 'Solid mining operation!';
    if (score >= 300) return 'Good effort, Cadet!';
    return 'Keep practicing, Rookie!';
  }
}