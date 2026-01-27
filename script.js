// Authentication Logic
const authModal = document.getElementById('authModal');
const authForm = document.getElementById('authForm');
const totpInput = document.getElementById('totpInput');
const dashboard = document.getElementById('dashboard');
const logoutBtn = document.getElementById('logoutBtn');
const showSetupBtn = document.getElementById('showSetupBtn');
const hideSetupBtn = document.getElementById('hideSetupBtn');
const setupPanel = document.getElementById('setupPanel');
const qrCodeContainer = document.getElementById('qrCodeContainer');
const dateTimeElement = document.getElementById('dateTime');

// Update date and time
function updateDateTime() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
  dateTimeElement.textContent = now.toLocaleDateString('en-US', options);
}

// Update date/time every second
updateDateTime();
setInterval(updateDateTime, 1000);

// Lock screen backgrounds - add new ones here for future additions
const lockScreenBackgrounds = [
  'assets/backgrounds/lock-screen/lock-screen-background.gif',
  'assets/backgrounds/lock-screen/lock-screen-background-2.gif',
  'assets/backgrounds/lock-screen/lock-screen-background-3.gif'
];

// Main dashboard backgrounds - add new ones here for future additions
const mainDashboardBackgrounds = [
  'assets/backgrounds/main-dashboard/main-dashboard-background.gif',
  'assets/backgrounds/main-dashboard/main-dashboard-background-2.gif',
  'assets/backgrounds/main-dashboard/main-dashboard-background-3.gif'
];

// Function to get random lock screen background
function getRandomLockScreenBackground() {
  return lockScreenBackgrounds[Math.floor(Math.random() * lockScreenBackgrounds.length)];
}

// Function to get random main dashboard background
function getRandomMainDashboardBackground() {
  return mainDashboardBackgrounds[Math.floor(Math.random() * mainDashboardBackgrounds.length)];
}

// Check if user is already authenticated
window.addEventListener('load', async () => {
  if (authAPI.isAuthenticated()) {
    const result = await authAPI.verify();
    if (result.valid) {
      showDashboard();
    } else {
      showAuthModal();
    }
  } else {
    showAuthModal();
  }
});

// Handle authentication form submission
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const enteredCode = totpInput.value;
  const submitButton = authForm.querySelector('button[type="submit"]');
  
  // Validate 6-digit code
  if (!/^\d{6}$/.test(enteredCode)) {
    totpInput.classList.add('shake');
    setTimeout(() => {
      totpInput.classList.remove('shake');
    }, 500);
    return;
  }
  
  // Disable button during submission
  submitButton.disabled = true;
  submitButton.textContent = 'Authenticating...';
  
  try {
    const result = await authAPI.login(enteredCode);
    
    if (result.success) {
      authModal.style.display = 'none';
      showDashboard();
      totpInput.value = '';
    } else {
      // Wrong code - show error animation
      totpInput.classList.add('shake');
      totpInput.value = '';
      
      setTimeout(() => {
        totpInput.classList.remove('shake');
      }, 500);
    }
  } catch (error) {
    console.error('Authentication error:', error);
    totpInput.classList.add('shake');
    totpInput.value = '';
    
    setTimeout(() => {
      totpInput.classList.remove('shake');
    }, 500);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Unlock Dashboard';
  }
});

// Setup QR Code handlers
showSetupBtn.addEventListener('click', async () => {
  setupPanel.classList.remove('hidden');
  authForm.classList.add('hidden');
  const result = await authAPI.getSetupQRCode();
  if (result.success) {
    qrCodeContainer.innerHTML = `<img src="${result.qrCode}" alt="QR Code" class="w-64 h-64 mx-auto">`;
  } else {
    qrCodeContainer.innerHTML = `<p class="text-red-400">Error: ${result.error}</p>`;
  }
});

hideSetupBtn.addEventListener('click', () => {
  setupPanel.classList.add('hidden');
  authForm.classList.remove('hidden');
  qrCodeContainer.innerHTML = '';
  totpInput.focus();
});

