import { GameState, Asteroid, Ship, Vector2D, Difficulty } from '../types/GameTypes';
import { CameraSystem } from './CameraSystem';
import { UISystem } from './UISystem';
import { GameTimerSystem } from './GameTimerSystem';
import { ScoreSystem } from './ScoreSystem';


export class RenderSystem {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private showMinimap: boolean = false;
  private currentGameState: GameState | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  toggleMinimap(): void {
    this.showMinimap = !this.showMinimap;
  }

  isMinimapVisible(): boolean {
    return this.showMinimap;
  }
  render(gameState: GameState): void {
    this.currentGameState = gameState; // Store for UI access
    this.clearScreen();
    
    if (gameState.gameStatus === 'playing') {
      this.renderAsteroids(gameState.asteroids, gameState.camera);
      this.renderPlanets(gameState.planets, gameState.camera);
      this.renderProjectiles(gameState.projectiles, gameState.camera);
      this.renderResourceDrops(gameState.resourceDrops, gameState.camera);
      this.renderEnemies(gameState.enemies, gameState.camera);
      this.renderParticles(gameState.particles, gameState.camera);
      this.renderShip(gameState.ship, gameState.camera);
      this.renderLightningEffects(gameState.ship, gameState.camera);
      this.renderBots(gameState.botState.bots, gameState.camera);
      this.renderShipLevelIndicator(gameState.ship, gameState.upgradeState);
      this.renderUI(gameState.ship, gameState.lives);
      this.renderBotHUD(gameState.botState);
      this.renderUpgradeMenu(gameState.ship, gameState.upgradeState);
      this.renderBotMenu(gameState.ship, gameState.botState);
      this.renderSpaceMonsterWarnings(gameState.spaceMonsterWarnings);
      this.renderBoundaryWarning(this.ctx, this.canvas, gameState.ship);
      
      if (this.showMinimap) {
        this.renderMinimap(gameState);
      }
    } else {
      this.renderEndScreen(gameState);
    }
  }

  private clearScreen(): void {
    this.ctx.fillStyle = '#000011';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Add some stars for atmosphere
    this.renderStars();
  }

