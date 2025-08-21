import { Ship } from '../types/GameTypes';
import { UpgradeState, UpgradeSystem } from './UpgradeSystem';
import { BotState, BotSystem } from './BotSystem';

export interface UIState {
  showUpgradeMenu: boolean;
  showBotMenu: boolean;
  showLeaderboard: boolean;
  selectedUpgradeTab: 'ship' | 'base';
  selectedUpgradeIndex: number;
  selectedBotOption: number;
}

export class UISystem {
  private static uiState: UIState = {
    showUpgradeMenu: false,
    showBotMenu: false,
    showLeaderboard: false,
    selectedUpgradeTab: 'ship',
    selectedUpgradeIndex: 0,
    selectedBotOption: 0
  };

  static toggleUpgradeMenu(): void {
    this.uiState.showUpgradeMenu = !this.uiState.showUpgradeMenu;
    if (this.uiState.showUpgradeMenu) {
      this.uiState.showBotMenu = false; // Close bot menu if open
      this.uiState.selectedUpgradeIndex = 0; // Reset selection
    }
  }

  static toggleBotMenu(): void {
    this.uiState.showBotMenu = !this.uiState.showBotMenu;
    if (this.uiState.showBotMenu) {
      this.uiState.showUpgradeMenu = false; // Close upgrade menu if open
      this.uiState.selectedBotOption = 0; // Reset selection
    }
  }

  static closeAllMenus(): void {
    this.uiState.showUpgradeMenu = false;
    this.uiState.showBotMenu = false;
    this.uiState.showLeaderboard = false;
    this.uiState.selectedUpgradeIndex = 0;
    this.uiState.selectedBotOption = 0;
  }

  static toggleLeaderboard(): void {
    this.uiState.showLeaderboard = !this.uiState.showLeaderboard;
    if (this.uiState.showLeaderboard) {
      this.uiState.showUpgradeMenu = false;
      this.uiState.showBotMenu = false;
    }
  }

  static isLeaderboardOpen(): boolean {
    return this.uiState.showLeaderboard;
  }

  static renderLeaderboard(
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement
  ): void {
    if (!this.uiState.showLeaderboard) return;

    const menuWidth = 700;
    const menuHeight = 700;
    const menuX = (canvas.width - menuWidth) / 2;
    const menuY = (canvas.height - menuHeight) / 2;

    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

    // Border
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

    // Title
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LEADERBOARD', menuX + menuWidth / 2, menuY + 40);

    // Fetch leaderboard entries
    const leaderboard = JSON.parse(localStorage.getItem('space-mining-leaderboard') || '[]');
    
    // Render leaderboard headers
    ctx.fillStyle = '#cccccc';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    
    const headers = ['Rank', 'Player', 'Score', 'Mission', 'Role', 'Time'];
    const columnWidths = [60, 100, 80, 140, 120, 80];
    let currentX = menuX + 20;
    
    headers.forEach((header, index) => {
      ctx.fillText(header, currentX, menuY + 80);
      currentX += columnWidths[index];
    });

    // Render leaderboard entries
    ctx.font = '11px monospace';
    leaderboard.slice(0, 15).forEach((entry: any, index: number) => {
      const y = menuY + 110 + (index * 25);
      currentX = menuX + 20;
      
      // Rank
      ctx.fillStyle = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#ffffff';
      ctx.fillText(`#${index + 1}`, currentX, y);
      currentX += columnWidths[0];
      
      // Player Name - truncate if too long
      ctx.fillStyle = '#ffffff';
      const playerName = (entry.playerName || 'Anonymous').substring(0, 12);
      ctx.fillText(playerName, currentX, y);
      currentX += columnWidths[1];
      
      // Score - format with commas
      const scoreText = entry.score.toLocaleString();
      ctx.fillText(scoreText.length > 8 ? scoreText.substring(0, 8) + '...' : scoreText, currentX, y);
      currentX += columnWidths[2];
      
      // Mission - truncate if too long
      const missionText = (entry.mission || 'Unknown').substring(0, 18);
      ctx.fillText(missionText, currentX, y);
      currentX += columnWidths[3];
      
      // Ship Role - truncate if too long
      const roleText = (entry.shipRole || 'Unknown').substring(0, 15);
      ctx.fillText(roleText, currentX, y);
      currentX += columnWidths[4];
      
      // Play Time
      const minutes = Math.floor((entry.playTime || 0) / 60);
      ctx.fillText(`${minutes}m`, currentX, y);
    });

    // Instructions
    ctx.fillStyle = '#cccccc';
    ctx.textAlign = 'center';
    ctx.font = '12px monospace';
    ctx.fillText('Press X to close Leaderboard', menuX + menuWidth / 2, menuY + menuHeight - 20);
  }