// Show authentication modal
function showAuthModal() {
  authModal.style.display = 'flex';
  dashboard.classList.add('hidden');
  document.body.classList.add('auth-active');
  
  // Set random lock screen background
  const randomBackground = getRandomLockScreenBackground();
  const bgDiv = authModal.querySelector('[style*="background-image"]');
  if (bgDiv) {
    bgDiv.style.backgroundImage = `url('${randomBackground}')`;
  }
  
  totpInput.focus();
}

// Show dashboard
function showDashboard() {
  dashboard.classList.remove('hidden');
  authModal.style.display = 'none';
  document.body.classList.remove('auth-active');
  
  // Set random main dashboard background
  const randomBackground = getRandomMainDashboardBackground();
  document.body.style.backgroundImage = `url('${randomBackground}')`;
}

// Logout functionality
logoutBtn.addEventListener('click', async () => {
  await authAPI.logout();
  document.body.classList.add('auth-active');
  authModal.style.display = 'flex';
  dashboard.classList.add('hidden');
  
  // Set random lock screen background on logout
  const randomBackground = getRandomLockScreenBackground();
  const bgDiv = authModal.querySelector('[style*="background-image"]');
  if (bgDiv) {
    bgDiv.style.backgroundImage = `url('${randomBackground}')`;
  }
  
  totpInput.value = '';
  totpInput.focus();
});

// Add shake animation for CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }
  
  .shake {
    animation: shake 0.5s !important;
    border-color: #dc2626 !important;
  }
