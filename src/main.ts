import { Game } from './Game';
import './style.css';

let game: Game | null = null;

function initializeGame() {
  // Get the app container
  const appContainer = document.getElementById('app')!;
  
  // Create canvas and add to DOM
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 768;
  canvas.style.border = '2px solid #333';
  canvas.style.display = 'block';
  canvas.style.margin = '0 auto';

  // Create game container
  const gameContainer = document.createElement('div');
  gameContainer.style.textAlign = 'center';
  gameContainer.style.padding = '20px';

  // Add title and instructions
  const title = document.createElement('h1');
  title.textContent = 'Space MFX (Mine, Fight, Explore!)';
  title.style.color = '#ffffff';
  title.style.fontFamily = 'monospace';

  const instructions = document.createElement('div');
  instructions.innerHTML = `
    <p style="color: #cccccc; font-family: monospace; margin: 10px 0;">
      <strong>WASD/Arrows</strong> - Move (S/Down = Reverse) | <strong>B</strong> - Launch Bombs | <strong>N</strong> - Buy Bombs<br>
      <strong>M</strong> - Toggle Map | <strong>K</strong> - Lightning Weapon (10 gems)<br>
      <strong>U</strong> - Upgrades | <strong>P</strong> - Bot Menu | <strong>Q</strong> - Quit to Title<br>
      <strong>R</strong> - Restart Current Round
    </p>
  `;

  // Add debug info
  const debugInfo = document.createElement('div');
  debugInfo.id = 'debug-info';
  debugInfo.style.color = '#888888';
  debugInfo.style.fontFamily = 'monospace';
  debugInfo.style.fontSize = '12px';
  debugInfo.style.marginTop = '10px';

  // Assemble the page
  gameContainer.appendChild(title);
  gameContainer.appendChild(instructions);
  gameContainer.appendChild(canvas);
  gameContainer.appendChild(debugInfo);

  appContainer.appendChild(gameContainer);

  // Initialize and start the game
  game = new Game(canvas);
  game.start();

  // Debug information update
  setInterval(() => {
    if (game) {
      const gameState = game.getGameState();
      const ship = gameState.ship;
      debugInfo.innerHTML = `
        Game Status: ${gameState.gameStatus} | Lives: ${gameState.lives}<br>
        Ship Position: (${Math.round(ship.position.x)}, ${Math.round(ship.position.y)})<br>
        Ship Velocity: (${Math.round(ship.velocity.x)}, ${Math.round(ship.velocity.y)})<br>
        Asteroids: ${gameState.asteroids.length} | Enemies: ${gameState.enemies.length} | Projectiles: ${gameState.projectiles.length} | Resources: ${gameState.resourceDrops.length}
      `;
    }
  }, 100);

  // Add regenerate button for testing
  const regenButton = document.createElement('button');
  regenButton.textContent = 'Regenerate Asteroids';
  regenButton.style.marginTop = '10px';
  regenButton.style.padding = '10px 20px';
  regenButton.style.fontSize = '14px';
  regenButton.onclick = () => game?.regenerateWorld();
  gameContainer.appendChild(regenButton);
}

function startGame() {
  // Hide title screen
  const titleScreen = document.getElementById('title-screen')!;
  titleScreen.style.transition = 'opacity 0.5s ease-out';
  titleScreen.style.opacity = '0';
  
  setTimeout(() => {
    titleScreen.style.display = 'none';
    
    // Show game container
    const appContainer = document.getElementById('app')!;
    appContainer.style.display = 'block';
    appContainer.style.opacity = '0';
    appContainer.style.transition = 'opacity 0.5s ease-in';
    
    // Initialize the game
    initializeGame();
    
    // Fade in the game
    setTimeout(() => {
      appContainer.style.opacity = '1';
    }, 50);
  }, 500);
}

// Add keyboard handler to title screen
document.addEventListener('DOMContentLoaded', () => {
  const titleScreen = document.getElementById('title-screen')!;
  
  // Add keyboard handler after animations complete
  setTimeout(() => {
    document.addEventListener('keydown', startGame, { once: true });
    titleScreen.style.cursor = 'default';
  }, 4500); // Wait for all animations to complete
});
