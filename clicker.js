// Minimal cutscene hook (no-op on the standalone page)
const preferences = { skipAllCutscenes: false, skipReincarnationCutscene: false };
function triggerCutscene() {}

// Clicker Game Logic
let clickerScore = 0;
let clickTimes = [];
let prestigeMultiplier = 1;
let currentStage = 0;
let selectedClickerType = 0;
let selectedAutoClickerType = 0;

// Upgrade tracking per clicker/auto-clicker - dynamically set based on stage
let upgrades = {
  clickPower: [0, 0, 0],
  autoClick: [0, 0]
};

// Stage definitions
const stages = [
  {
    name: 'Young Rudeus',
    boss: 'Paul',
    bossImage: 'assets/game-assets/young-rudeus/stage 1/paul-boss-1.png',
    bossHealth: 100000000,
    clickers: [
      { name: 'Rudeus', image: 'assets/game-assets/young-rudeus/stage 1/Rudeus-clicker-1.png', maxLevel: 50, multiplier: 1 },
      { name: 'Roxy', image: 'assets/game-assets/young-rudeus/stage 1/Roxy-clicker-2.png', maxLevel: 50, multiplier: 2 },
      { name: 'Sylphy', image: 'assets/game-assets/young-rudeus/stage 1/Sylphy-clicker-3.png', maxLevel: 50, multiplier: 3 }
    ],
    autoClickers: [
      { name: 'Lilia', image: 'assets/game-assets/young-rudeus/stage 1/Lilia-autoclicker-1.png', maxLevel: 20, multiplier: 1 },
      { name: 'Zenith', image: 'assets/game-assets/young-rudeus/stage 1/Zenith-autoclicker-2.png', maxLevel: 20, multiplier: 2 }
    ],
    nextStage: 1
  },
  {
    name: 'Young Rudeus',
    boss: 'Ghislaine',
    bossImage: 'assets/game-assets/young-rudeus/stage 2/ghislaine-boss-2.png',
    bossHealth: 200000000,
    clickers: [
      { name: 'Rudeus', image: 'assets/game-assets/young-rudeus/stage 2/rudeus-clicker-1.png', maxLevel: 100, multiplier: 1 },
      { name: 'Eris', image: 'assets/game-assets/young-rudeus/stage 2/eris-clicker-4.png', maxLevel: 100, multiplier: 2 }
    ],
    autoClickers: [],
    nextStage: null
  }
];

let clickPowerByClicker = [1, 1, 1];
let autoClickRateByClicker = [0, 0];
let currentClickPower = 1;
let currentAutoClickRate = 0;
let autoClickInterval = null;
let bossHealth = 100000000;
let maxBossHealth = 100000000;

// Number formatting function
function formatNumber(num) {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 't';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'b';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'm';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'k';
  return num.toString();
}

const clickerButton = document.getElementById('clickerButton');
const clickerAsset = document.getElementById('clickerAsset');
const clickerScoreDisplay = document.getElementById('clickerScore');
const cpsDisplay = document.getElementById('cpsDisplay');
const clickPowerDisplay = document.getElementById('clickPower');
const resetClickerBtn = document.getElementById('resetClickerBtn');
const bossHealthDisplay = document.getElementById('bossHealth');
const bossHealthBar = document.getElementById('bossHealthBar');
const bossNameDisplay = document.getElementById('bossName');
const bossAssetDisplay = document.getElementById('bossAsset');
const bossAttackBtn = document.getElementById('bossAttackBtn');
const prestigeBtn = document.getElementById('prestigeBtn');
const prestigeMultiplierDisplay = document.getElementById('prestigeMultiplier');
const stageNameDisplay = document.getElementById('stageName');

// Clicker selection buttons
const clickerBtns = [
  document.getElementById('clicker0Btn'),
  document.getElementById('clicker1Btn'),
  document.getElementById('clicker2Btn')
];

// Upgrade buttons for click power
const upgradeClickPowerBtns = [
  document.getElementById('upgradeClickPower0'),
  document.getElementById('upgradeClickPower1'),
  document.getElementById('upgradeClickPower2')
];

// Upgrade buttons for auto-clickers
const upgradeAutoClickBtns = [
  document.getElementById('upgradeAutoClick0'),
  document.getElementById('upgradeAutoClick1')
];

