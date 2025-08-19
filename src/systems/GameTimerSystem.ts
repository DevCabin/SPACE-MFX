import { GameState } from '../types/GameTypes';

export interface GameTimer {
  startTime: number;
  endTime: number | null;
  isRunning: boolean;
}

export class GameTimerSystem {
  static createTimer(): GameTimer {
    return {
      startTime: performance.now() / 1000,
      endTime: null,
      isRunning: true
    };
  }

  static stopTimer(timer: GameTimer): void {
    if (timer.isRunning) {
      timer.endTime = performance.now() / 1000;
      timer.isRunning = false;
    }
  }

  static getElapsedTime(timer: GameTimer): number {
    if (timer.isRunning) {
      return (performance.now() / 1000) - timer.startTime;
    } else {
      return (timer.endTime || timer.startTime) - timer.startTime;
    }
  }

  static formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  static formatDetailedTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }
}