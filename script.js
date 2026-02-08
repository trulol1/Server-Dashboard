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
const adminModal = document.getElementById('adminModal');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminUsernameInput = document.getElementById('adminUsername');
const adminPasswordInput = document.getElementById('adminPassword');
const adminError = document.getElementById('adminError');
const adminClose = document.getElementById('adminClose');
const adminCodeInput = document.getElementById('adminCodeInput');
const debugMenuBtn = document.getElementById('debugMenuBtn');
const debugMenuModal = document.getElementById('debugMenuModal');
const debugClose = document.getElementById('debugClose');
const debugCloseBtn = document.getElementById('debugCloseBtn');
const debugStageSelect = document.getElementById('debugStageSelect');
const debugStageApply = document.getElementById('debugStageApply');
const pressedKeys = new Set();

// Message system elements
const adminMessagesBtn = document.getElementById('adminMessagesBtn');
const messageModal = document.getElementById('messageModal');
const closeMessageModalBtn = document.getElementById('closeMessageModalBtn');
const postMessageBtn = document.getElementById('postMessageBtn');
const messageText = document.getElementById('messageText');
const messageDuration = document.getElementById('messageDuration');
const messagesContainer = document.getElementById('messagesContainer');
let selectedColor = '#3b82f6';

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

// Cutscene hook - dispatches a custom event the user can handle when assets are ready
function triggerCutscene(type, detail = {}) {
  // Respect preferences
  if (preferences.skipAllCutscenes && type !== 'reincarnation') return;
  if (type === 'reincarnation' && (preferences.skipReincarnationCutscene || preferences.skipAllCutscenes)) return;
  const event = new CustomEvent('cutscene', { detail: { type, ...detail } });
  document.dispatchEvent(event);
}

// Preferences and Options
const optionsBtn = document.getElementById('optionsBtn');
const optionsModal = document.getElementById('optionsModal');
const optionsClose = document.getElementById('optionsClose');
const optionsCloseBtn = document.getElementById('optionsCloseBtn');
const prefMuteMusic = document.getElementById('prefMuteMusic');
const prefSkipReincarnation = document.getElementById('prefSkipReincarnation');
const prefSkipAll = document.getElementById('prefSkipAll');
const generateSaveCodeBtn = document.getElementById('generateSaveCodeBtn');
const copySaveCodeBtn = document.getElementById('copySaveCodeBtn');
const saveCodeOutput = document.getElementById('saveCodeOutput');
const loadCodeInput = document.getElementById('loadCodeInput');
const loadSaveCodeBtn = document.getElementById('loadSaveCodeBtn');
const loadStatus = document.getElementById('loadStatus');
const testSoundBtn = document.getElementById('testSoundBtn');

const preferences = loadPreferences();
applyPreferencesToUI();
applyMutePreference();

optionsBtn.addEventListener('click', () => { optionsModal.classList.remove('hidden'); });
optionsClose.addEventListener('click', () => { optionsModal.classList.add('hidden'); });
optionsCloseBtn.addEventListener('click', () => { optionsModal.classList.add('hidden'); });

prefMuteMusic.addEventListener('change', () => { preferences.muteMusic = prefMuteMusic.checked; savePreferences(); applyMutePreference(); });
prefSkipReincarnation.addEventListener('change', () => { preferences.skipReincarnationCutscene = prefSkipReincarnation.checked; savePreferences(); });
prefSkipAll.addEventListener('change', () => { preferences.skipAllCutscenes = prefSkipAll.checked; savePreferences(); });

// Cutscene system
const cutsceneModal = document.getElementById('cutsceneModal');
const cutsceneVideo = document.getElementById('cutsceneVideo');

function hideCutscene() {
  if (cutsceneModal) {
    cutsceneModal.classList.add('hidden');
    if (cutsceneVideo) {
      cutsceneVideo.pause();
      cutsceneVideo.src = '';
    }
  }
}

function showCutscene(videoPath) {
  if (!cutsceneModal || !cutsceneVideo) return;
  cutsceneVideo.src = videoPath;
  cutsceneModal.classList.remove('hidden');
  cutsceneVideo.play();
}

document.addEventListener('cutscene', (e) => {
  const { type, detail } = e;
  
  if (type === 'displacement-incident') {
    showCutscene('assets/game-assets/young-rudeus/displacement-incident.mp4');
  }
});

if (cutsceneModal) {
  cutsceneModal.addEventListener('click', hideCutscene);
}

if (cutsceneVideo) {
  cutsceneVideo.addEventListener('ended', hideCutscene);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && cutsceneModal && !cutsceneModal.classList.contains('hidden')) {
    hideCutscene();
  }
});

generateSaveCodeBtn.addEventListener('click', () => {
  try {
    const code = generateSaveCode();
    saveCodeOutput.value = code;
    loadStatus.textContent = '';
    loadStatus.className = '';
  } catch (e) {
    saveCodeOutput.value = '';
    loadStatus.textContent = 'Failed to generate save code.';
    loadStatus.className = 'text-red-400';
  }
});