  private renderStars(): void {
    this.ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      const x = (i * 37) % this.canvas.width;
      const y = (i * 73) % this.canvas.height;
      this.ctx.fillRect(x, y, 1, 1);
    }
  }

  private renderAsteroids(asteroids: Asteroid[], camera: Vector2D): void {
    this.ctx.lineWidth = 2;

    for (const asteroid of asteroids) {
      const screenPos = CameraSystem.worldToScreen(asteroid.position, camera, this.canvas);
      
      // Only render if on screen (with margin)
      if (this.isOnScreen(screenPos, asteroid.radius)) {
        // Color based on health
        const healthRatio = asteroid.health / asteroid.maxHealth;
        if (healthRatio > 0.66) {
          this.ctx.strokeStyle = '#888888';
        } else if (healthRatio > 0.33) {
          this.ctx.strokeStyle = '#aa6600';
        } else {
          this.ctx.strokeStyle = '#cc3300';
        }
        
        this.ctx.beginPath();
        
        for (let i = 0; i < asteroid.vertices.length; i++) {
          const vertex = asteroid.vertices[i];
          const vertexWorld = {
            x: asteroid.position.x + vertex.x,
            y: asteroid.position.y + vertex.y
          };
          const vertexScreen = CameraSystem.worldToScreen(vertexWorld, camera, this.canvas);
          
          if (i === 0) {
            this.ctx.moveTo(vertexScreen.x, vertexScreen.y);
          } else {
            this.ctx.lineTo(vertexScreen.x, vertexScreen.y);
          }
        }
        
        this.ctx.closePath();
        this.ctx.stroke();
      }
    }
  }

  private renderPlanets(planets: any[], camera: Vector2D): void {
    for (const planet of planets) {
      const screenPos = CameraSystem.worldToScreen(planet.position, camera, this.canvas);
      
      // Only render if on screen (with margin)
      if (this.isOnScreen(screenPos, planet.radius)) {
        // Planet body
        this.ctx.save();
        this.ctx.translate(screenPos.x, screenPos.y);
        
        // Main planet circle
        this.ctx.beginPath();
        this.ctx.arc(0, 0, planet.radius, 0, Math.PI * 2);
        
        // Color based on ownership
        if (planet.owner === 'none') {
          this.ctx.fillStyle = '#444444';
          this.ctx.strokeStyle = '#666666';
        } else if (planet.owner === 'player') {
          this.ctx.fillStyle = '#004400';
          this.ctx.strokeStyle = '#00aa00';
        } else { // enemy
          this.ctx.fillStyle = '#440000';
          this.ctx.strokeStyle = '#aa0000';
        }
        
        this.ctx.fill();
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Damage visualization
        if (planet.owner !== 'none' && planet.currentHP < planet.maxHP) {
          const healthRatio = planet.currentHP / planet.maxHP;
          if (healthRatio < 0.75) {
            // Add cracks/damage effects
            this.ctx.strokeStyle = '#ff4444';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            for (let i = 0; i < 3; i++) {
              const angle = (i / 3) * Math.PI * 2;
              const startRadius = planet.radius * 0.3;
              const endRadius = planet.radius * 0.9;
              this.ctx.moveTo(Math.cos(angle) * startRadius, Math.sin(angle) * startRadius);
              this.ctx.lineTo(Math.cos(angle) * endRadius, Math.sin(angle) * endRadius);
            }
            this.ctx.stroke();
          }
        }
        
        // Base indicators (orbiting stations)
        if (planet.bases > 0) {
          const baseColor = planet.owner === 'player' ? '#00ff00' : '#ff4444';
          this.ctx.fillStyle = baseColor;
          this.ctx.strokeStyle = baseColor;
          
          for (let i = 0; i < planet.bases; i++) {
            const angle = (i / Math.max(planet.bases, 1)) * Math.PI * 2;
            const orbitRadius = planet.radius + 15;
            const baseX = Math.cos(angle) * orbitRadius;
            const baseY = Math.sin(angle) * orbitRadius;
            
            // Small base station
            this.ctx.beginPath();
            this.ctx.arc(baseX, baseY, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Connection line to planet
            this.ctx.beginPath();
            this.ctx.moveTo(Math.cos(angle) * planet.radius, Math.sin(angle) * planet.radius);
            this.ctx.lineTo(baseX, baseY);
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
          }
        }
        
        // HP bar for owned planets
        if (planet.owner !== 'none') {
          const barWidth = planet.radius * 1.5;
          const barHeight = 6;
          const barY = -planet.radius - 20;
          
          // Background
          this.ctx.fillStyle = '#222222';
          this.ctx.fillRect(-barWidth/2, barY, barWidth, barHeight);
          
          // HP fill
          const healthRatio = planet.currentHP / planet.maxHP;
          const fillWidth = barWidth * healthRatio;
          this.ctx.fillStyle = healthRatio > 0.5 ? '#00aa00' : healthRatio > 0.25 ? '#aaaa00' : '#aa0000';
          this.ctx.fillRect(-barWidth/2, barY, fillWidth, barHeight);
          
          // Border
          this.ctx.strokeStyle = '#666666';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(-barWidth/2, barY, barWidth, barHeight);
          
          // HP text
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = '10px monospace';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(`${Math.ceil(planet.currentHP)}/${planet.maxHP}`, 0, barY - 3);
          
          // Base count
          if (planet.bases > 0) {
            this.ctx.fillText(`${planet.bases} base${planet.bases > 1 ? 's' : ''}`, 0, barY + barHeight + 12);
          }
        }
        
        this.ctx.restore();
      }
    }
  }

  private renderProjectiles(projectiles: any[], camera: Vector2D): void {
    for (const projectile of projectiles) {
      if (!projectile.active) continue;
      
      const screenPos = CameraSystem.worldToScreen(projectile.position, camera, this.canvas);
      
      if (this.isOnScreen(screenPos, projectile.radius)) {
        // Different colors for different projectile types
        if (projectile.type === 'bomb') {
          this.ctx.fillStyle = '#ff4400';
          this.ctx.strokeStyle = '#ff8800';
          this.ctx.lineWidth = 2;
          
          // Bomb with glow effect
          this.ctx.beginPath();
          this.ctx.arc(screenPos.x, screenPos.y, projectile.radius, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();
          
          // Inner core
          this.ctx.fillStyle = '#ffff00';
          this.ctx.beginPath();
          this.ctx.arc(screenPos.x, screenPos.y, projectile.radius - 1, 0, Math.PI * 2);
          this.ctx.fill();
        } else {
          // Normal projectile
          this.ctx.fillStyle = '#ffff00';
          this.ctx.beginPath();
          this.ctx.arc(screenPos.x, screenPos.y, projectile.radius, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }
  }

  private renderResourceDrops(resourceDrops: any[], camera: Vector2D): void {
    for (const resource of resourceDrops) {
      if (resource.collected) continue;
      
      const screenPos = CameraSystem.worldToScreen(resource.position, camera, this.canvas);
      
      if (this.isOnScreen(screenPos, resource.radius)) {
        if (resource.type === 'rawMaterial') {
          this.ctx.fillStyle = '#6699cc';
        } else if (resource.type === 'powerGem') {
          this.ctx.fillStyle = '#ff8800';
        }
        
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, resource.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add a glow effect
        this.ctx.strokeStyle = this.ctx.fillStyle;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, resource.radius + 2, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }
  }

  private renderEnemies(enemies: any[], camera: Vector2D): void {
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      
      const screenPos = CameraSystem.worldToScreen(enemy.position, camera, this.canvas);
      
      if (this.isOnScreen(screenPos, enemy.radius)) {
        this.ctx.save();
        this.ctx.translate(screenPos.x, screenPos.y);
        this.ctx.rotate(enemy.rotation);
        
        if (enemy.enemyType && enemy.enemyType !== 'normal') {
          // Space monster rendering
          this.renderSpaceMonster(enemy);
        } else {
          // Normal enemy ship body (diamond shape)
          this.ctx.strokeStyle = '#ff4444';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.moveTo(0, -enemy.radius);
          this.ctx.lineTo(enemy.radius * 0.7, 0);
          this.ctx.lineTo(0, enemy.radius);
          this.ctx.lineTo(-enemy.radius * 0.7, 0);
          this.ctx.closePath();
          this.ctx.stroke();
        }
        
        // Health indicator
        const healthRatio = enemy.health / enemy.maxHealth;
        if (healthRatio < 1) {
          this.ctx.fillStyle = healthRatio > 0.5 ? '#ffaa00' : '#ff4444';
          this.ctx.fillRect(-enemy.radius * 0.5, -enemy.radius - 8, enemy.radius * healthRatio, 3);
        }
        
        this.ctx.restore();
      }
    }
  }

  private renderSpaceMonster(enemy: any): void {
    const monsterType = enemy.enemyType;
    const currentTime = performance.now() / 1000;
    
    // Handle flashing during hatching states
    let alpha = 1.0;
    let strokeColor = '#aa0044';
    let fillColor = 'rgba(170, 0, 68, 0.3)';
    
    // Check if stunned (overrides other states)
    if (enemy.stunEndTime !== undefined && currentTime < enemy.stunEndTime) {
      // Fast yellow flash when stunned
      const flashSpeed = 6.0; // 6 flashes per second
      alpha = 0.4 + 0.6 * Math.sin(currentTime * flashSpeed * Math.PI * 2);
      strokeColor = '#ffff00'; // Yellow when stunned
      fillColor = 'rgba(255, 255, 0, 0.4)';
    } else if (enemy.hatchState === 'dormant') {
      // Slow flash during dormant phase
      const flashSpeed = 2.0; // 2 flashes per second
      alpha = 0.3 + 0.4 * Math.sin(enemy.hatchTime * flashSpeed * Math.PI * 2);
    } else if (enemy.hatchState === 'awakening') {
      // Fast flash during awakening phase
      const flashSpeed = 8.0; // 8 flashes per second
      alpha = 0.5 + 0.5 * Math.sin(enemy.hatchTime * flashSpeed * Math.PI * 2);
      strokeColor = '#ff0066'; // Brighter color when awakening
      fillColor = 'rgba(255, 0, 102, 0.4)';
    }
    
    // Apply alpha to colors
    this.ctx.globalAlpha = alpha;
    this.ctx.strokeStyle = strokeColor;
    this.ctx.fillStyle = fillColor;
    this.ctx.lineWidth = 3;
    
    switch (monsterType) {
      case 'spider':
        this.renderSpider(enemy.radius);
        break;
      case 'centipede':
        this.renderCentipede(enemy.radius);
        break;
      case 'beetle':
        this.renderBeetle(enemy.radius);
        break;
      default:
        this.renderSpider(enemy.radius);
    }
    
    // Reset alpha
    this.ctx.globalAlpha = 1.0;
  }

  private renderSpider(radius: number): void {
    // Spider body (oval)
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, radius * 0.6, radius * 0.4, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // Spider legs (8 legs)
    this.ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const legLength = radius * 0.8;
      const legX = Math.cos(angle) * legLength;
      const legY = Math.sin(angle) * legLength;
      
      this.ctx.beginPath();
      this.ctx.moveTo(Math.cos(angle) * radius * 0.5, Math.sin(angle) * radius * 0.3);
      this.ctx.lineTo(legX, legY);
      this.ctx.stroke();
    }
  }

  private renderCentipede(radius: number): void {
    // Centipede body (segmented)
    const segments = 5;
    for (let i = 0; i < segments; i++) {
      const segmentY = (i - segments/2) * (radius * 0.3);
      const segmentRadius = radius * (0.8 - i * 0.1);
      
      this.ctx.beginPath();
      this.ctx.arc(0, segmentY, segmentRadius * 0.4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      
      // Legs for each segment
      if (i > 0) {
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(-segmentRadius * 0.4, segmentY);
        this.ctx.lineTo(-segmentRadius * 0.8, segmentY);
        this.ctx.moveTo(segmentRadius * 0.4, segmentY);
        this.ctx.lineTo(segmentRadius * 0.8, segmentY);
        this.ctx.stroke();
      }
    }
  }

  private renderBeetle(radius: number): void {
    // Beetle body (rounded rectangle)
    this.ctx.beginPath();
    this.ctx.roundRect(-radius * 0.5, -radius * 0.7, radius, radius * 1.4, radius * 0.2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // Beetle shell pattern
    this.ctx.strokeStyle = '#660022';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -radius * 0.6);
    this.ctx.lineTo(0, radius * 0.6);
    this.ctx.moveTo(-radius * 0.3, -radius * 0.4);
    this.ctx.lineTo(-radius * 0.3, radius * 0.4);
    this.ctx.moveTo(radius * 0.3, -radius * 0.4);
    this.ctx.lineTo(radius * 0.3, radius * 0.4);
    this.ctx.stroke();
    
    // Beetle legs
    this.ctx.strokeStyle = '#aa0044';
    this.ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const side = i < 3 ? -1 : 1;
      const legY = (i % 3 - 1) * radius * 0.4;
      
      this.ctx.beginPath();
      this.ctx.moveTo(side * radius * 0.4, legY);
      this.ctx.lineTo(side * radius * 0.8, legY);
      this.ctx.stroke();
    }
  }
  private renderShip(ship: Ship, camera: Vector2D): void {
    const screenPos = CameraSystem.worldToScreen(ship.position, camera, this.canvas);
    
    this.ctx.save();
    this.ctx.translate(screenPos.x, screenPos.y);
    this.ctx.rotate(ship.rotation);
    
    // Invincibility visual effect
    if (ship.isInvincible) {
      const currentTime = performance.now() / 1000;
      const flashSpeed = 10; // Fast flashing
      const alpha = 0.3 + 0.7 * Math.sin(currentTime * flashSpeed * Math.PI * 2);
      this.ctx.globalAlpha = alpha;
      
      // Glowing outline
      this.ctx.strokeStyle = '#00ffff';
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, ship.radius + 5, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    
    // Ship body (triangle)
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -ship.radius);
    this.ctx.lineTo(-ship.radius * 0.6, ship.radius * 0.8);
    this.ctx.lineTo(ship.radius * 0.6, ship.radius * 0.8);
    this.ctx.closePath();
    this.ctx.stroke();
    
    // Thrust indicator
    if (ship.energy > 0) {
      this.ctx.strokeStyle = '#ff4400';
      this.ctx.beginPath();
      this.ctx.moveTo(-4, ship.radius * 0.8);
      this.ctx.lineTo(0, ship.radius * 1.3);
      this.ctx.lineTo(4, ship.radius * 0.8);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
    
    // Reset alpha
    this.ctx.globalAlpha = 1.0;
  }

  private renderBots(bots: any[], camera: Vector2D): void {
    for (const bot of bots) {
      const screenPos = CameraSystem.worldToScreen(bot.position, camera, this.canvas);
      
      if (this.isOnScreen(screenPos, bot.radius)) {
        this.ctx.save();
        this.ctx.translate(screenPos.x, screenPos.y);
        this.ctx.rotate(bot.rotation);
        
        // Bot body (circle with triangle indicator)
        this.ctx.strokeStyle = bot.type === 'mining' ? '#6699cc' : '#ff8800';
        this.ctx.fillStyle = bot.type === 'mining' ? 'rgba(102, 153, 204, 0.3)' : 'rgba(255, 136, 0, 0.3)';
        this.ctx.lineWidth = 2;
        
        // Main body
        this.ctx.beginPath();
        this.ctx.arc(0, 0, bot.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Direction indicator
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -bot.radius * 0.6);
        this.ctx.lineTo(-bot.radius * 0.4, bot.radius * 0.4);
        this.ctx.lineTo(bot.radius * 0.4, bot.radius * 0.4);
        this.ctx.closePath();
        this.ctx.stroke();
        
        this.ctx.restore();
      }
    }
  }

  private renderParticles(particles: any[], camera: Vector2D): void {
    for (const particle of particles) {
      const screenPos = CameraSystem.worldToScreen(particle.position, camera, this.canvas);
      
      if (this.isOnScreen(screenPos, particle.size)) {
        const alpha = particle.life / particle.maxLife;
        this.ctx.globalAlpha = alpha;
        
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.globalAlpha = 1.0;
      }
    }
  }

  private renderUI(ship: Ship, lives: number): void {
    const margin = 15;
    const barWidth = 200;
    const barHeight = 18;
    const spacing = 35;

    // Energy bar
    this.renderMeter('Energy', ship.energy, ship.maxEnergy, margin, margin, barWidth, barHeight, '#ff8800');
    
    // Hull Strength bar
    const hullColor = ship.hullStrength < ship.maxHullStrength * 0.3 ? '#ff4444' : 
                      ship.hullStrength < ship.maxHullStrength * 0.6 ? '#ffaa44' : '#4488ff';
    this.renderMeter('Hull', ship.hullStrength, ship.maxHullStrength, margin, margin + spacing, barWidth, barHeight, hullColor);
    
    // Game timer
    if (this.currentGameState) {
      const elapsedTime = GameTimerSystem.getElapsedTime(this.currentGameState.gameTimer);
      this.ctx.fillStyle = '#ffaa00';
      this.ctx.font = 'bold 16px monospace';
      this.ctx.fillText(`Time: ${GameTimerSystem.formatTime(elapsedTime)}`, margin, margin + spacing * 2 + 5);
    }
    
    // Lives and cargo in a cleaner layout
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.fillText(`Lives: ${lives}`, margin, margin + spacing * 2 + 25);
    
    // Cargo summary
    const totalCargo = ship.cargoMaterials + ship.cargoGems;
    const maxCargo = ship.maxCargoMaterials + ship.maxCargoGems;
    this.ctx.fillStyle = '#cccccc';
    this.ctx.font = '14px monospace';
    this.ctx.fillText(`Total Cargo: ${Math.floor(totalCargo)}/${maxCargo}`, margin, margin + spacing * 2 + 45);
    
    // Resource breakdown
    this.ctx.fillStyle = '#6699cc';
    this.ctx.font = '12px monospace';
    
    // Show material status with generation indicator
    let materialsText = `▪ Materials: ${Math.floor(ship.cargoMaterials)}/${ship.maxCargoMaterials} (bases cost 20)`;
    if (ship.hullStrength < ship.maxHullStrength) {
      materialsText = `▪ Materials: ${Math.floor(ship.cargoMaterials)}/${ship.maxCargoMaterials} (repairing hull)`;
    }
    
    this.ctx.fillText(materialsText, margin + 10, margin + spacing * 2 + 63);
    
    this.ctx.fillStyle = '#ff8800';
    this.ctx.fillText(`▪ Power Gems: ${Math.floor(ship.cargoGems)}/${ship.maxCargoGems}`, margin + 10, margin + spacing * 2 + 81);
    
    // Bomb inventory
    this.ctx.fillStyle = '#ff4400';
    this.ctx.font = 'bold 14px monospace';
    this.ctx.fillText(`Bombs: ${ship.bombs}/${ship.maxBombs}`, margin, margin + spacing * 2 + 105);
    
    // Bomb purchase hint
    if (ship.bombs < ship.maxBombs && ship.cargoMaterials >= 10) {
      this.ctx.fillStyle = '#ffaa00';
      this.ctx.font = '12px monospace';
      this.ctx.fillText('Press N to buy bomb (10 materials)', margin, margin + spacing * 2 + 123);
    } else if (ship.bombs < ship.maxBombs) {
      this.ctx.fillStyle = '#666666';
      this.ctx.font = '12px monospace';
      this.ctx.fillText(`Need 10 materials to buy bomb (${ship.bombs}/${ship.maxBombs})`, margin, margin + spacing * 2 + 123);
    }
    
    // Emergency melee weapon hint
    if (ship.cargoGems >= 10) {
      this.ctx.fillStyle = '#00ffff';
      this.ctx.font = '12px monospace';
      this.ctx.fillText('Press K for Emergency Melee (10 gems)', margin, margin + spacing * 2 + 141);
    } else {
      this.ctx.fillStyle = '#666666';
      this.ctx.font = '12px monospace';
      this.ctx.fillText(`Need 10 gems for Emergency Melee (${ship.cargoGems}/10)`, margin, margin + spacing * 2 + 141);
    }
    
    // Upgrade and bot menu hints
    this.ctx.fillStyle = '#88cc88';
    this.ctx.font = '12px monospace';
    
    // Show current mission objective
    if (this.currentGameState && this.currentGameState.selectedMission) {
      this.ctx.fillStyle = '#ffaa00';
      this.ctx.font = 'bold 14px monospace';
      this.ctx.fillText(`MISSION: ${this.currentGameState.selectedMission.name}`, margin, margin + spacing * 2 + 163);
      
      this.ctx.fillStyle = '#cccccc';
      this.ctx.font = '12px monospace';
      this.ctx.fillText(`${this.currentGameState.selectedMission.objective}`, margin, margin + spacing * 2 + 181);
      
      this.ctx.fillStyle = '#88cc88';
      this.ctx.fillText('Press U for upgrades, P for bots', margin, margin + spacing * 2 + 203);
    } else {
      this.ctx.fillText('Press U for upgrades, P for bots', margin, margin + spacing * 2 + 163);
    }
  }

  renderRoleSelection(roles: any[], selectedIndex: number): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const centerX = this.canvas.width / 2;
    const startY = 100;

    // Title
    this.ctx.fillStyle = '#00ff00';
    this.ctx.font = 'bold 36px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SELECT YOUR ROLE', centerX, startY);

    // Instructions
    this.ctx.fillStyle = '#cccccc';
    this.ctx.font = '16px monospace';
    this.ctx.fillText('Use UP/DOWN arrows to select, ENTER to confirm', centerX, startY + 40);

    // Role list
    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      const y = startY + 100 + (i * 80);
      const isSelected = i === selectedIndex;

      // Selection highlight
      if (isSelected) {
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        this.ctx.fillRect(50, y - 35, this.canvas.width - 100, 70);
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(50, y - 35, this.canvas.width - 100, 70);
      }

      // Role name
      this.ctx.fillStyle = isSelected ? '#00ff00' : '#ffffff';
      this.ctx.font = 'bold 24px monospace';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(role.name, 80, y - 10);

      // Role description
      this.ctx.fillStyle = isSelected ? '#ccffcc' : '#aaaaaa';
      this.ctx.font = '14px monospace';
      this.ctx.fillText(role.description, 80, y + 10);

      // Stats preview
      this.ctx.fillStyle = isSelected ? '#88cc88' : '#888888';
      this.ctx.font = '12px monospace';
      const stats = role.stats;
      const statsText = `Energy: ${stats.maxEnergy} | Hull: ${stats.maxHullStrength} | Cargo: ${stats.maxCargoMaterials + stats.maxCargoGems} | Damage: ${stats.weaponDamage}x`;
      this.ctx.fillText(statsText, 80, y + 25);
    }

    // Reset text alignment
    this.ctx.textAlign = 'left';
  }

  renderMissionSelection(missions: any[], selectedIndex: number): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const centerX = this.canvas.width / 2;
    const startY = 100;

    // Title
    this.ctx.fillStyle = '#00ff00';
    this.ctx.font = 'bold 36px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SELECT YOUR MISSION', centerX, startY);

    // Instructions
    this.ctx.fillStyle = '#cccccc';
    this.ctx.font = '16px monospace';
    this.ctx.fillText('Use UP/DOWN arrows to select, ENTER to confirm, ESC to go back', centerX, startY + 40);

    // Mission list
    for (let i = 0; i < missions.length; i++) {
      const mission = missions[i];
      const y = startY + 100 + (i * 120);
      const isSelected = i === selectedIndex;

      // Selection highlight
      if (isSelected) {
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        this.ctx.fillRect(50, y - 45, this.canvas.width - 100, 110);
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(50, y - 45, this.canvas.width - 100, 110);
      }

      // Mission name
      this.ctx.fillStyle = isSelected ? '#00ff00' : '#ffffff';
      this.ctx.font = 'bold 24px monospace';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(mission.name, 80, y - 15);

      // Mission description
      this.ctx.fillStyle = isSelected ? '#ccffcc' : '#aaaaaa';
      this.ctx.font = '14px monospace';
      this.ctx.fillText(mission.description, 80, y + 5);

      // Mission objective
      this.ctx.fillStyle = isSelected ? '#88cc88' : '#888888';
      this.ctx.font = 'bold 12px monospace';
      this.ctx.fillText(`OBJECTIVE: ${mission.objective}`, 80, y + 25);

      // Victory condition
      this.ctx.fillStyle = isSelected ? '#ffaa00' : '#666666';
      this.ctx.font = '12px monospace';
      let victoryText = '';
      switch (mission.victoryCondition) {
        case 'allAsteroidsMined':
          victoryText = 'WIN: Destroy all asteroids';
          break;
        case 'allEnemiesDefeated':
          victoryText = 'WIN: Eliminate all threats (bugs & enemies)';
          break;
        case 'allPlanetsColonized':
          victoryText = 'WIN: Control all planets';
          break;
      }
      this.ctx.fillText(victoryText, 80, y + 40);
    }

    // Reset text alignment
    this.ctx.textAlign = 'left';
  }

  renderDifficultySelection(difficulties: Difficulty[], selectedIndex: number, _gameState: GameState): void {
    const ctx = this.ctx;
    const canvas = this.canvas;

    // Clear screen
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#ff6600';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SELECT DIFFICULTY', canvas.width / 2, 80);

    ctx.fillStyle = '#cccccc';
    ctx.font = '16px monospace';
    ctx.fillText('Choose your challenge level', canvas.width / 2, 110);

    // Difficulty options
    const startY = 180;
    const spacing = 120;

    for (let i = 0; i < difficulties.length; i++) {
      const difficulty = difficulties[i];
      const y = startY + (i * spacing);
      const isSelected = i === selectedIndex;

      // Selection highlight
      if (isSelected) {
        ctx.fillStyle = 'rgba(255, 102, 0, 0.2)';
        ctx.fillRect(50, y - 40, canvas.width - 100, 100);
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, y - 40, canvas.width - 100, 100);
      }

      // Difficulty name
      ctx.fillStyle = isSelected ? '#ff6600' : '#ffffff';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}. ${difficulty.name}`, canvas.width / 2, y);

      // Description
      ctx.fillStyle = '#cccccc';
      ctx.font = '14px monospace';
      ctx.fillText(difficulty.description, canvas.width / 2, y + 25);

      // Stats
      ctx.fillStyle = '#888888';
      ctx.font = '12px monospace';
      const spawnText = difficulty.enemySpawnMultiplier < 1 ? 
        `${Math.round((1 - difficulty.enemySpawnMultiplier) * 100)}% faster spawns` : 
        'Normal spawn rate';
      const countText = difficulty.enemyCountMultiplier > 1 ? 
        `${difficulty.enemyCountMultiplier}x enemies per wave` : 
        'Normal enemy count';
      const eggText = difficulty.cosmicEggMultiplier > 1 ? 
        `${difficulty.cosmicEggMultiplier}x cosmic eggs` : 
        'Normal cosmic eggs';
      
      ctx.fillText(`${spawnText} • ${countText} • ${eggText}`, canvas.width / 2, y + 45);
    }

    // Instructions
    ctx.fillStyle = '#666666';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('UP/DOWN or W/S - Navigate • ENTER/SPACE - Select • Q - Quit', canvas.width / 2, canvas.height - 60);
    ctx.fillText('ESC - Back to Role Selection', canvas.width / 2, canvas.height - 30);
  }

  private renderMeter(label: string, current: number, max: number, x: number, y: number, width: number, height: number, color: string): void {
    // Background with subtle border
    this.ctx.fillStyle = '#222222';
    this.ctx.fillRect(x, y, width, height);
    
    // Inner border
    this.ctx.strokeStyle = '#444444';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);
    
    // Fill
    const fillWidth = (current / max) * width;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, fillWidth, height);
    
    // Outer border
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);
    
    // Label
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 12px monospace';
    this.ctx.fillText(label, x, y - 3);
    
    // Value text
    this.ctx.fillStyle = '#cccccc';
    this.ctx.font = '11px monospace';
    const valueText = `${Math.ceil(current)}/${max}`;
    this.ctx.fillText(valueText, x + width + 8, y + height - 4);
  }

  private isOnScreen(screenPos: Vector2D, radius: number): boolean {
    return screenPos.x + radius > 0 && 
           screenPos.x - radius < this.canvas.width &&
           screenPos.y + radius > 0 && 
           screenPos.y - radius < this.canvas.height;
  }

  private renderEndScreen(gameState: GameState): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const centerX = this.canvas.width / 2;
    const startY = 80;

    // Title
    this.ctx.fillStyle = gameState.gameStatus === 'victory' ? '#00ff00' : '#ff4444';
    this.ctx.font = 'bold 48px monospace';
    this.ctx.textAlign = 'center';
    const title = gameState.gameStatus === 'victory' ? 'VICTORY!' : 'GAME OVER';
    this.ctx.fillText(title, centerX, startY);

    // Reason
    if (gameState.currentLevel && gameState.currentLevel > 1) {
      this.ctx.fillStyle = '#ffaa00';
      this.ctx.font = '16px monospace';
      this.ctx.fillText(`Level ${gameState.currentLevel} Complete!`, this.canvas.width / 2, 150);
    }
    
    // Calculate and display score
    const stats = ScoreSystem.extractStatsFromGameState(gameState, gameState.gameTimer);
    const scoreBreakdown = ScoreSystem.calculateScore(stats);
    
    // Score section
    this.ctx.fillStyle = scoreBreakdown.rankColor;
    this.ctx.font = 'bold 32px monospace';
    this.ctx.fillText(`${scoreBreakdown.rank}`, centerX, startY + 100);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px monospace';
    this.ctx.fillText(`FINAL SCORE: ${scoreBreakdown.totalScore}`, centerX, startY + 130);
    
    this.ctx.fillStyle = '#cccccc';
    this.ctx.font = '14px monospace';
    this.ctx.fillText(ScoreSystem.getScoreDescription(scoreBreakdown.totalScore), centerX, startY + 150);
    
    // Render score visualization
    this.renderScoreVisualization(scoreBreakdown, stats, centerX, startY + 180);

    // Basic Stats
    this.ctx.font = '16px monospace';
    this.ctx.fillStyle = '#cccccc';
    this.ctx.fillText('MISSION STATISTICS', centerX, startY + 380);

    this.ctx.font = '14px monospace';
    this.ctx.fillStyle = '#6699cc';
    this.ctx.fillText(`Play Time: ${GameTimerSystem.formatDetailedTime(stats.playTime)}`, centerX, startY + 405);
    
    this.ctx.fillStyle = '#ff8800';
    this.ctx.fillText(`Materials: ${stats.materialsCollected} | Asteroids: ${stats.asteroidsDestroyed} | Enemies: ${stats.enemiesDestroyed}`, centerX, startY + 425);
    
    this.ctx.fillStyle = '#888888';
    this.ctx.fillText(`Planets: ${stats.planetsConquered} | Bases: ${stats.basesBuilt} | Space Monsters: ${stats.spaceMonsterKills}`, centerX, startY + 445);

    // Instructions
    this.ctx.fillStyle = '#00ff00';
    this.ctx.font = 'bold 18px monospace';
    this.ctx.fillText('N - Next Level', centerX, startY + 485);
    
    this.ctx.fillStyle = '#cccccc';
    this.ctx.font = '16px monospace';
    this.ctx.fillText('R - Restart Game • Q - Quit to Title', centerX, startY + 525);

    // Reset text alignment
    this.ctx.textAlign = 'left';
  }
  
  private renderScoreVisualization(scoreBreakdown: any, _stats: any, centerX: number, startY: number): void {
    // Create a space-themed radar chart showing score components
    const chartRadius = 80;
    const chartCenterY = startY + 80;
    
    // Score components for visualization
    const components = [
      { label: 'Speed', value: scoreBreakdown.timeScore, max: 800, color: '#ffaa00' },
      { label: 'Materials', value: scoreBreakdown.materialScore, max: 200, color: '#6699cc' },
      { label: 'Asteroids', value: scoreBreakdown.asteroidScore, max: 175, color: '#888888' },
      { label: 'Combat', value: scoreBreakdown.enemyScore, max: 300, color: '#ff4444' },
      { label: 'Planets', value: scoreBreakdown.planetScore, max: 100, color: '#00aa00' },
      { label: 'Bases', value: scoreBreakdown.baseScore, max: 75, color: '#00ffff' }
    ];
    
    // Draw background circles
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      this.ctx.beginPath();
      this.ctx.arc(centerX, chartCenterY, (chartRadius * i) / 3, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    
    // Draw axes
    this.ctx.strokeStyle = '#555555';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < components.length; i++) {
      const angle = (i / components.length) * Math.PI * 2 - Math.PI / 2;
      const endX = centerX + Math.cos(angle) * chartRadius;
      const endY = chartCenterY + Math.sin(angle) * chartRadius;
      
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, chartCenterY);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
    }
    
    // Draw score polygon
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
    this.ctx.lineWidth = 2;
    
    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      const angle = (i / components.length) * Math.PI * 2 - Math.PI / 2;
      const ratio = Math.min(component.value / component.max, 1);
      const distance = chartRadius * ratio;
      const x = centerX + Math.cos(angle) * distance;
      const y = chartCenterY + Math.sin(angle) * distance;
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    // Draw component labels and values
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'center';
    
    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      const angle = (i / components.length) * Math.PI * 2 - Math.PI / 2;
      const labelDistance = chartRadius + 25;
      const labelX = centerX + Math.cos(angle) * labelDistance;
      const labelY = chartCenterY + Math.sin(angle) * labelDistance;
      
      // Label
      this.ctx.fillStyle = component.color;
      this.ctx.fillText(component.label, labelX, labelY);
      
      // Value
      this.ctx.fillStyle = '#cccccc';
      this.ctx.fillText(`${component.value}`, labelX, labelY + 14);
    }
    
    // Space monster bonus indicator
    if (scoreBreakdown.monsterBonus > 0) {
      this.ctx.fillStyle = '#ff00ff';
      this.ctx.font = 'bold 14px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`MONSTER BONUS: +${scoreBreakdown.monsterBonus}`, centerX, chartCenterY + chartRadius + 60);
    }
    
    // Reset alignment
    this.ctx.textAlign = 'left';
  }

  private renderShipLevelIndicator(_ship: Ship, upgradeState: any): void {
    
    // Calculate total upgrade levels
    const shipUpgrades = upgradeState.shipUpgrades;
    const totalShipUpgrades = shipUpgrades.energyCapacity + shipUpgrades.energyRecharge + 
                             shipUpgrades.hullStrength + shipUpgrades.cargoCapacity + 
                             shipUpgrades.weaponDamage + shipUpgrades.weaponFireRate;
    
    const baseUpgrades = upgradeState.baseUpgrades;
    const totalBaseUpgrades = baseUpgrades.hpBonus + baseUpgrades.regenBonus;
    
    const totalUpgrades = totalShipUpgrades + totalBaseUpgrades;
    const shipLevel = Math.floor(totalUpgrades / 3) + 1; // Every 3 upgrades = 1 level
    
    // Position at top center
    const centerX = this.canvas.width / 2;
    const y = 35;
    
    // Enhanced ship emblem with multiple layers
    this.ctx.save();
    this.ctx.translate(centerX, y);
    
    // Outer glow ring
    const glowRadius = 35;
    let emblemColor = '#666666'; // Default gray
    let glowColor = '#333333';
    if (shipLevel >= 10) emblemColor = '#ff00ff'; // Purple for master level
    if (shipLevel >= 10) glowColor = '#ff00ff44';
    else if (shipLevel >= 7) { emblemColor = '#ffaa00'; glowColor = '#ffaa0044'; } // Gold for high level
    else if (shipLevel >= 4) { emblemColor = '#00aaff'; glowColor = '#00aaff44'; } // Blue for mid level
    else if (shipLevel >= 2) { emblemColor = '#00ff00'; glowColor = '#00ff0044'; } // Green for upgraded
    
    // Outer glow effect
    if (shipLevel >= 2) {
      this.ctx.fillStyle = glowColor;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Metallic ring border
    this.ctx.strokeStyle = '#888888';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 28, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Main emblem circle with gradient effect
    this.ctx.fillStyle = emblemColor;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 25, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Inner highlight for 3D effect
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.beginPath();
    this.ctx.arc(-5, -5, 15, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Sharp emblem border
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 25, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Enhanced ship icon with more detail
    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 1;
    
    // Main ship body (larger triangle)
    this.ctx.beginPath();
    this.ctx.moveTo(0, -12);
    this.ctx.lineTo(-8, 8);
    this.ctx.lineTo(8, 8);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    // Ship details - engine exhausts
    this.ctx.fillStyle = '#ff4400';
    this.ctx.beginPath();
    this.ctx.moveTo(-4, 8);
    this.ctx.lineTo(-2, 12);
    this.ctx.lineTo(2, 12);
    this.ctx.lineTo(4, 8);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Level number in center
    this.ctx.fillStyle = '#000000';
    this.ctx.font = 'bold 10px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(shipLevel.toString(), 0, 3);
    
    this.ctx.restore();
    
    // Enhanced ship level text with shadow
    this.ctx.fillStyle = '#000000';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`SHIP LEVEL ${shipLevel}`, centerX + 1, y + 45);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`SHIP LEVEL ${shipLevel}`, centerX, y + 44);
    
    // Upgrade count detail with better styling
    this.ctx.fillStyle = emblemColor;
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`${totalUpgrades} Total Upgrades`, centerX, y + 60);
    
    // Progress to next level
    const upgradesForNextLevel = (shipLevel * 3) - totalUpgrades;
    if (upgradesForNextLevel > 0) {
      this.ctx.fillStyle = '#999999';
      this.ctx.font = '10px monospace';
      this.ctx.fillText(`${upgradesForNextLevel} more upgrades to level ${shipLevel + 1}`, centerX, y + 75);
    } else {
      // Max level achieved message
      this.ctx.fillStyle = '#ffaa00';
      this.ctx.font = '10px monospace';
      this.ctx.fillText('MAXIMUM POWER ACHIEVED!', centerX, y + 75);
    }
    
    // Rank title based on level
    let rankTitle = '';
    if (shipLevel >= 10) rankTitle = 'FLEET ADMIRAL';
    else if (shipLevel >= 7) rankTitle = 'CAPTAIN';
    else if (shipLevel >= 4) rankTitle = 'LIEUTENANT';
    else if (shipLevel >= 2) rankTitle = 'PILOT';
    else rankTitle = 'RECRUIT';
    
    if (rankTitle) {
      this.ctx.fillStyle = emblemColor;
      this.ctx.font = 'bold 11px monospace';
      this.ctx.fillText(rankTitle, centerX, y + 90);
    }
    
    this.ctx.textAlign = 'left'; // Reset alignment
  }

  private renderMinimap(gameState: GameState): void {
    const minimapSize = 200;
    const minimapX = this.canvas.width - minimapSize - 20;
    const minimapY = 20;
    const worldConfig = gameState.worldConfig;
    
    // Semi-transparent background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);
    
    // Border
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize);
    
    // Title
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 12px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('MAP (M to toggle)', minimapX + minimapSize / 2, minimapY - 5);
    
    // World bounds indicator
    this.ctx.strokeStyle = '#444444';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(minimapX + 10, minimapY + 10, minimapSize - 20, minimapSize - 20);
    
    // Scale factors
    const scaleX = (minimapSize - 20) / worldConfig.worldWidth;
    const scaleY = (minimapSize - 20) / worldConfig.worldHeight;
    
    // Helper function to convert world coordinates to minimap coordinates
    const worldToMinimap = (worldPos: Vector2D) => ({
      x: minimapX + 10 + (worldPos.x + worldConfig.worldWidth / 2) * scaleX,
      y: minimapY + 10 + (worldPos.y + worldConfig.worldHeight / 2) * scaleY
    });
    
    // Render asteroids as small dots
    this.ctx.fillStyle = '#888888';
    for (const asteroid of gameState.asteroids) {
      const minimapPos = worldToMinimap(asteroid.position);
      this.ctx.beginPath();
      this.ctx.arc(minimapPos.x, minimapPos.y, 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Render planets as larger circles
    for (const planet of gameState.planets) {
      const minimapPos = worldToMinimap(planet.position);
      
      // Planet color based on ownership
      if (planet.owner === 'none') {
        this.ctx.fillStyle = '#666666';
      } else if (planet.owner === 'player') {
        this.ctx.fillStyle = '#00aa00';
      } else {
        this.ctx.fillStyle = '#aa0000';
        
      }
      
      // Render planet bots
      if (planet.owner === 'player') {
        for (const bot of planet.planetBots) {
          if (!bot.active) continue;
          
          const botScreenPos = CameraSystem.worldToScreen(bot.position, gameState.camera, this.canvas);
          if (this.isOnScreen(botScreenPos, bot.radius)) {
            this.ctx.save();
            this.ctx.translate(botScreenPos.x, botScreenPos.y);
            this.ctx.rotate(bot.rotation);
            
            // Planet bot (smaller, blue)
            this.ctx.strokeStyle = '#4488cc';
            this.ctx.fillStyle = 'rgba(68, 136, 204, 0.3)';
            this.ctx.lineWidth = 1;
            
            // Main body
            this.ctx.beginPath();
            this.ctx.arc(0, 0, bot.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Direction indicator
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -bot.radius * 0.5);
            this.ctx.lineTo(-bot.radius * 0.3, bot.radius * 0.3);
            this.ctx.lineTo(bot.radius * 0.3, bot.radius * 0.3);
            this.ctx.closePath();
            this.ctx.stroke();
            
            this.ctx.restore();
          }
        }
      }
      
      this.ctx.beginPath();
      this.ctx.arc(minimapPos.x, minimapPos.y, 5, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Base count indicator
      if (planet.bases > 0) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '8px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(planet.bases.toString(), minimapPos.x, minimapPos.y + 2);
      }
    }
    
    // Render enemies as red dots
    this.ctx.fillStyle = '#ff4444';
    for (const enemy of gameState.enemies) {
      if (!enemy.active) continue;
      const minimapPos = worldToMinimap(enemy.position);
      this.ctx.beginPath();
      this.ctx.arc(minimapPos.x, minimapPos.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Render resource drops as colored dots
    for (const resource of gameState.resourceDrops) {
      if (resource.collected) continue;
      const minimapPos = worldToMinimap(resource.position);
      this.ctx.fillStyle = resource.type === 'rawMaterial' ? '#6699cc' : '#ff8800';
      this.ctx.beginPath();
      this.ctx.arc(minimapPos.x, minimapPos.y, 1.5, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Render player ship as green triangle
    const shipMinimapPos = worldToMinimap(gameState.ship.position);
    this.ctx.save();
    this.ctx.translate(shipMinimapPos.x, shipMinimapPos.y);
    this.ctx.rotate(gameState.ship.rotation);
    
    this.ctx.fillStyle = '#00ff00';
    this.ctx.beginPath();
    this.ctx.moveTo(0, -4);
    this.ctx.lineTo(-3, 3);
    this.ctx.lineTo(3, 3);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.restore();
    
    // Reset text alignment
    this.ctx.textAlign = 'left';
  }

  private renderUpgradeMenu(ship: Ship, upgradeState: any): void {
    UISystem.renderUpgradeMenu(this.ctx, this.canvas, ship, upgradeState);
  }

  private renderBotMenu(ship: Ship, botState: any): void {
    UISystem.renderBotMenu(this.ctx, this.canvas, ship, botState);
  }

  private renderBotHUD(botState: any): void {
    UISystem.renderBotHUD(this.ctx, this.canvas, botState);
  }

  private renderSpaceMonsterWarnings(warnings: any[]): void {
    const currentTime = performance.now() / 1000;
    
    for (const warning of warnings) {
      const elapsed = currentTime - warning.startTime;
      if (elapsed >= warning.duration) continue;
      
      // Position in bottom right corner
      const x = this.canvas.width - 80;
      const y = this.canvas.height - 80;
      
      // Shake effect - more intense at start
      const shakeIntensity = Math.max(0, (warning.duration - elapsed) / warning.duration) * 8;
      const shakeX = (Math.random() - 0.5) * shakeIntensity;
      const shakeY = (Math.random() - 0.5) * shakeIntensity;
      
      this.ctx.save();
      this.ctx.translate(x + shakeX, y + shakeY);
      
      // Warning triangle background
      this.ctx.fillStyle = '#ffff00';
      this.ctx.strokeStyle = '#ff8800';
      this.ctx.lineWidth = 3;
      
      this.ctx.beginPath();
      this.ctx.moveTo(0, -25);
      this.ctx.lineTo(-22, 20);
      this.ctx.lineTo(22, 20);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      
      // Exclamation mark
      this.ctx.fillStyle = '#000000';
      this.ctx.font = 'bold 24px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('!', 0, 5);
      
      // Warning text
      this.ctx.fillStyle = '#ffff00';
      this.ctx.font = 'bold 12px monospace';
      this.ctx.fillText('SPACE MONSTER', 0, 40);
      this.ctx.fillText('DETECTED', 0, 55);
      
      this.ctx.restore();
    }
  }

  private renderLightningEffects(ship: Ship, camera: Vector2D): void {
    if (!ship.meleeCharging) return;
    
    const currentTime = performance.now() / 1000;
    const screenPos = CameraSystem.worldToScreen(ship.position, camera, this.canvas);
    
    this.ctx.save();
    this.ctx.translate(screenPos.x, screenPos.y);
    
    // Electric rings expanding outward
    const ringCount = 3;
    const maxRadius = 400; // Half viewport width
    
    for (let i = 0; i < ringCount; i++) {
      const ringPhase = (currentTime * 4 + i * 0.5) % 2; // Each ring cycles every 0.5 seconds
      const ringRadius = (ringPhase / 2) * maxRadius;
      const ringAlpha = 1 - (ringPhase / 2); // Fade out as ring expands
      
      this.ctx.globalAlpha = ringAlpha * 0.6;
      this.ctx.strokeStyle = '#00ffff';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    
    // Lightning arcs radiating from ship
    const arcCount = 8;
    this.ctx.globalAlpha = 0.8;
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    
    for (let i = 0; i < arcCount; i++) {
      const angle = (i / arcCount) * Math.PI * 2;
      const arcLength = 60 + Math.sin(currentTime * 8 + i) * 20; // Pulsing arcs
      
      // Create jagged lightning effect
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      
      const segments = 4;
      for (let j = 1; j <= segments; j++) {
        const segmentRatio = j / segments;
        const baseX = Math.cos(angle) * arcLength * segmentRatio;
        const baseY = Math.sin(angle) * arcLength * segmentRatio;
        
        // Add random jagged offset
        const jaggerX = (Math.random() - 0.5) * 15;
        const jaggerY = (Math.random() - 0.5) * 15;
        
        this.ctx.lineTo(baseX + jaggerX, baseY + jaggerY);
      }
      
      this.ctx.stroke();
    }
    
    this.ctx.restore();
    this.ctx.globalAlpha = 1.0;
    
    // Lightning charging warning indicator
    if (ship.meleeCharging) {
      // Position in bottom right corner (different from space monster warning)
      const x = this.canvas.width - 80;
      const y = this.canvas.height - 80;
      
      // Intense shake effect for lightning energy
      const shakeIntensity = 12;
      const shakeX = (Math.random() - 0.5) * shakeIntensity;
      const shakeY = (Math.random() - 0.5) * shakeIntensity;
      
      this.ctx.save();
      this.ctx.translate(x + shakeX, y + shakeY);
      
      // Lightning triangle background (electric blue)
      this.ctx.fillStyle = '#00ffff';
      this.ctx.strokeStyle = '#0088ff';
      this.ctx.lineWidth = 3;
      
      this.ctx.beginPath();
      this.ctx.moveTo(0, -25);
      this.ctx.lineTo(-22, 20);
      this.ctx.lineTo(22, 20);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      
      // Lightning bolt symbol
      this.ctx.fillStyle = '#000000';
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(-5, -15);
      this.ctx.lineTo(5, -5);
      this.ctx.lineTo(-2, -5);
      this.ctx.lineTo(5, 10);
      this.ctx.lineTo(-5, 0);
      this.ctx.lineTo(2, 0);
      this.ctx.closePath();
      this.ctx.fill();
      
      // Warning text
      this.ctx.fillStyle = '#00ffff';
      this.ctx.font = 'bold 12px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('LIGHTNING', 0, 40);
      this.ctx.fillText('CHARGING', 0, 55);
      
      this.ctx.restore();
    }
  }

  private renderBoundaryWarning(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, ship: any): void {
    if (!ship.isOutOfBounds) return;

    const warningSize = 25;
    const warningX = canvas.width - warningSize - 15;
    const warningY = canvas.height - warningSize - 80; // Position above lightning warning

    // Warning triangle background
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.moveTo(warningX + warningSize / 2, warningY);
    ctx.lineTo(warningX, warningY + warningSize);
    ctx.lineTo(warningX + warningSize, warningY + warningSize);
    ctx.closePath();
    ctx.fill();

    // Warning triangle border
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Instructions
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    
    // Always show next level option on victory
    ctx.fillText('N - Next Level | R - Restart Game | Q - Quit to Title', canvas.width / 2, canvas.height - 40);

    // Warning text
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('OUT OF BOUNDS', warningX - 85, warningY + 15);
  }

  renderQuitConfirmation(): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Title
    this.ctx.fillStyle = '#ff4444';
    this.ctx.font = 'bold 36px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('QUIT TO TITLE?', centerX, centerY - 40);

    // Instructions
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '20px monospace';
    this.ctx.fillText('Press Q again to confirm', centerX, centerY + 20);
    this.ctx.fillText('Press ESC to cancel', centerX, centerY + 50);

    // Reset text alignment
    this.ctx.textAlign = 'left';
  }

  worldToScreen(worldPos: Vector2D, camera: Vector2D, canvas: HTMLCanvasElement): Vector2D {
    return CameraSystem.worldToScreen(worldPos, camera, canvas);
  }
}