// Level displays
const clickPowerLevelDisplays = [
  document.getElementById('clickPowerLevel0'),
  document.getElementById('clickPowerLevel1'),
  document.getElementById('clickPowerLevel2')
];

const autoClickLevelDisplays = [
  document.getElementById('autoClickLevel0'),
  document.getElementById('autoClickLevel1')
];

// Cost displays
const clickPowerCostDisplays = [
  document.getElementById('clickPowerCost0'),
  document.getElementById('clickPowerCost1'),
  document.getElementById('clickPowerCost2')
];

const autoClickCostDisplays = [
  document.getElementById('autoClickCost0') || document.createElement('span'),
  document.getElementById('autoClickCost1') || document.createElement('span')
];

function getClickPowerCost(clickerIndex) {
  const unlockCosts = [10, 500, 1000, 2000];
  const baseCost = unlockCosts[clickerIndex] || 10;

  if (upgrades.clickPower[clickerIndex] === 0) {
    return baseCost;
  }
  return Math.floor(baseCost * Math.pow(1.15, upgrades.clickPower[clickerIndex]));
}

function getAutoClickCost(autoClickerIndex) {
  const unlockCosts = [2000, 3000];
  const baseCost = unlockCosts[autoClickerIndex] || 2000;

  if (upgrades.autoClick[autoClickerIndex] === 0) {
    return baseCost;
  }
  return Math.floor(baseCost * Math.pow(1.2, upgrades.autoClick[autoClickerIndex]));
}

function switchClicker(clickerIndex) {
  selectedClickerType = clickerIndex;

  // Update button styles
  clickerBtns.forEach((btn, idx) => {
    if (!btn) return;
    if (idx === clickerIndex) {
      btn.className = 'w-16 h-16 rounded-lg border-2 border-blue-500 bg-blue-600 hover:bg-blue-700 transition-all';
    } else {
      btn.className = 'w-16 h-16 rounded-lg border-2 border-slate-600 bg-slate-700 hover:bg-slate-600 transition-all';
    }
  });

  // Update clicker button image using stage-specific clicker
  const currentStageData = stages[currentStage];
  const clicker = currentStageData.clickers[clickerIndex];
  clickerAsset.src = clicker ? clicker.image : '';

  // Recalculate current click power
  updateClickPower();
  updateUpgradeButtons();
}

function switchAutoClicker(autoClickerIndex) {
  selectedAutoClickerType = autoClickerIndex;
  updateClickPower();
}

function updateClickPower() {
  const currentStageData = stages[currentStage];

  // Calculate click power with stage-specific multipliers
  let clickPowerSum = 1; // Base click power

  currentStageData.clickers.forEach((clicker, idx) => {
    clickPowerSum += (upgrades.clickPower[idx] || 0) * clicker.multiplier;
  });

  currentClickPower = clickPowerSum * prestigeMultiplier;
  clickPowerDisplay.textContent = currentClickPower;
}

function buyClickPowerUpgrade(clickerIndex) {
  const currentStageData = stages[currentStage];
  const maxLevel = currentStageData.clickers[clickerIndex]?.maxLevel || 50;

  if (upgrades.clickPower[clickerIndex] >= maxLevel) return;
  const cost = getClickPowerCost(clickerIndex);
  if (clickerScore >= cost) {
    clickerScore -= cost;
    upgrades.clickPower[clickerIndex]++;
    clickerScoreDisplay.textContent = formatNumber(clickerScore);
    clickPowerCostDisplays[clickerIndex].textContent = getClickPowerCost(clickerIndex);
    clickPowerLevelDisplays[clickerIndex].textContent = upgrades.clickPower[clickerIndex];
    updateClickPower();
    updateUpgradeButtons();
  }
}

function buyAutoClickUpgrade(autoClickerIndex) {
  const currentStageData = stages[currentStage];
  const maxLevel = currentStageData.autoClickers[autoClickerIndex]?.maxLevel || 20;

  if (upgrades.autoClick[autoClickerIndex] >= maxLevel) return;
  const cost = getAutoClickCost(autoClickerIndex);
  if (clickerScore >= cost) {
    clickerScore -= cost;
    upgrades.autoClick[autoClickerIndex]++;
    autoClickLevelDisplays[autoClickerIndex].textContent = upgrades.autoClick[autoClickerIndex];

    // Update auto-click rate for this type
    autoClickRateByClicker[autoClickerIndex] = upgrades.autoClick[autoClickerIndex];
    currentAutoClickRate = autoClickRateByClicker[selectedAutoClickerType];

    if (upgrades.autoClick[autoClickerIndex] === 1) startAutoClick();
    updateUpgradeButtons();
  }
}