  static isUpgradeMenuOpen(): boolean {
    return this.uiState.showUpgradeMenu;
  }

  static isBotMenuOpen(): boolean {
    return this.uiState.showBotMenu;
  }

  static switchUpgradeTab(tab: 'ship' | 'base'): void {
    this.uiState.selectedUpgradeTab = tab;
    this.uiState.selectedUpgradeIndex = 0; // Reset selection when switching tabs
  }

  static getSelectedUpgradeTab(): 'ship' | 'base' {
    return this.uiState.selectedUpgradeTab;
  }

  static navigateUpgradeMenu(direction: 'up' | 'down'): void {
    if (!this.uiState.showUpgradeMenu) return;
    
    const maxOptions = this.uiState.selectedUpgradeTab === 'ship' ? 6 : 2;
    
    if (direction === 'up') {
      this.uiState.selectedUpgradeIndex = Math.max(0, this.uiState.selectedUpgradeIndex - 1);
    } else {
      this.uiState.selectedUpgradeIndex = (this.uiState.selectedUpgradeIndex + 1) % maxOptions;
    }
  }

  static navigateBotMenu(direction: 'up' | 'down'): void {
    if (!this.uiState.showBotMenu) return;
    
    // Only one option for now (purchase bot)
    const maxOptions = 1;
    
    if (direction === 'up') {
      this.uiState.selectedBotOption = Math.max(0, this.uiState.selectedBotOption - 1);
    } else {
      this.uiState.selectedBotOption = (this.uiState.selectedBotOption + 1) % maxOptions;
    }
  }

  static getSelectedUpgradeIndex(): number {
    return this.uiState.selectedUpgradeIndex;
  }

  static getSelectedBotOption(): number {
    return this.uiState.selectedBotOption;
  }

  static getSelectedUpgradeType(): string | null {
    if (!this.uiState.showUpgradeMenu) return null;
    
    if (this.uiState.selectedUpgradeTab === 'ship') {
      const shipUpgrades = ['energyCapacity', 'energyRecharge', 'hullStrength', 'cargoCapacity', 'weaponDamage', 'weaponFireRate'];
      return shipUpgrades[this.uiState.selectedUpgradeIndex] || null;
    } else {
      const baseUpgrades = ['baseHP', 'baseRegen'];
      return baseUpgrades[this.uiState.selectedUpgradeIndex] || null;
    }
  }
  static renderUpgradeMenu(
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    ship: Ship, 
    upgradeState: UpgradeState
  ): void {
    if (!this.uiState.showUpgradeMenu) return;

    const menuWidth = 500;
    const menuHeight = 600;
    const menuX = (canvas.width - menuWidth) / 2;
    const menuY = (canvas.height - menuHeight) / 2;

    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

    // Border
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

    // Title
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('UPGRADES', menuX + menuWidth / 2, menuY + 25);


    // Render upgrade options based on selected tab
    if (this.uiState.selectedUpgradeTab === 'ship') {
      this.renderShipUpgrades(ctx, menuX + 10, menuY + 50, menuWidth - 20, ship, upgradeState);
    } else {
      this.renderBaseUpgrades(ctx, menuX + 10, menuY + 50, menuWidth - 20, ship, upgradeState);
    }

    // Instructions
    ctx.fillStyle = '#cccccc';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Click to select • UP/DOWN or TAB to navigate • ENTER to purchase • U to close', menuX + menuWidth / 2, menuY + menuHeight - 10);

    ctx.textAlign = 'left'; // Reset alignment
  }