`;
document.head.appendChild(style);

// Server Details Modal Logic
const detailsModal = document.getElementById('detailsModal');
const closeModal = document.getElementById('closeModal');
const detailsContent = document.getElementById('detailsContent');
const modalTitle = document.getElementById('modalTitle');
const modalIcon = document.getElementById('modalIcon');
const visitBtn = document.getElementById('visitBtn');
const copyIPBtn = document.getElementById('copyIPBtn');
const serviceCards = document.querySelectorAll('[data-server]');
const guidesList = document.getElementById('guidesList');

// Guides data - easily add or remove guides here
const guidesData = [
  {
    title: 'JDownloader + FitGirlRepacks',
    description: 'Guide to using JDownloader to download FitGirl repacks',
    icon: 'assets/icons/fitgirl-main-icon.jpg',
    url: 'https://docs.google.com/document/d/1VYM_8Ybuueo24itHBfm2aDIyQCQKr45fS3X697di-8c/edit?usp=sharing',
    category: 'Download',
    isImage: true
  },
  {
    title: 'Recommended Sites',
    description: 'Curated list of recommended websites and resources',
    icon: 'assets/icons/recommended-home-icon.png',
    url: 'https://fmhy.net/',
    category: 'Resources',
    isImage: true
  },
  {
    title: 'Mambo Break',
    description: 'Watch the classic Mambo Break video',
    icon: '🎵',
    url: 'https://www.youtube.com/watch?v=h_umrMwoE_E',
    category: 'Video'
  },
  {
    title: 'Clicker Game',
    description: 'Simple clicker game to pass the time',
    icon: '🎮',
    url: '#',
    category: 'Game',
    isGame: true
  }
];

// Server information database
const serverData = {
  minecraft: {
    name: 'Minecraft Server',
    icon: '🎮',
    ip: '192.168.1.50',
    port: '25565',
    url: 'http://192.168.1.50:25565',
    status: 'Online',
    description: 'Survival + mods',
    backgroundClass: 'minecraft-server-bg',
    details: [
      { label: 'Type', value: 'Java Edition' },
      { label: 'Version', value: '1.20.1' },
      { label: 'Max Players', value: '20' },
      { label: 'World', value: 'Survival World' }
    ]
  },
  jellyfin: {
    name: 'Jellyfin',
    icon: '🎬',
    ip: '192.168.1.50',
    port: '8096',
    url: 'http://192.168.1.50:8096',
    status: 'Online (LAN)',
    description: 'Media streaming',
    backgroundClass: 'jellyfin-server-bg',
    details: [
      { label: 'Purpose', value: 'Media Server' },
      { label: 'Access', value: 'LAN only' },
      { label: 'Library', value: 'Movies & Shows' },
      { label: 'Version', value: 'Latest' }
    ]
  }
};

// Open modal when clicking on service cards
serviceCards.forEach(card => {
  card.addEventListener('click', (e) => {
    e.preventDefault();
    const serverType = card.getAttribute('data-server');
    showServerDetails(serverType);
  });
});

// Show server details modal
function showServerDetails(serverType) {
  const server = serverData[serverType];
  
  // Set the icon to the corresponding server icon
  modalIcon.src = `assets/icons/${serverType}-server-icon.gif`;
  modalIcon.alt = server.name;
  modalTitle.textContent = server.name;
  
  // Build details HTML
  let detailsHTML = `
    <div class="bg-slate-700 rounded-lg p-4 mb-4">
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p class="text-slate-400">IP Address</p>
          <p class="text-slate-100 font-mono font-semibold">${server.ip}</p>
        </div>
        <div>
          <p class="text-slate-400">Port</p>
          <p class="text-slate-100 font-mono font-semibold">${server.port}</p>
        </div>
      </div>
    </div>
    
    <div class="bg-slate-700 rounded-lg p-4 mb-4">
      <p class="text-slate-400 text-sm mb-2">Full Address</p>
      <p class="text-slate-100 font-mono text-sm break-all">${server.ip}:${server.port}</p>
    </div>
  `;
  
  // Add additional details
  if (server.details.length > 0) {
    detailsHTML += '<div class="bg-slate-700 rounded-lg p-4">';
    server.details.forEach(detail => {
      detailsHTML += `
        <div class="flex justify-between items-center py-2 border-b border-slate-600 last:border-b-0">
          <span class="text-slate-400">${detail.label}</span>
          <span class="text-slate-100 font-semibold">${detail.value}</span>
        </div>
      `;
    });
    detailsHTML += '</div>';
  }
  
    
    // Add background class to modal if available
    if (server.backgroundClass) {
      detailsModal.style.backgroundImage = `url('assets/backgrounds/${serverType}-server-background.gif')`;
      detailsModal.style.backgroundSize = '100% 100%';
      detailsModal.style.backgroundRepeat = 'no-repeat';
      detailsModal.style.backgroundAttachment = 'fixed';
      detailsModal.style.backgroundPosition = 'top center';
    }
    detailsContent.innerHTML = detailsHTML;
  
  // Set button actions
  visitBtn.onclick = () => {
    window.open(server.url, '_blank');
  };
  
  copyIPBtn.onclick = () => {
    const textToCopy = `${server.ip}:${server.port}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      const originalText = copyIPBtn.textContent;
      copyIPBtn.textContent = '✓ Copied!';
      setTimeout(() => {
        copyIPBtn.textContent = originalText;
      }, 2000);
    });
  };
  
  // Show modal
  detailsModal.classList.remove('hidden');
}

// Close modal
closeModal.addEventListener('click', () => {
  detailsModal.classList.add('hidden');
  detailsModal.style.backgroundImage = '';
  detailsModal.style.backgroundSize = '';
  detailsModal.style.backgroundRepeat = '';
  detailsModal.style.backgroundAttachment = '';
  detailsModal.style.backgroundPosition = '';
});

// Close modal when clicking outside
detailsModal.addEventListener('click', (e) => {
  if (e.target === detailsModal) {
    detailsModal.classList.add('hidden');
    detailsModal.style.backgroundImage = '';
    detailsModal.style.backgroundSize = '';
    detailsModal.style.backgroundRepeat = '';
    detailsModal.style.backgroundAttachment = '';
    detailsModal.style.backgroundPosition = '';
  }
});

