import { GameState } from '../types/GameTypes';
import { PlanetSystem } from './PlanetSystem';
import { UpgradeSystem } from './UpgradeSystem';
import { BotSystem } from './BotSystem';
import { GameTimerSystem } from './GameTimerSystem';
import { ScoreSystem } from './ScoreSystem';
import { LeaderboardSystem } from './LeaderboardSystem';

export class GameStateSystem {
  static checkShipDestruction(gameState: GameState): void {
    if (gameState.ship.hullStrength <= 0) {
      gameState.lives--;
      
      if (gameState.lives > 0) {
        // Respawn ship
        gameState.ship.hullStrength = gameState.ship.maxHullStrength;
        gameState.ship.energy = gameState.ship.maxEnergy;
        gameState.ship.position = { x: 0, y: 0 };
        gameState.ship.velocity = { x: 0, y: 0 };
        console.log(`Ship destroyed! Lives remaining: ${gameState.lives}`);
      } else {
        // Game over
        this.endGame(gameState, 'gameOver', 'Ship destroyed! No lives remaining.');
      }
    }
  }

  static checkGameEndConditions(gameState: GameState): void {
    if (!gameState.selectedMission) return;
    
    // Check victory conditions based on selected mission
    const mission = gameState.selectedMission;
    
    const playerPlanets = PlanetSystem.getPlayerPlanets(gameState.planets);
    const totalPlanets = gameState.planets.length;
    const allAsteroidsDestroyed = gameState.asteroids.length === 0;
    
    // Check mission-specific victory conditions
    switch (mission.victoryCondition) {
      case 'allPlanetsColonized':
        if (playerPlanets.length === totalPlanets && totalPlanets > 0) {
          this.endGame(gameState, 'victory', 'Mission Complete! All planets colonized!');
          return;
        }
        break;
        
      case 'allAsteroidsMined':
        if (allAsteroidsDestroyed) {
          this.endGame(gameState, 'victory', 'Mission Complete! All asteroids mined!');
          return;
        }
        break;
        
      case 'allEnemiesDefeated':
        // Check if all space monsters are defeated (cosmic eggs destroyed and no space monsters alive)
        const hasCosmicEggs = gameState.asteroids.some(asteroid => asteroid.isCosmicEgg);
        const hasSpaceMonsters = gameState.enemies.some(enemy => 
          enemy.active && enemy.enemyType && enemy.enemyType !== 'normal'
        );
        const hasRegularEnemies = gameState.enemies.some(enemy => 
          enemy.active && (!enemy.enemyType || enemy.enemyType === 'normal')
        );
        
        if (!hasCosmicEggs && !hasSpaceMonsters && !hasRegularEnemies) {
          this.endGame(gameState, 'victory', 'Mission Complete! All threats eliminated!');
          return;
        }
        break;
    }
  }

  static resetGame(gameState: GameState): void {
    gameState.lives = gameState.maxLives;
    gameState.gameStatus = 'playing';
    gameState.gameEndReason = '';
    gameState.ship.hullStrength = gameState.ship.maxHullStrength;
    gameState.ship.energy = gameState.ship.maxEnergy;
    gameState.ship.position = { x: 0, y: 0 };
    gameState.ship.velocity = { x: 0, y: 0 };
    gameState.ship.cargoMaterials = 0;
    gameState.ship.cargoGems = 0;
    gameState.projectiles = [];
    gameState.resourceDrops = [];
    gameState.enemies = [];
    gameState.particles = [];
    gameState.camera = { x: 0, y: 0 };
    gameState.lastEnemySpawn = 0;
    gameState.spaceMonsterWarnings = [];
    gameState.selectedMission = null;
    
    // Reset upgrades and bots
    gameState.upgradeState = UpgradeSystem.createInitialUpgradeState();
    gameState.botState = BotSystem.createInitialBotState();
    
    // Reset final stats
    gameState.finalStats = {
      totalMaterials: 0,
      totalGems: 0,
      asteroidsDestroyed: 0,
      enemiesDestroyed: 0,
      planetsOwned: 0,
      spaceMonsterKills: 0,
      basesBuilt: 0,
      playTime: 0
    };
  }

  private static endGame(gameState: GameState, status: 'victory' | 'gameOver', reason: string): void {
    gameState.gameStatus = status;
    gameState.gameEndReason = reason;
    
    // Stop the timer
    GameTimerSystem.stopTimer(gameState.gameTimer);
    
    // Calculate final stats
    const stats = ScoreSystem.extractStatsFromGameState(gameState, gameState.gameTimer);
    gameState.finalStats = {
      totalMaterials: stats.materialsCollected,
      totalGems: gameState.ship.cargoGems,
      asteroidsDestroyed: stats.asteroidsDestroyed,
      enemiesDestroyed: stats.enemiesDestroyed,
      planetsOwned: stats.planetsConquered,
      spaceMonsterKills: stats.spaceMonsterKills,
      basesBuilt: stats.basesBuilt,
      playTime: stats.playTime
    };
    
    // Save score to leaderboard only on victory
    if (status === 'victory' && gameState.selectedMission) {
      // Use the new method that prompts for username
      LeaderboardSystem.saveGameStateToLeaderboard(gameState);
    }
    
    console.log(`Game ended: ${reason}`);
  }
}