// Minecraft server browser
let minecraftServers = [
  {
    name: 'Main Server',
    type: 'Vanilla',
    ip: '192.168.1.50',
    port: '25565',
    version: '1.20.1',
    description: 'Survival + mods',
    maxPlayers: '20'
  }
];

(function loadMinecraftServersFromStorage() {
  try {
    const saved = localStorage.getItem('minecraftServers');
    if (saved) minecraftServers = JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load minecraft servers from localStorage:', e);
  }
})();

function initMinecraftBrowser() {
  if (document.getElementById('minecraftBrowserModal')) return;

  const browserHTML = `
    <div id="minecraftBrowserModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm z-40 animate-fadeIn overflow-y-auto">
      <div class="bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-2xl animate-slideUp my-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold">Game Servers</h2>
          <div class="flex items-center gap-3">
            <button id="showSubmitFormBtn" class="hidden px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-all duration-300 active:scale-95">Add</button>
            <button id="closeBrowserModal" class="text-slate-400 hover:text-slate-100 text-2xl transition-colors">✕</button>
          </div>
        </div>

        <div id="minecraftServerList" class="space-y-2 mb-6 max-h-96 overflow-y-auto"></div>

        <div id="submitServerSection" class="hidden border-t border-slate-700 pt-6 mt-6">
          <h3 class="text-lg font-semibold mb-4">Submit a Server</h3>
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-slate-400 mb-1">Server Name</label>
                <input id="submitServerName" type="text" placeholder="e.g., My Awesome Server" class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-xs text-slate-400 mb-1">Type</label>
                <select id="submitServerType" class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Vanilla">Vanilla</option>
                  <option value="Modded">Modded</option>
                  <option value="Hardcore">Hardcore</option>
                  <option value="Bedrock">Bedrock</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-slate-400 mb-1">IP Address</label>
                <input id="submitServerIP" type="text" placeholder="192.168.1.x" class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-xs text-slate-400 mb-1">Port</label>
                <input id="submitServerPort" type="text" placeholder="25565" class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">Version</label>
              <input id="submitServerVersion" type="text" placeholder="1.20.1" class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">Description</label>
              <input id="submitServerDescription" type="text" placeholder="Brief description" class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <button id="submitServerBtn" class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 active:scale-95">Submit Server</button>
            <p id="submitStatus" class="text-sm text-slate-400"></p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', browserHTML);

  const closeBrowserModal = document.getElementById('closeBrowserModal');
  const minecraftBrowserModal = document.getElementById('minecraftBrowserModal');
  const showSubmitFormBtn = document.getElementById('showSubmitFormBtn');
  const submitServerSection = document.getElementById('submitServerSection');
  const submitServerBtn = document.getElementById('submitServerBtn');
  const submitStatus = document.getElementById('submitStatus');
  const isAdmin = authAPI.isUserAdmin();
  if (closeBrowserModal) {
    closeBrowserModal.addEventListener('click', () => { minecraftBrowserModal.classList.add('hidden'); });
  }
  if (minecraftBrowserModal) {
    minecraftBrowserModal.addEventListener('click', (e) => {
      if (e.target === minecraftBrowserModal) minecraftBrowserModal.classList.add('hidden');
    });
  }

  // Admin-only submission controls
  if (isAdmin) {
    if (showSubmitFormBtn) {
      showSubmitFormBtn.classList.remove('hidden');
      showSubmitFormBtn.addEventListener('click', () => {
        if (submitServerSection) submitServerSection.classList.toggle('hidden');
      });
    }
    if (submitServerSection) submitServerSection.classList.add('hidden');
  } else {
    if (submitServerSection) submitServerSection.classList.add('hidden');
    if (showSubmitFormBtn) showSubmitFormBtn.classList.add('hidden');
    if (submitServerBtn) {
      submitServerBtn.disabled = true;
      submitServerBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
    if (submitStatus) {
      submitStatus.textContent = 'Admin only: submissions are disabled.';
      submitStatus.className = 'text-yellow-400 text-sm';
    }
  }

  if (submitServerBtn) {
    submitServerBtn.addEventListener('click', () => {
      if (!authAPI.isUserAdmin()) {
        alert('Only admins can submit servers.');
        return;
      }
      const name = document.getElementById('submitServerName').value.trim();
      const type = document.getElementById('submitServerType').value;
      const ip = document.getElementById('submitServerIP').value.trim();
      const port = document.getElementById('submitServerPort').value.trim();
      const version = document.getElementById('submitServerVersion').value.trim();
      const description = document.getElementById('submitServerDescription').value.trim();

      if (!name || !ip || !port) {
        submitStatus.textContent = 'Please fill in required fields (Name, IP, Port).';
        submitStatus.className = 'text-red-400';
        return;
      }

      minecraftServers.push({ name, type, ip, port, version, description, maxPlayers: '20' });
      localStorage.setItem('minecraftServers', JSON.stringify(minecraftServers));

      document.getElementById('submitServerName').value = '';
      document.getElementById('submitServerIP').value = '';
      document.getElementById('submitServerPort').value = '';
      document.getElementById('submitServerVersion').value = '';
      document.getElementById('submitServerDescription').value = '';

      submitStatus.textContent = '✓ Server submitted successfully!';
      submitStatus.className = 'text-green-400';
      renderMinecraftServerList();
      setTimeout(() => { submitStatus.textContent = ''; submitStatus.className = ''; }, 3000);
      if (submitServerSection) submitServerSection.classList.add('hidden');
    });
  }
}

function renderMinecraftServerList() {
  const list = document.getElementById('minecraftServerList');
  if (!list) return;
  list.innerHTML = '';
  minecraftServers.forEach((server, idx) => {
    const item = document.createElement('button');
    item.className = 'w-full text-left p-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all border border-slate-600 hover:border-blue-500';
    item.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <h3 class="font-semibold text-slate-100">${server.name}</h3>
          <p class="text-xs text-slate-400">${server.type} • ${server.version}</p>
          <p class="text-xs text-slate-500 mt-1">${server.ip}:${server.port}</p>
        </div>
        <span class="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">${server.type}</span>
      </div>
    `;
    item.onclick = () => { showMinecraftServerDetails(idx); };
    list.appendChild(item);
  });
}