function updateUpgradeButtons() {
  const currentStageData = stages[currentStage];

  // Click power buttons (dynamic based on stage)
  for (let i = 0; i < currentStageData.clickers.length; i++) {
    const clicker = currentStageData.clickers[i];
    const cost = getClickPowerCost(i);
    const canBuy = upgrades.clickPower[i] < clicker.maxLevel && clickerScore >= cost;

    upgradeClickPowerBtns[i].className = `p-3 rounded-lg text-left transition-all flex gap-3 items-start ${canBuy ? 'bg-green-600 hover:bg-green-700 cursor-pointer' : 'bg-slate-600 opacity-50 cursor-not-allowed'}`;
    upgradeClickPowerBtns[i].disabled = !canBuy;
    upgradeClickPowerBtns[i].style.display = 'flex';

    const imagePath = clicker.image;
    const icon = i === 0 ? '🧙' : i === 1 ? '📚' : i === 2 ? '👑' : '⚔️';

    if (upgrades.clickPower[i] >= clicker.maxLevel) {
      upgradeClickPowerBtns[i].className = 'p-3 rounded-lg text-left bg-slate-700 opacity-50 cursor-not-allowed flex gap-3 items-start';
      upgradeClickPowerBtns[i].innerHTML = `<img src="${imagePath}" alt="" class="w-16 h-16 object-cover rounded"><div class="flex-1"><div class="text-xs mb-1">${icon} ${clicker.name}</div><div class="font-semibold text-sm">Click Power</div><div class="text-xs opacity-75">MAX LEVEL</div></div>`;
    } else {
      upgradeClickPowerBtns[i].innerHTML = `
        <img src="${imagePath}" alt="" class="w-16 h-16 object-cover rounded">
        <div class="flex-1">
          <div class="text-xs mb-1">${icon} ${clicker.name}</div>
          <div class="font-semibold text-sm">Click Power</div>
          <div class="text-xs opacity-75">Level: ${upgrades.clickPower[i]}/${clicker.maxLevel}</div>
          <div class="text-sm font-bold">Cost: ${formatNumber(cost)}</div>
        </div>
      `;
    }
  }

  // Hide unused clicker buttons
  for (let i = currentStageData.clickers.length; i < 3; i++) {
    upgradeClickPowerBtns[i].style.display = 'none';
  }

  // Auto-clicker buttons (dynamic based on stage)
  for (let i = 0; i < currentStageData.autoClickers.length; i++) {
    const autoClicker = currentStageData.autoClickers[i];
    const cost = getAutoClickCost(i);
    const canBuy = upgrades.autoClick[i] < autoClicker.maxLevel && clickerScore >= cost;

    upgradeAutoClickBtns[i].className = `p-3 rounded-lg text-left transition-all flex gap-3 items-start ${canBuy ? 'bg-purple-600 hover:bg-purple-700 cursor-pointer' : 'bg-slate-600 opacity-50 cursor-not-allowed'}`;
    upgradeAutoClickBtns[i].disabled = !canBuy;
    upgradeAutoClickBtns[i].style.display = 'flex';

    const imagePath = autoClicker.image;
    const icon = i === 0 ? '💜' : '🔮';

    if (upgrades.autoClick[i] >= autoClicker.maxLevel) {
      upgradeAutoClickBtns[i].className = 'p-3 rounded-lg text-left bg-slate-700 opacity-50 cursor-not-allowed flex gap-3 items-start';
      upgradeAutoClickBtns[i].innerHTML = `<img src="${imagePath}" alt="" class="w-16 h-16 object-cover rounded"><div class="flex-1"><div class="text-xs mb-1">${icon} ${autoClicker.name}</div><div class="font-semibold text-sm">Auto Clicker</div><div class="text-xs opacity-75">MAX LEVEL</div></div>`;
    } else {
      upgradeAutoClickBtns[i].innerHTML = `
        <img src="${imagePath}" alt="" class="w-16 h-16 object-cover rounded">
        <div class="flex-1">
          <div class="text-xs mb-1">${icon} ${autoClicker.name}</div>
          <div class="font-semibold text-sm">Auto Clicker</div>
          <div class="text-xs opacity-75">Level: ${upgrades.autoClick[i]}/${autoClicker.maxLevel}</div>
          <div class="text-sm font-bold">Cost: ${formatNumber(cost)}</div>
        </div>
      `;
    }
  }

  // Hide unused auto-clicker buttons
  for (let i = currentStageData.autoClickers.length; i < 2; i++) {
    upgradeAutoClickBtns[i].style.display = 'none';
  }

  // Reincarnation button
  const allClickersMaxed = upgrades.clickPower.every((level, idx) => {
    return idx >= currentStageData.clickers.length || level >= currentStageData.clickers[idx].maxLevel;
  });

  const allAutoClickersMaxed = upgrades.autoClick.every((level, idx) => {
    return idx >= currentStageData.autoClickers.length || level >= currentStageData.autoClickers[idx].maxLevel;
  });

  const canPrestige = allClickersMaxed && allAutoClickersMaxed;

  prestigeBtn.className = `w-full px-3 py-2 transition-all ${canPrestige ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 cursor-pointer' : 'bg-slate-600 opacity-50 cursor-not-allowed'}`;
  prestigeBtn.disabled = !canPrestige;

  if (canPrestige) {
    prestigeBtn.innerHTML = '🔁 Reincarnate (2x) - Ready!';
  } else {
    let clickPowerNeeded = 0;
    currentStageData.clickers.forEach((clicker, idx) => {
      clickPowerNeeded += Math.max(0, clicker.maxLevel - (upgrades.clickPower[idx] || 0));
    });

    let autoClickNeeded = 0;
    currentStageData.autoClickers.forEach((autoClicker, idx) => {
      autoClickNeeded += Math.max(0, autoClicker.maxLevel - (upgrades.autoClick[idx] || 0));
    });

    prestigeBtn.innerHTML = `🔁 Reincarnation (LOCKED) - Need ${clickPowerNeeded} click levels, ${autoClickNeeded} auto levels`;
  }

  // Update boss visibility
  updateBossVisibility();
}

