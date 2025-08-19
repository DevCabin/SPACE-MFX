export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  rank: string;
  mission: string;
  shipRole: string;
  playTime: number;
  stats: {
    materialsCollected: number;
    asteroidsDestroyed: number;
    enemiesDestroyed: number;
    planetsConquered: number;
    basesBuilt: number;
    spaceMonsterKills: number;
  };
  timestamp: number;
}

export class LeaderboardSystem {
  private static readonly MAX_ENTRIES = 100; // Keep top 100 scores
  private static readonly STORAGE_KEY = 'space-mining-leaderboard';

  static async saveScore(entry: Omit<LeaderboardEntry, 'id' | 'timestamp'>): Promise<boolean> {
    try {
      // Generate unique ID
      const id = this.generateId();
      const timestamp = Date.now();
      
      const fullEntry: LeaderboardEntry = {
        ...entry,
        id,
        timestamp
      };

      // Get existing leaderboard
      const leaderboard = await this.getLeaderboard();
      
      // Add new entry
      leaderboard.push(fullEntry);
      
      // Sort by score (highest first)
      leaderboard.sort((a, b) => b.score - a.score);
      
      // Keep only top entries
      const trimmedLeaderboard = leaderboard.slice(0, this.MAX_ENTRIES);
      
      // Save to localStorage (for now - can be upgraded to API later)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedLeaderboard));
      
      console.log(`Score saved! Rank #${trimmedLeaderboard.findIndex(e => e.id === id) + 1} with ${entry.score} points`);
      return true;
    } catch (error) {
      console.error('Failed to save score:', error);
      return false;
    }
  }

  static async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const leaderboard = JSON.parse(stored) as LeaderboardEntry[];
      return leaderboard.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      return [];
    }
  }

  static async getTopScores(limit: number = 10): Promise<LeaderboardEntry[]> {
    const leaderboard = await this.getLeaderboard();
    return leaderboard.slice(0, limit);
  }

  static async getPlayerRank(score: number): Promise<number> {
    const leaderboard = await this.getLeaderboard();
    const betterScores = leaderboard.filter(entry => entry.score > score);
    return betterScores.length + 1;
  }

  static async getScoreStats(): Promise<{
    totalEntries: number;
    highestScore: number;
    averageScore: number;
    mostPopularMission: string;
    mostPopularRole: string;
  }> {
    const leaderboard = await this.getLeaderboard();
    
    if (leaderboard.length === 0) {
      return {
        totalEntries: 0,
        highestScore: 0,
        averageScore: 0,
        mostPopularMission: 'None',
        mostPopularRole: 'None'
      };
    }

    const totalScore = leaderboard.reduce((sum, entry) => sum + entry.score, 0);
    const averageScore = Math.floor(totalScore / leaderboard.length);
    
    // Find most popular mission
    const missionCounts: Record<string, number> = {};
    const roleCounts: Record<string, number> = {};
    
    leaderboard.forEach(_entry => {
      missionCounts[_entry.mission] = (missionCounts[_entry.mission] || 0) + 1;
      roleCounts[_entry.shipRole] = (roleCounts[_entry.shipRole] || 0) + 1;
    });
    
    const mostPopularMission = Object.keys(missionCounts).reduce((a, b) => 
      missionCounts[a] > missionCounts[b] ? a : b, Object.keys(missionCounts)[0] || 'None'
    );
    
    const mostPopularRole = Object.keys(roleCounts).reduce((a, b) => 
      roleCounts[a] > roleCounts[b] ? a : b, Object.keys(roleCounts)[0] || 'None'
    );

    return {
      totalEntries: leaderboard.length,
      highestScore: leaderboard[0]?.score || 0,
      averageScore,
      mostPopularMission,
      mostPopularRole
    };
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Future: This can be replaced with API calls for Vercel deployment
  static async saveToAPI(_entry: LeaderboardEntry): Promise<boolean> {
    // TODO: Implement API endpoint for Vercel
    // POST /api/leaderboard with entry data
    return false;
  }

  static async loadFromAPI(): Promise<LeaderboardEntry[]> {
    // TODO: Implement API endpoint for Vercel  
    // GET /api/leaderboard
    return [];
  }
}