function showMinecraftBrowser() {
  initMinecraftBrowser();
  renderMinecraftServerList();
  const modal = document.getElementById('minecraftBrowserModal');
  if (modal) modal.classList.remove('hidden');
}

function showMinecraftServerDetails(idx) {
  const server = minecraftServers[idx];
  const tempServerData = {
    name: server.name,
    ip: server.ip,
    port: server.port,
    description: server.description,
    details: [
      { label: 'Type', value: server.type },
      { label: 'Version', value: server.version },
      { label: 'Max Players', value: server.maxPlayers || '20' }
    ],
    backgroundClass: 'minecraft-server-bg'
  };
  showMinecraftServerDetailsModal(tempServerData, idx);
}

function showMinecraftServerDetailsModal(server, idx) {
  const modalIcon = document.getElementById('modalIcon');
  const modalTitle = document.getElementById('modalTitle');
  const detailsContent = document.getElementById('detailsContent');
  const detailsModal = document.getElementById('detailsModal');
  const visitBtn = document.getElementById('visitBtn');
  const copyIPBtn = document.getElementById('copyIPBtn');

  modalIcon.src = 'assets/icons/minecraft-server-icon.gif';
  modalIcon.alt = server.name;
  modalTitle.textContent = server.name;

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

  if (server.description) {
    detailsHTML += `
      <div class="bg-slate-700 rounded-lg p-4 mb-4">
        <p class="text-slate-400 text-sm mb-1">Description</p>
        <p class="text-slate-100 text-sm">${server.description}</p>
      </div>
    `;
  }

  if (server.details && server.details.length > 0) {
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

  detailsContent.innerHTML = detailsHTML;

  detailsModal.style.backgroundImage = "url('assets/backgrounds/minecraft-server-background.gif')";
  detailsModal.style.backgroundSize = '100% 100%';
  detailsModal.style.backgroundRepeat = 'no-repeat';
  detailsModal.style.backgroundAttachment = 'fixed';
  detailsModal.style.backgroundPosition = 'top center';

  visitBtn.onclick = () => { window.open(`http://${server.ip}:${server.port}`, '_blank'); };
  copyIPBtn.onclick = () => {
    const textToCopy = `${server.ip}:${server.port}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      const originalText = copyIPBtn.textContent;
      copyIPBtn.textContent = '✓ Copied!';
      setTimeout(() => { copyIPBtn.textContent = originalText; }, 2000);
    });
  };

  const editServerBtn = document.getElementById('editServerBtn');
  const adminEditControls = document.getElementById('adminEditControls');
  const editServerIP = document.getElementById('editServerIP');
  const editServerPort = document.getElementById('editServerPort');
  const editServerDescription = document.getElementById('editServerDescription');
  const editServerVersion = document.getElementById('editServerVersion');
  const editServerMaxPlayers = document.getElementById('editServerMaxPlayers');
  const saveServerEditBtn = document.getElementById('saveServerEditBtn');
  const cancelServerEditBtn = document.getElementById('cancelServerEditBtn');

  if (authAPI.isUserAdmin() && editServerBtn && adminEditControls) {
    editServerBtn.classList.remove('hidden');
    editServerBtn.onclick = () => {
      editServerIP.value = server.ip;
      editServerPort.value = server.port;
      editServerDescription.value = server.description || '';
      const versionDetail = server.details.find(d => d.label === 'Version');
      const maxPlayersDetail = server.details.find(d => d.label === 'Max Players');
      editServerVersion.value = versionDetail ? versionDetail.value : '';
      editServerMaxPlayers.value = maxPlayersDetail ? maxPlayersDetail.value : '';
      adminEditControls.classList.remove('hidden');
      editServerBtn.style.display = 'none';
      visitBtn.style.display = 'none';
      copyIPBtn.style.display = 'none';
    };

    saveServerEditBtn.onclick = () => {
      const newIP = editServerIP.value.trim();
      const newPort = editServerPort.value.trim();
      const newDescription = editServerDescription.value.trim();
      const newVersion = editServerVersion.value.trim();
      const newMaxPlayers = editServerMaxPlayers.value.trim();

      if (!newIP || !newPort) {
        alert('IP and Port cannot be empty.');
        return;
      }

      minecraftServers[idx] = {
        ...minecraftServers[idx],
        ip: newIP,
        port: newPort,
        description: newDescription,
        version: newVersion,
        maxPlayers: newMaxPlayers || '20'
      };
      localStorage.setItem('minecraftServers', JSON.stringify(minecraftServers));

      adminEditControls.classList.add('hidden');
      editServerBtn.style.display = '';
      visitBtn.style.display = '';
      copyIPBtn.style.display = '';
      renderMinecraftServerList();
      showMinecraftServerDetails(idx);
    };

    cancelServerEditBtn.onclick = () => {
      adminEditControls.classList.add('hidden');
      editServerBtn.style.display = '';
      visitBtn.style.display = '';
      copyIPBtn.style.display = '';
    };
  } else {
    if (editServerBtn) editServerBtn.classList.add('hidden');
    if (adminEditControls) adminEditControls.classList.add('hidden');
  }

  detailsModal.classList.remove('hidden');
}

copySaveCodeBtn.addEventListener('click', async () => {
  if (!saveCodeOutput.value) return;
  try {
    await navigator.clipboard.writeText(saveCodeOutput.value);
    loadStatus.textContent = 'Save code copied to clipboard.';
    loadStatus.className = 'text-green-400';
  } catch (e) {
    loadStatus.textContent = 'Copy failed.';
    loadStatus.className = 'text-red-400';
  }
});

loadSaveCodeBtn.addEventListener('click', () => {
  const code = loadCodeInput.value.trim();
  if (!code) { loadStatus.textContent = 'Please paste a save code.'; loadStatus.className = 'text-yellow-400'; return; }
  try {
    loadGameFromCode(code);
    loadStatus.textContent = 'Save loaded.';
    loadStatus.className = 'text-green-400';
    // Close options and refresh UI
    optionsModal.classList.add('hidden');
  } catch (e) {
    console.error(e);
    loadStatus.textContent = 'Invalid or corrupted save code.';
    loadStatus.className = 'text-red-400';
  }
});

// Simple WebAudio test beep respecting mute preference
let _audioCtx = null;
function ensureAudioContext() {
  if (!_audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) _audioCtx = new AC();
  }
  return _audioCtx;
}

function playTestBeep({ freq = 880, duration = 0.2, volume = 0.05 } = {}) {
  if (preferences.muteMusic) return;
  const ctx = ensureAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

if (testSoundBtn) {
  testSoundBtn.addEventListener('click', () => {
    playTestBeep();
  });
}

function loadPreferences() {
  try {
    const raw = localStorage.getItem('clicker_prefs');
    if (!raw) return { muteMusic: false, skipReincarnationCutscene: false, skipAllCutscenes: false };
    const p = JSON.parse(raw);
    return {
      muteMusic: !!p.muteMusic,
      skipReincarnationCutscene: !!p.skipReincarnationCutscene,
      skipAllCutscenes: !!p.skipAllCutscenes,
    };
  } catch {
    return { muteMusic: false, skipReincarnationCutscene: false, skipAllCutscenes: false };
  }
}

function savePreferences() {
  localStorage.setItem('clicker_prefs', JSON.stringify(preferences));
}

function applyPreferencesToUI() {
  if (prefMuteMusic) prefMuteMusic.checked = !!preferences.muteMusic;
  if (prefSkipReincarnation) prefSkipReincarnation.checked = !!preferences.skipReincarnationCutscene;
  if (prefSkipAll) prefSkipAll.checked = !!preferences.skipAllCutscenes;
}

function applyMutePreference() {
  try {
    const audios = document.querySelectorAll('audio');
    audios.forEach(a => { a.muted = !!preferences.muteMusic; });
  } catch {}
}

function generateSaveCode() {
  const state = getGameStateSnapshot();
  const json = JSON.stringify(state);
  const code = btoa(unescape(encodeURIComponent(json)));
  return code;
}

function loadGameFromCode(code) {
  const json = decodeURIComponent(escape(atob(code)));
  const state = JSON.parse(json);
  if (!state || state.v !== 1) throw new Error('Unsupported save format');
  restoreGameState(state);
}

function getGameStateSnapshot() {
  return {
    v: 1,
    t: Date.now(),
    currentStage,
    prestigeMultiplier,
    clickerScore,
    upgrades,
    bossHealth,
    maxBossHealth,
    stages,
  };
}

function restoreGameState(state) {
  if (autoClickInterval) clearInterval(autoClickInterval);

  // Restore primitives
  currentStage = state.currentStage || 0;
  prestigeMultiplier = state.prestigeMultiplier || 1;
  clickerScore = state.clickerScore || 0;
  bossHealth = state.bossHealth || 0;
  maxBossHealth = state.maxBossHealth || bossHealth;

  // Deep-assign stages (replace reference in-place)
  stages.length = 0;
  state.stages.forEach(s => stages.push(s));

  // Restore upgrades arrays sized to stage
  const stage = stages[currentStage] || stages[0];
  upgrades.clickPower = new Array(stage.clickers.length).fill(0);
  (state.upgrades?.clickPower || []).forEach((v, i) => { if (i < upgrades.clickPower.length) upgrades.clickPower[i] = v; });
  upgrades.autoClick = new Array(stage.autoClickers.length).fill(0);
  (state.upgrades?.autoClick || []).forEach((v, i) => { if (i < upgrades.autoClick.length) upgrades.autoClick[i] = v; });

  // Update UI
  stageNameDisplay.textContent = stage.name;
  bossNameDisplay.textContent = stage.boss;
  bossAssetDisplay.src = stage.bossImage;
  bossHealthDisplay.textContent = formatNumber(maxBossHealth);
  bossHealthBar.style.width = (bossHealth / maxBossHealth * 100) + '%';
  clickerScoreDisplay.textContent = formatNumber(clickerScore);
  prestigeMultiplierDisplay.textContent = prestigeMultiplier + 'x';

  // Refresh computed values/UI
  switchClicker(0);
  updateClickPower();
  updateUpgradeButtons();
  updateBossVisibility();

  // Resume auto-click if unlocked
  let totalAuto = 0;
  (stage.autoClickers || []).forEach((ac, idx) => {
    totalAuto += (upgrades.autoClick[idx] || 0) * (ac.multiplier || 1);
  });
  if (totalAuto > 0) startAutoClick();
}

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

function updateAdminUI() {
  // Show debug button if admin
  if (authAPI.isUserAdmin()) {
    debugMenuBtn.classList.remove('hidden');
  } else {
    debugMenuBtn.classList.add('hidden');
  }
}

// Show dashboard
function showDashboard() {
  dashboard.classList.remove('hidden');
  authModal.style.display = 'none';
  document.body.classList.remove('auth-active');

  updateAdminUI();
  
  // Show admin messages button if authenticated
  if (authAPI.isAuthenticated() && adminMessagesBtn) {
    adminMessagesBtn.classList.remove('hidden');
    console.log('Admin messages button shown');
  }
  
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

// Admin debug modal helpers
function showAdminModal() {
  adminError.textContent = '';
  adminModal.classList.remove('hidden');
  adminUsernameInput.focus();
}

function hideAdminModal() {
  adminModal.classList.add('hidden');
  adminUsernameInput.value = '';
  adminPasswordInput.value = '';
  adminError.textContent = '';
}

// Admin code input handler - type "TRU" to open admin login
adminCodeInput.addEventListener('input', (e) => {
  const value = e.target.value.toUpperCase();
  
  if (value === 'TRU') {
    showAdminModal();
    adminCodeInput.value = ''; // Clear input
  }
});

adminCodeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    adminCodeInput.value = '';
  }
});

adminClose.addEventListener('click', hideAdminModal);

adminModal.addEventListener('click', (e) => {
  if (e.target === adminModal) {
    hideAdminModal();
  }
});

adminLoginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  adminError.textContent = '';
  const submitBtn = adminLoginForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Authenticating...';

  const username = adminUsernameInput.value.trim();
  const password = adminPasswordInput.value;

  const result = await authAPI.adminLogin(username, password);

  if (result.success) {
    hideAdminModal();
    authModal.style.display = 'none';
    showDashboard();
  } else {
    adminError.textContent = result.error || 'Login failed';
  }

  submitBtn.disabled = false;
  submitBtn.textContent = 'Login as Admin';
});

// Debug Menu Logic
function updateDebugDisplay() {
  document.getElementById('debugScore').textContent = clickerScore;
  document.getElementById('debugClickPower').textContent = currentClickPower;
  document.getElementById('debugPrestigeMultiplier').textContent = prestigeMultiplier + 'x';
  document.getElementById('debugRudeusLevel').textContent = upgrades.clickPower[0] || 0;
  document.getElementById('debugRoxyLevel').textContent = upgrades.clickPower[1] || 0;
  document.getElementById('debugSylphyLevel').textContent = upgrades.clickPower[2] || 0;
  document.getElementById('debugLiliaLevel').textContent = upgrades.autoClick[0] || 0;
  document.getElementById('debugZenithLevel').textContent = upgrades.autoClick[1] || 0;
}

function openDebugMenu() {
  updateDebugDisplay();
  if (debugStageSelect) {
    debugStageSelect.innerHTML = '';
    stages.forEach((stage, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = `${idx}: ${stage.name || 'Stage'}`;
      if (idx === currentStage) opt.selected = true;
      debugStageSelect.appendChild(opt);
    });
  }
  debugMenuModal.classList.remove('hidden');
}

function closeDebugMenu() {
  debugMenuModal.classList.add('hidden');
}

debugMenuBtn.addEventListener('click', openDebugMenu);
debugClose.addEventListener('click', closeDebugMenu);
debugCloseBtn.addEventListener('click', closeDebugMenu);

debugMenuModal.addEventListener('click', (e) => {
  if (e.target === debugMenuModal) {
    closeDebugMenu();
  }
});

// Debug Actions
document.getElementById('debugResetClicker').addEventListener('click', () => {
  clickerScore = 0;
  clickerScoreDisplay.textContent = '0';
  updateUpgradeButtons();
  updateDebugDisplay();
});

document.getElementById('debugAddScore').addEventListener('click', () => {
  clickerScore += 10000;
  clickerScoreDisplay.textContent = formatNumber(clickerScore);
  updateUpgradeButtons();
  updateDebugDisplay();
});

document.getElementById('debugMaxAll').addEventListener('click', () => {
  const currentStageData = stages[currentStage];
  
  // Max out all clickers to their stage-specific max levels
  upgrades.clickPower = currentStageData.clickers.map(clicker => clicker.maxLevel);
  
  // Max out all auto-clickers to their stage-specific max levels
  upgrades.autoClick = currentStageData.autoClickers.map(autoClicker => autoClicker.maxLevel);
  
  clickerScore = 0;
  clickerScoreDisplay.textContent = '0';
  updateClickPower();
  updateUpgradeButtons();
  updateDebugDisplay();
});

document.getElementById('debugPrestige').addEventListener('click', () => {
  reincarnate();
  updateDebugDisplay();
});

document.getElementById('debugViewConsole').addEventListener('click', () => {
  console.log('=== Clicker Game State ===');
  console.log('Score:', clickerScore);
  console.log('Click Power:', currentClickPower);
  console.log('Reincarnation Multiplier:', prestigeMultiplier);
  console.log('Upgrades:', upgrades);
  alert('Game state logged to console (press F12 to view)');
});

document.getElementById('debugExportState').addEventListener('click', () => {
  const state = {
    clickerScore,
    currentClickPower,
    prestigeMultiplier,
    upgrades,
    currentStage,
    bossHealth
  };
  const json = JSON.stringify(state, null, 2);
  console.log(json);
  navigator.clipboard.writeText(json).then(() => {
    alert('Game state copied to clipboard!');
  });
});

// Debug stage switcher
if (debugStageApply) {
  debugStageApply.addEventListener('click', () => {
    if (!debugStageSelect) return;
    const idx = Number(debugStageSelect.value);
    if (Number.isInteger(idx) && idx >= 0 && idx < stages.length) {
      currentStage = idx;
      resetForNewStage();
      switchClicker(0);
      updateClickPower();
      updateUpgradeButtons();
      updateBossVisibility();
      updateDebugDisplay();
    }
  });
}

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
    url: 'clicker.html',
    category: 'Game',
    openInNewTab: false
  },
  {
    title: 'Anime',
    description: 'Top rated anime and search powered by MyAnimeList data',
    icon: '🍿',
    url: 'anime.html',
    category: 'Entertainment',
    openInNewTab: false
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

// Load server data from localStorage if available
(function loadServerDataFromStorage() {
  try {
    const saved = localStorage.getItem('serverData');
    if (saved) {
      const savedData = JSON.parse(saved);
      Object.assign(serverData, savedData);
    }
  } catch (e) {
    console.error('Failed to load server data from localStorage:', e);
  }
})();

// Open modal when clicking on service cards
serviceCards.forEach(card => {
  card.addEventListener('click', (e) => {
    e.preventDefault();
    const serverType = card.getAttribute('data-server');
    if (serverType === 'minecraft') {
      showMinecraftBrowser();
    } else {
      showServerDetails(serverType);
    }
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
  
  // Show/hide admin edit button
  const editServerBtn = document.getElementById('editServerBtn');
  const adminEditControls = document.getElementById('adminEditControls');
  const editServerIP = document.getElementById('editServerIP');
  const editServerPort = document.getElementById('editServerPort');
  const editServerDescription = document.getElementById('editServerDescription');
  const editServerVersion = document.getElementById('editServerVersion');
  const editServerMaxPlayers = document.getElementById('editServerMaxPlayers');
  const saveServerEditBtn = document.getElementById('saveServerEditBtn');
  const cancelServerEditBtn = document.getElementById('cancelServerEditBtn');
  
  // Store current server type for later use
  editServerBtn.dataset.serverType = serverType;
  
  if (authAPI.isUserAdmin()) {
    editServerBtn.classList.remove('hidden');
    
    editServerBtn.onclick = () => {
      editServerIP.value = server.ip;
      editServerPort.value = server.port;
      editServerDescription.value = server.description;
      // Populate version and max players from details
      const versionDetail = server.details.find(d => d.label === 'Version');
      const maxPlayersDetail = server.details.find(d => d.label === 'Max Players');
      editServerVersion.value = versionDetail ? versionDetail.value : '';
      editServerMaxPlayers.value = maxPlayersDetail ? maxPlayersDetail.value : '';
      adminEditControls.classList.remove('hidden');
      editServerBtn.style.display = 'none';
      visitBtn.style.display = 'none';
      copyIPBtn.style.display = 'none';
    };
    
    saveServerEditBtn.onclick = () => {
      const newIP = editServerIP.value.trim();
      const newPort = editServerPort.value.trim();
      const newDescription = editServerDescription.value.trim();
      const newVersion = editServerVersion.value.trim();
      const newMaxPlayers = editServerMaxPlayers.value.trim();
      
      if (!newIP || !newPort) {
        alert('IP and Port cannot be empty.');
        return;
      }
      
      // Update server data in memory
      serverData[serverType].ip = newIP;
      serverData[serverType].port = newPort;
      serverData[serverType].description = newDescription;
      
      // Update details
      serverData[serverType].details.forEach(detail => {
        if (detail.label === 'Version') detail.value = newVersion;
        if (detail.label === 'Max Players') detail.value = newMaxPlayers;
      });
      
      // Save to localStorage
      localStorage.setItem('serverData', JSON.stringify(serverData));
      
      // Refresh the display
      adminEditControls.classList.add('hidden');
      editServerBtn.style.display = '';
      visitBtn.style.display = '';
      copyIPBtn.style.display = '';
      
      // Reload details view
      showServerDetails(serverType);
      
      alert('Server details updated successfully!');
    };
    
    cancelServerEditBtn.onclick = () => {
      adminEditControls.classList.add('hidden');
      editServerBtn.style.display = '';
      visitBtn.style.display = '';
      copyIPBtn.style.display = '';
    };
  } else {
    editServerBtn.classList.add('hidden');
  }
  
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
      if (guide.openInNewTab !== false) {
        guideCard.target = '_blank';
      }
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

// Upgrade tracking per clicker/auto-clicker - dynamically set based on stage
let upgrades = {
  clickPower: [0, 0, 0], // Will be resized based on stage
  autoClick: [0, 0]      // Will be resized based on stage
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
  const currentStageData = stages[currentStage];
  const unlockCosts = [10, 500, 1000, 2000]; // Rudeus, Roxy/Eris, Sylphy, etc
  const baseCost = unlockCosts[clickerIndex] || 10;
  
  if (upgrades.clickPower[clickerIndex] === 0) {
    return baseCost;
  }
  return Math.floor(baseCost * Math.pow(1.15, upgrades.clickPower[clickerIndex]));
}

function getAutoClickCost(autoClickerIndex) {
  const unlockCosts = [2000, 3000]; // Lilia, Zenith
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
    // Hide boss UI entirely when no boss
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
  
  // Check if all clickers in current stage are maxed
  const allClickersMaxed = upgrades.clickPower.every((level, idx) => {
    return idx >= currentStageData.clickers.length || level >= currentStageData.clickers[idx].maxLevel;
  });
  
  // Check if all auto-clickers in current stage are maxed
  const allAutoClickersMaxed = upgrades.autoClick.every((level, idx) => {
    return idx >= currentStageData.autoClickers.length || level >= currentStageData.autoClickers[idx].maxLevel;
  });
  
  const allMaxed = allClickersMaxed && allAutoClickersMaxed;
  
  if (allMaxed) {
    // Show boss normally
    bossAssetDisplay.style.filter = 'none';
    bossNameDisplay.style.filter = 'none';
    bossAttackBtn.disabled = false;
    bossAttackBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  } else {
    // Show as silhouette
    bossAssetDisplay.style.filter = 'brightness(0)';
    bossNameDisplay.style.filter = 'blur(4px)';
    bossAttackBtn.disabled = true;
    bossAttackBtn.classList.add('opacity-50', 'cursor-not-allowed');
  }
}

function progressToNextStage() {
  const stage = stages[currentStage];
  
  if (stage.nextStage !== null) {
    // Progress to next stage
    currentStage = stage.nextStage;
    alert('Boss defeated! Moving to next stage...');
    resetForNewStage();
  } else {
    // Final boss defeated (stage 2). Play displacement cutscene and hard reset everything.
    triggerCutscene('displacement-incident', { stage: currentStage });
    fullResetToRudeusOnly();
  }
}

// Hard reset the game to a Rudeus-only stage with no prestige
function fullResetToRudeusOnly() {
  // Stop any auto-click timers
  if (autoClickInterval) clearInterval(autoClickInterval);

  // Wipe all progress including prestige
  clickerScore = 0;
  clickTimes = [];
  prestigeMultiplier = 1;
  prestigeMultiplierDisplay.textContent = prestigeMultiplier + 'x';

  // Mutate stages in-place to a single Rudeus-only stage using Teen Rudeus assets (no boss for now)
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

  // Back to first (and only) stage
  currentStage = 0;

  // Use common stage reset flow
  resetForNewStage();
}

function resetForNewStage() {
  const stage = stages[currentStage];
  
  // Update stage display
  stageNameDisplay.textContent = stage.name;
  bossNameDisplay.textContent = stage.boss || '';
  bossAssetDisplay.src = stage.bossImage || '';
  
  // Reset stats but keep prestige multiplier
  clickerScore = 0;
  
  // Resize upgrades arrays to match current stage clickers/auto-clickers
  upgrades.clickPower = new Array(stage.clickers.length).fill(0);
  upgrades.autoClick = new Array(stage.autoClickers.length).fill(0);
  
  // Reset boss health to current stage's boss health
  const hasBoss = stage.hasOwnProperty('hasBoss') ? stage.hasBoss : true;
  maxBossHealth = hasBoss ? (stage.bossHealth || 0) : 0;
  bossHealth = maxBossHealth;
  
  if (autoClickInterval) clearInterval(autoClickInterval);
  
  // Reset displays
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
  
  // Check if all upgrades are maxed for all clickers and auto-clickers in current stage
  const allClickersMaxed = upgrades.clickPower.every((level, idx) => {
    return idx >= currentStageData.clickers.length || level >= currentStageData.clickers[idx].maxLevel;
  });
  
  const allAutoClickersMaxed = upgrades.autoClick.every((level, idx) => {
    return idx >= currentStageData.autoClickers.length || level >= currentStageData.autoClickers[idx].maxLevel;
  });
  
  if (!allClickersMaxed || !allAutoClickersMaxed) {
    return; // Silently return if conditions not met
  }
  
  prestigeMultiplier *= 2;
  prestigeMultiplierDisplay.textContent = prestigeMultiplier + 'x';
  triggerCutscene('reincarnation', { multiplier: prestigeMultiplier });
  
  // Reset but keep prestige multiplier and upgrades
  clickerScore = 0;
  clickTimes = [];
  currentStage = 0; // Reset to first stage
  
  if (autoClickInterval) clearInterval(autoClickInterval);
  
  // Update to stage 0
  const stage = stages[0];
  stageNameDisplay.textContent = stage.name;
  bossNameDisplay.textContent = stage.boss;
  bossAssetDisplay.src = stage.bossImage;
  
  // Reset boss health and upgrades for new stage
  maxBossHealth = stage.bossHealth;
  bossHealth = maxBossHealth;
  upgrades.clickPower = new Array(stage.clickers.length).fill(0);
  upgrades.autoClick = new Array(stage.autoClickers.length).fill(0);
  
  // Reset displays
  clickerScoreDisplay.textContent = '0';
  cpsDisplay.textContent = '0';
  bossHealthDisplay.textContent = formatNumber(maxBossHealth);
  bossHealthBar.style.width = '100%';
  
  updateClickPower();
  updateUpgradeButtons();
  
  // Restart auto-click if any auto-clickers are unlocked
  const totalAutoClickRate = (upgrades.autoClick[0] || 0) + (upgrades.autoClick[1] || 0);
  if (totalAutoClickRate > 0) {
    startAutoClick();
  }
}

function openClickerGame() {
  clickerModal.style.display = 'flex';
  // Initialize stage on open
  const stage = stages[currentStage];
  stageNameDisplay.textContent = stage.name;
  bossNameDisplay.textContent = stage.boss || '';
  bossAssetDisplay.src = stage.bossImage || '';
  updateAdminUI();
  switchClicker(0); // Default to first clicker
  updateUpgradeButtons();
  updateBossVisibility();
  
  // Start auto-click if any auto-clickers are unlocked
  const currentStageData = stages[currentStage];
  let totalAutoClickRate = 0;
  currentStageData.autoClickers.forEach((autoClicker, idx) => {
    totalAutoClickRate += (upgrades.autoClick[idx] || 0) * autoClicker.multiplier;
  });
  
  if (totalAutoClickRate > 0) {
    startAutoClick();
  }
}

function closeGame() {
  clickerModal.style.display = 'none';
}

function updateCPS() {
  const now = Date.now();
  clickTimes = clickTimes.filter(time => now - time < 1000);
  
  const currentStageData = stages[currentStage];
  
  // Calculate total auto-click rate using stage-specific multipliers
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