function startAutoClick() {
  if (autoClickInterval) clearInterval(autoClickInterval);
  autoClickInterval = setInterval(() => {
    const currentStageData = stages[currentStage];

    // Calculate total auto-click rate using stage-specific multipliers
    let totalAutoClickRate = 0;
    currentStageData.autoClickers.forEach((autoClicker, idx) => {
      totalAutoClickRate += (upgrades.autoClick[idx] || 0) * autoClicker.multiplier;
    });

    clickerScore += totalAutoClickRate * currentClickPower;
    clickerScoreDisplay.textContent = formatNumber(clickerScore);
  }, 1000);
}

function updateBossHealth(damage) {
  const stage = stages[currentStage];
  if (stage.hasOwnProperty('hasBoss') && stage.hasBoss === false) return;
  bossHealth = Math.max(0, bossHealth - damage);
  bossHealthDisplay.textContent = formatNumber(bossHealth);
  const healthPercent = (bossHealth / maxBossHealth) * 100;
  bossHealthBar.style.width = healthPercent + '%';

  // Check if boss is defeated
  if (bossHealth === 0) {
    progressToNextStage();
  }
}

function updateBossVisibility() {
  const currentStageData = stages[currentStage];
  if (currentStageData.hasOwnProperty('hasBoss') && currentStageData.hasBoss === false) {
    bossAssetDisplay.style.display = 'none';
    bossNameDisplay.style.display = 'none';
    bossHealthDisplay.style.display = 'none';
    if (bossHealthBar && bossHealthBar.parentElement) bossHealthBar.parentElement.style.display = 'none';
    bossAttackBtn.style.display = 'none';
    bossAttackBtn.disabled = true;
    return;
  } else {
    bossAssetDisplay.style.display = '';
    bossNameDisplay.style.display = '';
    bossHealthDisplay.style.display = '';
    if (bossHealthBar && bossHealthBar.parentElement) bossHealthBar.parentElement.style.display = '';
    bossAttackBtn.style.display = '';
  }

  const allClickersMaxed = upgrades.clickPower.every((level, idx) => {
    return idx >= currentStageData.clickers.length || level >= currentStageData.clickers[idx].maxLevel;
  });

  const allAutoClickersMaxed = upgrades.autoClick.every((level, idx) => {
    return idx >= currentStageData.autoClickers.length || level >= currentStageData.autoClickers[idx].maxLevel;
  });

  const allMaxed = allClickersMaxed && allAutoClickersMaxed;

  if (allMaxed) {
    bossAssetDisplay.style.filter = 'none';
    bossNameDisplay.style.filter = 'none';
    bossAttackBtn.disabled = false;
    bossAttackBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  } else {
    bossAssetDisplay.style.filter = 'brightness(0)';
    bossNameDisplay.style.filter = 'blur(4px)';
    bossAttackBtn.disabled = true;
    bossAttackBtn.classList.add('opacity-50', 'cursor-not-allowed');
  }
}