// Render guides
function renderGuides() {
  guidesList.innerHTML = '';
  
  guidesData.forEach((guide, index) => {
    let guideCard;
    
    if (guide.isGame) {
      // Create game card as a button
      guideCard = document.createElement('button');
      guideCard.className = 'service-card rounded-xl bg-slate-800 hover:bg-slate-700 hover:shadow-xl p-5 shadow-lg cursor-pointer block transition-all w-full text-left';
      guideCard.onclick = openClickerGame;
    } else {
      // Create regular link card
      guideCard = document.createElement('a');
      guideCard.href = guide.url;
      guideCard.target = '_blank';
      guideCard.className = 'service-card rounded-xl bg-slate-800 hover:bg-slate-700 hover:shadow-xl p-5 shadow-lg cursor-pointer block transition-all';
    }
    
    const iconHTML = guide.isImage 
      ? `<img src="${guide.icon}" alt="${guide.title}" class="w-10 h-10 rounded object-cover">`
      : `<span class="text-2xl">${guide.icon}</span>`;
    
    guideCard.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">${guide.title}</h3>
        <div class="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
          ${iconHTML}
        </div>
      </div>
      <p class="text-slate-400 text-sm mb-3">${guide.description}</p>
      <span class="inline-block px-3 py-1 bg-slate-700 rounded-full text-xs text-slate-300">${guide.category}</span>
    `;
    guidesList.appendChild(guideCard);
  });
}

// Clicker Game Logic
let clickerScore = 0;
let clickTimes = [];
let prestigeMultiplier = 1;
let currentStage = 0;
let selectedClickerType = 0;
let selectedAutoClickerType = 0;

// Stage definitions
const stages = [
  {
    name: 'Young Rudeus',
    boss: 'Paul',
    bossImage: 'assets/game-assets/young-rudeus/paul-boss-1.png',
    nextStage: 1
  },
  {
    name: 'Teen Rudeus',
    boss: 'Ghislaine',
    bossImage: '', // Blank stage placeholder
    nextStage: null
  }
];

// Clicker definitions (3 types)
const clickers = [
  { name: 'Rudeus', image: 'assets/game-assets/young-rudeus/Rudeus-clicker-1.png' },
  { name: 'Roxy', image: 'assets/game-assets/young-rudeus/Roxy-clicker-2.png' },
  { name: 'Sylphy', image: 'assets/game-assets/young-rudeus/Sylphy-clicker-3.png' }
];

// Auto-clicker definitions (2 types)
const autoClickers = [
  { name: 'Lilia', image: 'assets/game-assets/young-rudeus/Lilia-autoclicker-1.png' },
  { name: 'Zenith', image: 'assets/game-assets/young-rudeus/Zenith-autoclicker-2.png' }
];

// Upgrade tracking per clicker/auto-clicker
let upgrades = {
  clickPower: [1, 1, 1], // 3 clickers
  autoClick: [0, 0]      // 2 auto-clickers
};

let clickPowerByClicker = [1, 1, 1];
let autoClickRateByClicker = [0, 0];
let currentClickPower = 1;
let currentAutoClickRate = 0;
let autoClickInterval = null;
let bossHealth = 1000000;
let maxBossHealth = 1000000;

const clickerModal = document.getElementById('clickerModal');
const clickerButton = document.getElementById('clickerButton');
const clickerAsset = document.getElementById('clickerAsset');
const clickerScoreDisplay = document.getElementById('clickerScore');
const cpsDisplay = document.getElementById('cpsDisplay');
const clickPowerDisplay = document.getElementById('clickPower');
const resetClickerBtn = document.getElementById('resetClickerBtn');
const closeClickerModal = document.getElementById('closeClickerModal');
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
  return Math.floor(10 * Math.pow(1.15, upgrades.clickPower[clickerIndex] - 1));
}

function getAutoClickCost(autoClickerIndex) {
  return Math.floor(1000 * Math.pow(1.2, upgrades.autoClick[autoClickerIndex]));
}

function switchClicker(clickerIndex) {
  selectedClickerType = clickerIndex;
  
  // Update button styles
  clickerBtns.forEach((btn, idx) => {
    if (idx === clickerIndex) {
      btn.className = 'w-16 h-16 rounded-lg border-2 border-blue-500 bg-blue-600 hover:bg-blue-700 transition-all';
    } else {
      btn.className = 'w-16 h-16 rounded-lg border-2 border-slate-600 bg-slate-700 hover:bg-slate-600 transition-all';
    }
  });
  
  // Update clicker button image
  clickerAsset.src = clickers[clickerIndex].image;
  
  // Recalculate current click power
  updateClickPower();
  updateUpgradeButtons();
}

function switchAutoClicker(autoClickerIndex) {
  selectedAutoClickerType = autoClickerIndex;
  updateClickPower();
}

function updateClickPower() {
  currentClickPower = upgrades.clickPower[selectedClickerType] * prestigeMultiplier;
  clickPowerDisplay.textContent = currentClickPower;
}

function buyClickPowerUpgrade(clickerIndex) {
  if (upgrades.clickPower[clickerIndex] >= 50) return;
  const cost = getClickPowerCost(clickerIndex);
  if (clickerScore >= cost) {
    clickerScore -= cost;
    upgrades.clickPower[clickerIndex]++;
    clickerScoreDisplay.textContent = clickerScore;
    clickPowerCostDisplays[clickerIndex].textContent = getClickPowerCost(clickerIndex);
    clickPowerLevelDisplays[clickerIndex].textContent = upgrades.clickPower[clickerIndex];
    updateClickPower();
    updateUpgradeButtons();
  }
}

function buyAutoClickUpgrade(autoClickerIndex) {
  if (upgrades.autoClick[autoClickerIndex] >= 20) return;
  if (clickerScore < 1000) return;
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
  // Click power buttons (3)
  for (let i = 0; i < 3; i++) {
    const cost = getClickPowerCost(i);
    const canBuy = upgrades.clickPower[i] < 50 && clickerScore >= cost;
    
    upgradeClickPowerBtns[i].className = `p-3 rounded-lg text-left transition-all ${canBuy ? 'bg-green-600 hover:bg-green-700 cursor-pointer' : 'bg-slate-600 opacity-50 cursor-not-allowed'}`;
    upgradeClickPowerBtns[i].disabled = !canBuy;
    
    if (upgrades.clickPower[i] >= 50) {
      upgradeClickPowerBtns[i].className = 'p-3 rounded-lg text-left bg-slate-700 opacity-50 cursor-not-allowed';
      upgradeClickPowerBtns[i].innerHTML = `<div class="text-xs mb-1">${i === 0 ? '🧙' : i === 1 ? '📚' : '👑'} ${clickers[i].name}</div><div class="font-semibold text-sm">Click Power</div><div class="text-xs opacity-75">MAX LEVEL</div>`;
    } else {
      upgradeClickPowerBtns[i].innerHTML = `
        <div class="text-xs mb-1">${i === 0 ? '🧙' : i === 1 ? '📚' : '👑'} ${clickers[i].name}</div>
        <div class="font-semibold text-sm">Click Power</div>
        <div class="text-xs opacity-75">Level: ${upgrades.clickPower[i]}/50</div>
        <div class="text-sm font-bold">Cost: ${cost}</div>
      `;
    }
  }
  
  // Auto-clicker buttons (2)
  for (let i = 0; i < 2; i++) {
    const cost = getAutoClickCost(i);
    const canBuy = clickerScore >= 1000 && upgrades.autoClick[i] < 20 && clickerScore >= cost;
    
    if (clickerScore < 1000) {
      upgradeAutoClickBtns[i].className = 'p-3 rounded-lg text-left bg-slate-700 cursor-not-allowed opacity-50';
      upgradeAutoClickBtns[i].disabled = true;
      upgradeAutoClickBtns[i].innerHTML = `
        <div class="text-xs mb-1">${i === 0 ? '💜' : '🔮'} ${autoClickers[i].name}</div>
        <div class="font-semibold text-sm">Auto Clicker</div>
        <div class="text-xs opacity-75">Level: ${upgrades.autoClick[i]}/20</div>
        <div class="text-sm">Unlock at 1000</div>
      `;
    } else {
      upgradeAutoClickBtns[i].className = `p-3 rounded-lg text-left transition-all ${canBuy ? 'bg-purple-600 hover:bg-purple-700 cursor-pointer' : 'bg-slate-600 opacity-50 cursor-not-allowed'}`;
      upgradeAutoClickBtns[i].disabled = !canBuy;
      
      if (upgrades.autoClick[i] >= 20) {
        upgradeAutoClickBtns[i].className = 'p-3 rounded-lg text-left bg-slate-700 opacity-50 cursor-not-allowed';
        upgradeAutoClickBtns[i].innerHTML = `<div class="text-xs mb-1">${i === 0 ? '💜' : '🔮'} ${autoClickers[i].name}</div><div class="font-semibold text-sm">Auto Clicker</div><div class="text-xs opacity-75">MAX LEVEL</div>`;
      } else {
        upgradeAutoClickBtns[i].innerHTML = `
          <div class="text-xs mb-1">${i === 0 ? '💜' : '🔮'} ${autoClickers[i].name}</div>
          <div class="font-semibold text-sm">Auto Clicker</div>
          <div class="text-xs opacity-75">Level: ${upgrades.autoClick[i]}/20</div>
          <div class="text-sm font-bold">Cost: ${cost}</div>
        `;
      }
    }
  }
  
  // Prestige button
  const allClickersMaxed = upgrades.clickPower.every(level => level === 50);
  const allAutoClickersMaxed = upgrades.autoClick.every(level => level === 20);
  const canPrestige = allClickersMaxed && allAutoClickersMaxed;
  
  prestigeBtn.className = `w-full px-3 py-2 transition-all ${canPrestige ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 cursor-pointer' : 'bg-slate-600 opacity-50 cursor-not-allowed'}`;
  prestigeBtn.disabled = !canPrestige;
  
  if (canPrestige) {
    prestigeBtn.innerHTML = '✨ Prestige (2x) - Ready!';
  } else {
    const clickPowerNeeded = 150 - upgrades.clickPower.reduce((a, b) => a + b);
    const autoClickNeeded = 40 - upgrades.autoClick.reduce((a, b) => a + b);
    prestigeBtn.innerHTML = `✨ Prestige (LOCKED) - Need ${clickPowerNeeded} click levels, ${autoClickNeeded} auto levels`;
  }
}

function startAutoClick() {
  if (autoClickInterval) clearInterval(autoClickInterval);
  autoClickInterval = setInterval(() => {
    const totalAutoClickRate = upgrades.autoClick[0] + upgrades.autoClick[1];
    clickerScore += totalAutoClickRate * currentClickPower;
    clickerScoreDisplay.textContent = clickerScore;
  }, 1000);
}

function updateBossHealth(damage) {
  bossHealth = Math.max(0, bossHealth - damage);
  bossHealthDisplay.textContent = bossHealth;
  const healthPercent = (bossHealth / maxBossHealth) * 100;
  bossHealthBar.style.width = healthPercent + '%';
  
  // Check if boss is defeated
  if (bossHealth === 0) {
    progressToNextStage();
  }
}

function progressToNextStage() {
  const stage = stages[currentStage];
  
  if (stage.nextStage !== null) {
    currentStage = stage.nextStage;
    resetForNewStage();
  } else {
    // Game complete
    alert('Congratulations! You have completed all stages!');
  }
}

function resetForNewStage() {
  const stage = stages[currentStage];
  
  // Update stage display
  stageNameDisplay.textContent = stage.name;
  bossNameDisplay.textContent = stage.boss;
  bossAssetDisplay.src = stage.bossImage;
  
  // Reset game state but keep prestige multiplier and upgrades
  clickerScore = 0;
  bossHealth = maxBossHealth;
  
  if (autoClickInterval) clearInterval(autoClickInterval);
  
  // Reset displays
  clickerScoreDisplay.textContent = '0';
  cpsDisplay.textContent = '0';
  bossHealthDisplay.textContent = maxBossHealth;
  bossHealthBar.style.width = '100%';
  
  updateClickPower();
  updateUpgradeButtons();
  
  // Restart auto-click if any auto-clickers are unlocked
  const totalAutoClickRate = upgrades.autoClick[0] + upgrades.autoClick[1];
  if (totalAutoClickRate > 0) {
    startAutoClick();
  }
}

function prestige() {
  // Check if all upgrades are maxed for all clickers and auto-clickers
  const allClickersMaxed = upgrades.clickPower.every(level => level === 50);
  const allAutoClickersMaxed = upgrades.autoClick.every(level => level === 20);
  
  if (!allClickersMaxed || !allAutoClickersMaxed) {
    return; // Silently return if conditions not met
  }
  
  prestigeMultiplier *= 2;
  prestigeMultiplierDisplay.textContent = prestigeMultiplier + 'x';
  
  // Reset but keep prestige multiplier and upgrades
  clickerScore = 0;
  clickTimes = [];
  currentStage = 0; // Reset to first stage
  bossHealth = maxBossHealth;
  
  if (autoClickInterval) clearInterval(autoClickInterval);
  
  // Update to stage 0
  const stage = stages[0];
  stageNameDisplay.textContent = stage.name;
  bossNameDisplay.textContent = stage.boss;
  bossAssetDisplay.src = stage.bossImage;
  
  // Reset displays
  clickerScoreDisplay.textContent = '0';
  cpsDisplay.textContent = '0';
  bossHealthDisplay.textContent = maxBossHealth;
  bossHealthBar.style.width = '100%';
  
  updateClickPower();
  updateUpgradeButtons();
  
  // Restart auto-click if any auto-clickers are unlocked
  const totalAutoClickRate = upgrades.autoClick[0] + upgrades.autoClick[1];
  if (totalAutoClickRate > 0) {
    startAutoClick();
  }
}

function openClickerGame() {
  clickerModal.style.display = 'flex';
  // Initialize stage on open
  const stage = stages[currentStage];
  stageNameDisplay.textContent = stage.name;
  bossNameDisplay.textContent = stage.boss;
  bossAssetDisplay.src = stage.bossImage;
  switchClicker(0); // Default to first clicker
  updateUpgradeButtons();
}

function closeGame() {
  clickerModal.style.display = 'none';
}

function updateCPS() {
  const now = Date.now();
  clickTimes = clickTimes.filter(time => now - time < 1000);
  const totalAutoClickRate = upgrades.autoClick[0] + upgrades.autoClick[1];
  cpsDisplay.textContent = (clickTimes.length + totalAutoClickRate).toFixed(1);
}

// Clicker button click
clickerButton.addEventListener('click', () => {
  clickerScore += currentClickPower;
  clickerScoreDisplay.textContent = clickerScore;
  clickTimes.push(Date.now());
  updateCPS();
  
  // Damage boss
  updateBossHealth(currentClickPower);
  
  // Add click animation
  clickerButton.style.transform = 'scale(0.95)';
  setTimeout(() => {
    clickerButton.style.transform = 'scale(1)';
  }, 100);
  
  updateUpgradeButtons();
});

// Boss attack button
bossAttackBtn.addEventListener('click', () => {
  const damage = currentClickPower * 10;
  updateBossHealth(damage);
  clickerScore += Math.floor(damage / 10);
  clickerScoreDisplay.textContent = clickerScore;
  updateUpgradeButtons();
});

// Clicker selection buttons
clickerBtns.forEach((btn, idx) => {
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
prestigeBtn.addEventListener('click', prestige);
closeClickerModal.addEventListener('click', closeGame);

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
  bossHealthDisplay.textContent = maxBossHealth;
  bossHealthBar.style.width = '100%';
  
  switchClicker(0);
  updateUpgradeButtons();
});

// Update CPS display every 100ms
setInterval(updateCPS, 100);

// Initialize guides on page load
document.addEventListener('DOMContentLoaded', () => {
  renderGuides();
});
