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

  // Method to save game state to leaderboard
  static async saveGameStateToLeaderboard(gameState: any): Promise<boolean | string> {
    if (!gameState || gameState.gameStatus !== 'victory') {
      console.log('Not saving to leaderboard: game not won or invalid state');
      return false;
    }

    const score = gameState.finalStats.asteroidsDestroyed * 10 + 
                  gameState.finalStats.enemiesDestroyed * 15 + 
                  gameState.finalStats.planetsOwned * 50;

    console.log(`Victory detected! Score: ${score}`);

    // Check if score is high enough to be saved
    const leaderboard = await this.getLeaderboard();
    const isTopTenScore = leaderboard.length < 10 || score > (leaderboard[9]?.score || 0);

    console.log(`Is top 10 score: ${isTopTenScore}, Current leaderboard entries: ${leaderboard.length}`);

    if (isTopTenScore) {
      console.log('Prompting for player name...');
      // Prompt for player name
      const playerName = await this.promptPlayerName();
      
      console.log(`Player name entered: ${playerName}`);
      
      if (!playerName) {
        console.log('User cancelled name entry');
        return false; // User cancelled name entry
      }

      const stats: Omit<LeaderboardEntry, 'id' | 'timestamp'> = {
        playerName,
        score,
        rank: '', // Empty string, will be determined by sorting
        mission: gameState.selectedMission?.name || 'Unknown Mission',
        shipRole: gameState.selectedRole?.name || 'Unknown Role',
        playTime: gameState.gameTimer.elapsedTime || 0,
        stats: {
          materialsCollected: gameState.finalStats.totalMaterials || 0,
          asteroidsDestroyed: gameState.finalStats.asteroidsDestroyed || 0,
          enemiesDestroyed: gameState.finalStats.enemiesDestroyed || 0,
          planetsConquered: gameState.finalStats.planetsOwned || 0,
          basesBuilt: gameState.finalStats.basesBuilt || 0,
          spaceMonsterKills: gameState.finalStats.spaceMonsterKills || 0
        }
      };

      const saved = await this.saveScore(stats);
      console.log(`Score saved successfully: ${saved}`);
      return saved;
    }

    console.log('Score not high enough for top 10');
    return false;
  }

  // Method to prompt for player name with editing capability
  private static async promptPlayerName(): Promise<string | null> {
    return new Promise((resolve) => {
      // Create a custom input overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: monospace;
      `;

      const dialog = document.createElement('div');
      dialog.style.cssText = `
        background: #000;
        border: 2px solid #00ff00;
        padding: 30px;
        text-align: center;
        color: #00ff00;
        max-width: 400px;
        width: 90%;
      `;

      const title = document.createElement('h2');
      title.textContent = 'CONGRATULATIONS!';
      title.style.cssText = `
        color: #00ff00;
        margin: 0 0 10px 0;
        font-size: 24px;
      `;

      const subtitle = document.createElement('p');
      subtitle.textContent = 'You achieved a top 10 score!';
      subtitle.style.cssText = `
        color: #ffffff;
        margin: 0 0 20px 0;
        font-size: 16px;
      `;

      const label = document.createElement('p');
      label.textContent = 'Enter your name for the leaderboard:';
      label.style.cssText = `
        color: #ffffff;
        margin: 0 0 10px 0;
        font-size: 14px;
      `;

      const input = document.createElement('input');
      input.type = 'text';
      input.value = 'Anonymous';
      input.maxLength = 7;
      input.style.cssText = `
        background: #000;
        border: 1px solid #00ff00;
        color: #00ff00;
        padding: 8px;
        font-family: monospace;
        font-size: 16px;
        text-align: center;
        width: 150px;
        margin: 0 0 10px 0;
        outline: none;
        cursor: text;
      `;
      
      // Ensure input is focusable and clickable
      input.tabIndex = 0;
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('spellcheck', 'false');

      const charCount = document.createElement('p');
      charCount.style.cssText = `
        color: #cccccc;
        margin: 0 0 20px 0;
        font-size: 12px;
      `;

      const updateCharCount = () => {
        // Enforce 7 character limit
        if (input.value.length > 7) {
          input.value = input.value.substring(0, 7);
        }
        
        const remaining = 7 - input.value.length;
        charCount.textContent = `${input.value.length}/7 characters`;
        charCount.style.color = remaining < 2 ? '#ff4444' : '#cccccc';
      };

      input.addEventListener('input', updateCharCount);
      input.addEventListener('keydown', (e) => {
        // Prevent typing if at character limit (except for backspace, delete, arrow keys, etc.)
        if (input.value.length >= 7 && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab'].includes(e.key)) {
          e.preventDefault();
        }
      });
      input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          submitName();
        } else if (e.key === 'Escape') {
          cancelInput();
        }
      });

      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = `
        display: flex;
        gap: 10px;
        justify-content: center;
      `;

      const submitBtn = document.createElement('button');
      submitBtn.textContent = 'SAVE';
      submitBtn.style.cssText = `
        background: #00ff00;
        color: #000;
        border: none;
        padding: 8px 16px;
        font-family: monospace;
        font-weight: bold;
        cursor: pointer;
        font-size: 14px;
      `;

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'CANCEL';
      cancelBtn.style.cssText = `
        background: #ff4444;
        color: #fff;
        border: none;
        padding: 8px 16px;
        font-family: monospace;
        font-weight: bold;
        cursor: pointer;
        font-size: 14px;
      `;

      const instructions = document.createElement('p');
      instructions.textContent = 'Press ENTER to save, ESC to cancel';
      instructions.style.cssText = `
        color: #888;
        margin: 15px 0 0 0;
        font-size: 12px;
      `;

      const submitName = () => {
        const name = input.value.trim().substring(0, 7);
        document.body.removeChild(overlay);
        resolve(name || 'Anonymous');
      };

      const cancelInput = () => {
        document.body.removeChild(overlay);
        resolve(null);
      };

      submitBtn.addEventListener('click', submitName);
      cancelBtn.addEventListener('click', cancelInput);

      dialog.appendChild(title);
      dialog.appendChild(subtitle);
      dialog.appendChild(label);
      dialog.appendChild(input);
      dialog.appendChild(charCount);
      dialog.appendChild(buttonContainer);
      buttonContainer.appendChild(submitBtn);
      buttonContainer.appendChild(cancelBtn);
      dialog.appendChild(instructions);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      // Focus the input and select all text - multiple attempts for reliability
      const focusInput = () => {
        try {
          input.focus();
          input.select();
          updateCharCount();
          console.log('Input focused and text selected');
        } catch (error) {
          console.error('Failed to focus input:', error);
        }
      };
      
      // Try multiple times to ensure focus works
      setTimeout(focusInput, 50);
      setTimeout(focusInput, 100);
      setTimeout(focusInput, 200);
      
      // Also focus when clicked
      input.addEventListener('click', () => {
        input.focus();
        input.select();
      });
      
      // Force focus when overlay is clicked
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          input.focus();
        }
      });
    });
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
    
    leaderboard.forEach(entry => {
      missionCounts[entry.mission] = (missionCounts[entry.mission] || 0) + 1;
      roleCounts[entry.shipRole] = (roleCounts[entry.shipRole] || 0) + 1;
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