function progressToNextStage() {
  const stage = stages[currentStage];

  if (stage.nextStage !== null) {
    currentStage = stage.nextStage;
    alert('Boss defeated! Moving to next stage...');
    resetForNewStage();
  } else {
    triggerCutscene('displacement-incident', { stage: currentStage });
    fullResetToRudeusOnly();
  }
}

function fullResetToRudeusOnly() {
  if (autoClickInterval) clearInterval(autoClickInterval);

  clickerScore = 0;
  clickTimes = [];
  prestigeMultiplier = 1;
  prestigeMultiplierDisplay.textContent = prestigeMultiplier + 'x';

  stages.length = 0;
  stages.push({
    name: 'Teen Rudeus',
    hasBoss: false,
    boss: '',
    bossImage: '',
    bossHealth: 0,
    clickers: [
      { name: 'Rudeus', image: 'assets/game-assets/teen-rudeus/rudeus-clicker-1.png', maxLevel: 50, multiplier: 1 }
    ],
    autoClickers: [],
    nextStage: null
  });

  currentStage = 0;
  resetForNewStage();
}

function resetForNewStage() {
  const stage = stages[currentStage];

  stageNameDisplay.textContent = stage.name;
  bossNameDisplay.textContent = stage.boss || '';
  bossAssetDisplay.src = stage.bossImage || '';

  clickerScore = 0;

  upgrades.clickPower = new Array(stage.clickers.length).fill(0);
  upgrades.autoClick = new Array(stage.autoClickers.length).fill(0);

  const hasBoss = stage.hasOwnProperty('hasBoss') ? stage.hasBoss : true;
  maxBossHealth = hasBoss ? (stage.bossHealth || 0) : 0;
  bossHealth = maxBossHealth;

  if (autoClickInterval) clearInterval(autoClickInterval);

  clickerScoreDisplay.textContent = '0';
  cpsDisplay.textContent = '0';
  if (hasBoss) {
    bossHealthDisplay.textContent = formatNumber(maxBossHealth);
    bossHealthBar.style.width = '100%';
  } else {
    bossHealthDisplay.textContent = '';
    bossHealthBar.style.width = '0%';
  }

  updateClickPower();
  updateUpgradeButtons();
  updateBossVisibility();
}

function reincarnate() {
  const currentStageData = stages[currentStage];

  const allClickersMaxed = upgrades.clickPower.every((level, idx) => {
    return idx >= currentStageData.clickers.length || level >= currentStageData.clickers[idx].maxLevel;
  });

  const allAutoClickersMaxed = upgrades.autoClick.every((level, idx) => {
    return idx >= currentStageData.autoClickers.length || level >= currentStageData.autoClickers[idx].maxLevel;
  });

  if (!allClickersMaxed || !allAutoClickersMaxed) {
    return;
  }

  prestigeMultiplier *= 2;
  prestigeMultiplierDisplay.textContent = prestigeMultiplier + 'x';
  triggerCutscene('reincarnation', { multiplier: prestigeMultiplier });

  clickerScore = 0;
  clickTimes = [];
  currentStage = 0;

  if (autoClickInterval) clearInterval(autoClickInterval);

  const stage = stages[0];
  stageNameDisplay.textContent = stage.name;
  bossNameDisplay.textContent = stage.boss;
  bossAssetDisplay.src = stage.bossImage;

  maxBossHealth = stage.bossHealth;
  bossHealth = maxBossHealth;
  upgrades.clickPower = new Array(stage.clickers.length).fill(0);
  upgrades.autoClick = new Array(stage.autoClickers.length).fill(0);

  clickerScoreDisplay.textContent = '0';
  cpsDisplay.textContent = '0';
  bossHealthDisplay.textContent = formatNumber(maxBossHealth);
  bossHealthBar.style.width = '100%';

  updateClickPower();
  updateUpgradeButtons();

  const totalAutoClickRate = (upgrades.autoClick[0] || 0) + (upgrades.autoClick[1] || 0);
  if (totalAutoClickRate > 0) {
    startAutoClick();
  }
}