  private static renderShipUpgrades(
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    width: number, 
    ship: Ship, 
    upgradeState: UpgradeState
  ): void {
    const upgrades = [
      { key: 'energyCapacity' as const, name: 'Energy Capacity', current: ship.maxEnergy },
      { key: 'energyRecharge' as const, name: 'Energy Recharge', current: ship.energyRechargeRate },
      { key: 'hullStrength' as const, name: 'Hull Strength', current: ship.maxHullStrength },
      { key: 'cargoCapacity' as const, name: 'Cargo Capacity', current: ship.maxCargoMaterials + ship.maxCargoGems },
      { key: 'weaponDamage' as const, name: 'Weapon Damage', current: ship.weaponDamage },
      { key: 'weaponFireRate' as const, name: 'Fire Rate', current: ship.weaponFireRate }
    ];

    let currentY = y;
    
    for (let i = 0; i < upgrades.length; i++) {
      const upgrade = upgrades[i];
      const isSelected = i === this.uiState.selectedUpgradeIndex;
      const level = upgradeState.shipUpgrades[upgrade.key];
      const cost = UpgradeSystem.calculateUpgradeCost(upgrade.key, level);
      const canAfford = UpgradeSystem.canAffordUpgrade(ship, upgrade.key, level);
      const isMaxLevel = UpgradeSystem.isMaxLevel(upgradeState, upgrade.key);

      // Upgrade box background
      if (isSelected) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.2)'; // Yellow highlight for selection
        ctx.fillRect(x + 5, currentY - 25, width - 10, 65);
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 5, currentY - 25, width - 10, 65);
      } else if (canAfford && !isMaxLevel) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
        ctx.fillRect(x + 5, currentY - 25, width - 10, 65);
      }

      // Upgrade name and level
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${upgrade.name} (Lv.${level})`, x + 10, currentY);

      // Current value
      ctx.fillStyle = '#cccccc';
      ctx.font = '12px monospace';
      ctx.fillText(`Current: ${upgrade.current.toFixed(2)}`, x + 10, currentY + 16);

      // Cost and benefit
      if (!isMaxLevel) {
        const costColor = canAfford ? '#00ff00' : '#ff4444';
        ctx.fillStyle = costColor;
        ctx.fillText(`Cost: ${cost.materials} Materials, ${cost.gems} Power Gems`, x + 10, currentY + 30);
        
        ctx.fillStyle = '#88cc88';
        ctx.fillText(`${UpgradeSystem.getUpgradeBenefit(upgrade.key)}`, x + 10, currentY + 44);
      } else {
        ctx.fillStyle = '#ffaa00';
        ctx.fillText('MAX LEVEL', x + 10, currentY + 30);
      }

      currentY += 70;
    }
  }

  private static renderBaseUpgrades(
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    width: number, 
    ship: Ship, 
    upgradeState: UpgradeState
  ): void {
    const upgrades = [
      { key: 'baseHP' as const, name: 'Base HP Bonus', level: upgradeState.baseUpgrades.hpBonus },
      { key: 'baseRegen' as const, name: 'Base Regen Bonus', level: upgradeState.baseUpgrades.regenBonus }
    ];

    let currentY = y;
    
    for (let i = 0; i < upgrades.length; i++) {
      const upgrade = upgrades[i];
      const isSelected = i === this.uiState.selectedUpgradeIndex;
      const cost = UpgradeSystem.calculateUpgradeCost(upgrade.key, upgrade.level);
      const canAfford = UpgradeSystem.canAffordUpgrade(ship, upgrade.key, upgrade.level);
      const isMaxLevel = UpgradeSystem.isMaxLevel(upgradeState, upgrade.key);

      // Upgrade box background
      if (isSelected) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)'; // Yellow highlight for selection
        ctx.fillRect(x + 5, currentY - 15, width - 10, 70);
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 5, currentY - 15, width - 10, 70);
      } else if (canAfford && !isMaxLevel) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
        ctx.fillRect(x + 5, currentY - 15, width - 10, 70);
      }

      // Upgrade name and level
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${upgrade.name} (Lv.${upgrade.level})`, x + 10, currentY);

      // Cost and benefit
      if (!isMaxLevel) {
        const costColor = canAfford ? '#00ff00' : '#ff4444';
        ctx.fillStyle = costColor;
        ctx.font = '12px monospace';
        ctx.fillText(`Cost: ${cost.materials} Materials, ${cost.gems} Power Gems`, x + 10, currentY + 16);
        
        ctx.fillStyle = '#88cc88';
        ctx.fillText(`${UpgradeSystem.getUpgradeBenefit(upgrade.key)}`, x + 10, currentY + 30);
      } else {
        ctx.fillStyle = '#ffaa00';
        ctx.font = '12px monospace';
        ctx.fillText('MAX LEVEL', x + 10, currentY + 16);
      }

      currentY += 80;
    }
  }

  static renderBotMenu(
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    ship: Ship, 
    botState: BotState
  ): void {
    if (!this.uiState.showBotMenu) return;

    const menuWidth = 400;
    const menuHeight = 250;
    const menuX = (canvas.width - menuWidth) / 2;
    const menuY = (canvas.height - menuHeight) / 2;

    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

    // Border
    ctx.strokeStyle = '#ff8800';
    ctx.lineWidth = 2;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

    // Title
    ctx.fillStyle = '#ff8800';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BOT MANAGEMENT', menuX + menuWidth / 2, menuY + 25);

    // Bot count
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Active Bots: ${botState.bots.length}/${botState.maxBots}`, menuX + 20, menuY + 50);

    // Purchase section
    const canPurchase = BotSystem.canPurchaseBot(ship, botState);
    const canShow = BotSystem.canShowPurchaseOption(ship, botState);
    const isSelected = this.uiState.selectedBotOption === 0;

    if (canShow) {
      // Purchase box background
      if (isSelected) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)'; // Yellow highlight for selection
        ctx.fillRect(menuX + 10, menuY + 65, menuWidth - 20, 75);
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(menuX + 10, menuY + 65, menuWidth - 20, 75);
      } else if (canPurchase) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
        ctx.fillRect(menuX + 10, menuY + 65, menuWidth - 20, 75);
      }

      ctx.fillStyle = '#cccccc';
      ctx.fillText('Purchase Defense Bot:', menuX + 20, menuY + 80);
      
      const costColor = canPurchase ? '#00ff00' : '#ff4444';
      ctx.fillStyle = costColor;
      ctx.fillText(`Cost: ${botState.purchaseCost.materials} Materials, ${botState.purchaseCost.gems} Power Gems`, menuX + 20, menuY + 98);

      if (!canPurchase) {
        if (botState.bots.length >= botState.maxBots) {
          ctx.fillStyle = '#ff4444';
          ctx.fillText('Maximum bots reached', menuX + 20, menuY + 116);
        } else {
          ctx.fillStyle = '#ff4444';
          ctx.fillText('Insufficient resources', menuX + 20, menuY + 116);
        }
      } else {
        ctx.fillStyle = '#88cc88';
        ctx.fillText('Click or press ENTER to purchase', menuX + 20, menuY + 130);
      }
    } else {
      ctx.fillStyle = '#666666';
      ctx.fillText(`Unlock at ${botState.cargoThreshold} total cargo`, menuX + 20, menuY + 80);
    }

    // Instructions
    ctx.fillStyle = '#cccccc';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Click to select • UP/DOWN or TAB to navigate • ENTER to select • P to close', menuX + menuWidth / 2, menuY + menuHeight - 10);

    ctx.textAlign = 'left'; // Reset alignment
  }

  static renderBotHUD(
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    botState: BotState
  ): void {
    if (botState.bots.length === 0) return;

    const x = 15;
    const y = canvas.height - 60;

    // Bot count indicator
    ctx.fillStyle = '#ff8800';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`Bots: ${botState.bots.length}/${botState.maxBots}`, x, y);

    // Bot status
    ctx.fillStyle = '#ffaa00';
    ctx.font = '12px monospace';
    ctx.fillText('Defending & Collecting', x, y + 18);
  }

  // Mouse interaction methods for menus
  static getUpgradeAtPosition(mouseX: number, mouseY: number, canvas: HTMLCanvasElement): number | null {
    if (!this.uiState.showUpgradeMenu) return null;

    const menuWidth = 500;
    const menuHeight = 600;
    const menuX = (canvas.width - menuWidth) / 2;
    const menuY = (canvas.height - menuHeight) / 2;
    
    // Enhanced debug logging with more precise coordinate tracking
    console.log('Upgrade Menu Precise Mouse Interaction:', {
      rawMousePosition: { x: mouseX, y: mouseY },
      canvasDetails: {
        width: canvas.width,
        height: canvas.height,
        pixelRatio: window.devicePixelRatio || 1
      },
      menuBounds: {
        x: menuX,
        y: menuY,
        width: menuWidth,
        height: menuHeight
      },
      menuState: {
        visible: this.uiState.showUpgradeMenu,
        selectedTab: this.uiState.selectedUpgradeTab
      }
    });
    
    // More robust bounds checking with pixel ratio consideration
    const pixelRatio = window.devicePixelRatio || 1;
    const adjustedMouseX = mouseX * pixelRatio;
    const adjustedMouseY = mouseY * pixelRatio;
    
    if (adjustedMouseX < menuX || adjustedMouseX > menuX + menuWidth || 
        adjustedMouseY < menuY || adjustedMouseY > menuY + menuHeight) {
      console.log('Mouse outside upgrade menu precise bounds');
      return null;
    }

    const startY = menuY + 50;
    const itemHeight = 70;
    const maxItems = this.uiState.selectedUpgradeTab === 'ship' ? 6 : 2;

    for (let i = 0; i < maxItems; i++) {
      const itemY = startY + (i * itemHeight);
      const itemRect = {
        x: menuX + 15,
        y: itemY - 25,
        width: menuWidth - 30,
        height: 65
      };

      // Ultra-detailed logging for menu item interaction
      const isMouseInside = 
        adjustedMouseX >= itemRect.x && 
        adjustedMouseX <= itemRect.x + itemRect.width &&
        adjustedMouseY >= itemRect.y && 
        adjustedMouseY <= itemRect.y + itemRect.height;

      console.log(`Menu Item ${i} Interaction Details:`, {
        itemRect,
        adjustedMousePosition: { x: adjustedMouseX, y: adjustedMouseY },
        isMouseInside,
        mouseRelativeToItem: {
          x: adjustedMouseX - itemRect.x,
          y: adjustedMouseY - itemRect.y
        }
      });

      if (isMouseInside) {
        console.log(`✅ Selected menu item: ${i}`);
        return i;
      }
    }

    console.log('❌ No menu item selected');
    return null;
  }
  // Add a method to help debug mouse interactions
  static debugMouseInteraction(mouseX: number, mouseY: number, canvas: HTMLCanvasElement): void {
    console.log('Global Mouse Interaction Debug:', {
      mousePosition: { x: mouseX, y: mouseY },
      canvasDimensions: {
        width: canvas.width,
        height: canvas.height
      },
      menuStates: {
        upgradeMenuOpen: this.uiState.showUpgradeMenu,
        botMenuOpen: this.uiState.showBotMenu
      }
    });
  }

  static getBotOptionAtPosition(mouseX: number, mouseY: number, canvas: HTMLCanvasElement): number | null {
    if (!this.uiState.showBotMenu) return null;

    const menuWidth = 400;
    const menuHeight = 250;
    const menuX = (canvas.width - menuWidth) / 2;
    const menuY = (canvas.height - menuHeight) / 2;
    
    // Check if mouse is within menu bounds
    if (mouseX < menuX || mouseX > menuX + menuWidth || 
        mouseY < menuY || mouseY > menuY + menuHeight) {
      return null;
    }

    // Check if clicking on the purchase bot option
    const purchaseRect = {
      x: menuX + 10,
      y: menuY + 65,
      width: menuWidth - 20,
      height: 75
    };

    if (mouseX >= purchaseRect.x && mouseX <= purchaseRect.x + purchaseRect.width &&
        mouseY >= purchaseRect.y && mouseY <= purchaseRect.y + purchaseRect.height) {
      return 0; // First and only option for now
    }

    return null;
  }

  static setSelectedUpgradeIndex(index: number): void {
    const maxOptions = this.uiState.selectedUpgradeTab === 'ship' ? 6 : 2;
    if (index >= 0 && index < maxOptions) {
      this.uiState.selectedUpgradeIndex = index;
    }
  }

  static setSelectedBotOption(index: number): void {
    if (index >= 0 && index < 1) { // Only one option for now
      this.uiState.selectedBotOption = index;
    }
  }
}
