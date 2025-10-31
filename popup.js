// Popup Interface Logic - Smart Focus Assistant
// Handles all popup UI interactions and updates

// ==================== STATE ====================
let currentState = {
  isActive: false,
  currentPhase: 'focus',
  remainingTime: 0,
  completedSessions: 0
};

let updateInterval = null;

// ==================== MOTIVATIONAL QUOTES ====================
const motivationalQuotes = [
  "The secret of getting ahead is getting started.",
  "Focus is the art of knowing what to ignore.",
  "Concentrate all your thoughts upon the work in hand.",
  "Where focus goes, energy flows.",
  "The successful warrior is the average man, with laser-like focus.",
  "It's not that I'm so smart, it's just that I stay with problems longer.",
  "Lack of direction, not lack of time, is the problem.",
  "The key to success is to focus our conscious mind on things we desire.",
  "Starve your distractions, feed your focus.",
  "You can't depend on your eyes when your imagination is out of focus."
];

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
  await loadState();
  setupEventListeners();
  displayRandomQuote();
  startUpdateLoop();
});

// ==================== LOAD STATE ====================
async function loadState() {
  try {
    // Get timer state from background
    const response = await chrome.runtime.sendMessage({ action: 'getTimerState' });
    
    if (response) {
      currentState = {
        isActive: response.isActive || false,
        currentPhase: response.currentPhase || 'focus',
        remainingTime: response.remainingTime || 0,
        completedSessions: response.completedSessions || 0
      };
      
      updateUI();
    }
    
    // Load analytics
    const { analytics, sessions } = await chrome.storage.local.get(['analytics', 'sessions']);
    
    if (analytics) {
      document.getElementById('totalSessions').textContent = analytics.totalSessions || 0;
      document.getElementById('totalMinutes').textContent = analytics.totalFocusMinutes || 0;
      document.getElementById('streakDays').textContent = analytics.streakDays || 0;
      document.getElementById('distractions').textContent = analytics.distractionAttempts || 0;
    }
    
  } catch (error) {
    console.error('Error loading state:', error);
  }
}

// ==================== UPDATE UI ====================
function updateUI() {
  // Update timer display
  const mins = Math.floor(currentState.remainingTime / 60);
  const secs = currentState.remainingTime % 60;
  document.getElementById('timerDisplay').textContent = 
    `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  
  // Update phase indicator
  const phaseText = {
    'focus': 'Focus Time',
    'shortBreak': 'Short Break',
    'longBreak': 'Long Break'
  };
  document.getElementById('phaseIndicator').textContent = phaseText[currentState.currentPhase] || 'Focus Time';
  
  // Update buttons
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  
  if (currentState.isActive) {
    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
  } else {
    startBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');
  }
  
  // Update session indicators
  updateSessionDots();
  
  // Update progress bar
  updateProgressBar();
}

// ==================== UPDATE SESSION DOTS ====================
async function updateSessionDots() {
  const { settings } = await chrome.storage.local.get('settings');
  const maxSessions = settings?.sessionsUntilLongBreak || 4;
  
  const indicator = document.getElementById('sessionIndicator');
  indicator.innerHTML = '';
  
  for (let i = 0; i < maxSessions; i++) {
    const dot = document.createElement('div');
    dot.className = 'session-dot';
    if (i < currentState.completedSessions % maxSessions) {
      dot.classList.add('completed');
    }
    indicator.appendChild(dot);
  }
}

// ==================== UPDATE PROGRESS BAR ====================
async function updateProgressBar() {
  const { settings } = await chrome.storage.local.get('settings');
  
  let totalTime = 0;
  if (currentState.currentPhase === 'focus') {
    totalTime = (settings?.focusDuration || 25) * 60;
  } else if (currentState.currentPhase === 'shortBreak') {
    totalTime = (settings?.breakDuration || 5) * 60;
  } else {
    totalTime = (settings?.longBreakDuration || 15) * 60;
  }
  
  const progress = ((totalTime - currentState.remainingTime) / totalTime) * 100;
  document.getElementById('progressFill').style.width = `${Math.max(0, Math.min(100, progress))}%`;
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  // Start button
  document.getElementById('startBtn').addEventListener('click', async () => {
    try {
      await chrome.runtime.sendMessage({ action: 'startSession' });
      await loadState();
    } catch (error) {
      console.error('Error starting session:', error);
    }
  });
  
  // Stop button
  document.getElementById('stopBtn').addEventListener('click', async () => {
    if (confirm('Are you sure you want to stop the current session?')) {
      try {
        await chrome.runtime.sendMessage({ action: 'stopSession' });
        await loadState();
      } catch (error) {
        console.error('Error stopping session:', error);
      }
    }
  });
  
  // Settings button
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  });
  
  // Analytics button
  document.getElementById('analyticsBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('analytics.html') });
  });
  
  // Sites button
  document.getElementById('sitesBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('sites.html') });
  });
}

// ==================== UPDATE LOOP ====================
function startUpdateLoop() {
  // Update every second
  updateInterval = setInterval(async () => {
    if (currentState.isActive) {
      try {
        const response = await chrome.runtime.sendMessage({ action: 'getRemainingTime' });
        if (response && response.remainingTime >= 0) {
          currentState.remainingTime = response.remainingTime;
          updateUI();
        }
      } catch (error) {
        // Background script might be restarting
        console.error('Error updating timer:', error);
      }
    }
  }, 1000);
}

// ==================== DISPLAY RANDOM QUOTE ====================
function displayRandomQuote() {
  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
  document.getElementById('motivationQuote').textContent = `"${randomQuote}"`;
}

// ==================== LISTEN FOR STORAGE CHANGES ====================
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    if (changes.analytics) {
      const analytics = changes.analytics.newValue;
      document.getElementById('totalSessions').textContent = analytics.totalSessions || 0;
      document.getElementById('totalMinutes').textContent = analytics.totalFocusMinutes || 0;
      document.getElementById('streakDays').textContent = analytics.streakDays || 0;
      document.getElementById('distractions').textContent = analytics.distractionAttempts || 0;
    }
  }
});

// ==================== CLEANUP ====================
window.addEventListener('unload', () => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});