function updateCPS() {
  const now = Date.now();
  clickTimes = clickTimes.filter(time => now - time < 1000);

  const currentStageData = stages[currentStage];

  let totalAutoClickRate = 0;
  currentStageData.autoClickers.forEach((autoClicker, idx) => {
    totalAutoClickRate += (upgrades.autoClick[idx] || 0) * autoClicker.multiplier;
  });

  cpsDisplay.textContent = (clickTimes.length + totalAutoClickRate).toFixed(1);
}

// Clicker button click - only adds score, doesn't damage boss
clickerButton.addEventListener('click', () => {
  clickerScore += currentClickPower;
  clickerScoreDisplay.textContent = formatNumber(clickerScore);
  clickTimes.push(Date.now());
  updateCPS();

  // Add click animation
  clickerButton.style.transform = 'scale(0.95)';
  setTimeout(() => {
    clickerButton.style.transform = 'scale(1)';
  }, 100);

  updateUpgradeButtons();
});

// Boss attack button - damages boss and gives score
bossAttackBtn.addEventListener('click', () => {
  if (bossAttackBtn.disabled) return;
  const damage = currentClickPower * 10;
  updateBossHealth(damage);
  clickerScore += Math.floor(damage / 10);
  clickerScoreDisplay.textContent = formatNumber(clickerScore);
  updateUpgradeButtons();

  // Add attack animation
  bossAttackBtn.style.transform = 'scale(0.95)';
  setTimeout(() => {
    bossAttackBtn.style.transform = 'scale(1)';
  }, 100);
});

// Clicker selection buttons
clickerBtns.forEach((btn, idx) => {
  if (!btn) return;
  btn.addEventListener('click', () => switchClicker(idx));
});

// Click power upgrade buttons
upgradeClickPowerBtns.forEach((btn, idx) => {
  btn.addEventListener('click', () => buyClickPowerUpgrade(idx));
});

// Auto-clicker upgrade buttons
upgradeAutoClickBtns.forEach((btn, idx) => {
  btn.addEventListener('click', () => buyAutoClickUpgrade(idx));
});

// Other buttons
prestigeBtn.addEventListener('click', reincarnate);

resetClickerBtn.addEventListener('click', () => {
  upgrades = {
    clickPower: [1, 1, 1],
    autoClick: [0, 0]
  };
  clickerScore = 0;
  clickTimes = [];
  currentStage = 0;
  bossHealth = maxBossHealth;
  prestigeMultiplier = 1;

  if (autoClickInterval) clearInterval(autoClickInterval);

  const stage = stages[0];
  stageNameDisplay.textContent = stage.name;
  bossNameDisplay.textContent = stage.boss;
  bossAssetDisplay.src = stage.bossImage;
  prestigeMultiplierDisplay.textContent = '1x';

  clickerScoreDisplay.textContent = '0';
  cpsDisplay.textContent = '0';
  bossHealthDisplay.textContent = formatNumber(maxBossHealth);
  bossHealthBar.style.width = '100%';

  switchClicker(0);
  updateUpgradeButtons();
});

// Update CPS display every 100ms
setInterval(updateCPS, 100);

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const stage = stages[currentStage];
  stageNameDisplay.textContent = stage.name;
  bossNameDisplay.textContent = stage.boss || '';
  bossAssetDisplay.src = stage.bossImage || '';
  maxBossHealth = stage.bossHealth || 0;
  bossHealth = maxBossHealth;
  prestigeMultiplierDisplay.textContent = prestigeMultiplier + 'x';

  clickerScoreDisplay.textContent = '0';
  cpsDisplay.textContent = '0';
  bossHealthDisplay.textContent = formatNumber(maxBossHealth);
  bossHealthBar.style.width = '100%';

  switchClicker(0);
  updateUpgradeButtons();
  updateBossVisibility();
});
