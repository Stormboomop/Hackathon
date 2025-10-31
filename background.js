// Background Service Worker - Smart Focus Assistant
// Handles all core logic, timers, blocking, and data management

// ==================== STATE MANAGEMENT ====================
let timerState = {
  isActive: false,
  currentPhase: 'focus', // 'focus', 'shortBreak', 'longBreak'
  remainingTime: 0,
  startTime: null,
  completedSessions: 0,
  isPaused: false
};

// ==================== DEFAULT SETTINGS ====================
const DEFAULT_SETTINGS = {
  focusDuration: 25, // minutes
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  blockedSites: [
    'facebook.com',
    'twitter.com',
    'instagram.com',
    'reddit.com',
    'youtube.com',
    'tiktok.com'
  ],
  isActive: false,
  currentPhase: 'focus',
  notifications: {
    sessionComplete: true,
    breakComplete: true,
    motivational: true
  },
  theme: 'purple',
  showBadge: true
};

const DEFAULT_ANALYTICS = {
  totalSessions: 0,
  totalFocusMinutes: 0,
  totalBreakMinutes: 0,
  distractionAttempts: 0,
  streakDays: 0,
  lastSessionDate: null,
  sessionsToday: 0
};

// ==================== INITIALIZATION ====================
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Smart Focus Assistant installed');
  
  // Initialize storage
  const { settings, analytics, sessions } = await chrome.storage.local.get(['settings', 'analytics', 'sessions']);
  
  if (!settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
  
  if (!analytics) {
    await chrome.storage.local.set({ analytics: DEFAULT_ANALYTICS });
  }
  
  if (!sessions) {
    await chrome.storage.local.set({ sessions: [] });
  }
  
  // Set initial badge
  chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
});

// ==================== TIMER MANAGEMENT ====================
let timerInterval = null;

async function startTimer(duration, phase) {
  // Get settings
  const { settings } = await chrome.storage.local.get('settings');
  
  // Update state
  timerState = {
    isActive: true,
    currentPhase: phase,
    remainingTime: duration * 60, // convert to seconds
    startTime: Date.now(),
    completedSessions: phase === 'focus' ? timerState.completedSessions : timerState.completedSessions,
    isPaused: false
  };
  
  // Update settings
  settings.isActive = true;
  settings.currentPhase = phase;
  await chrome.storage.local.set({ settings });
  
  // Clear any existing timer
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  // Start countdown
  timerInterval = setInterval(() => {
    if (!timerState.isPaused && timerState.remainingTime > 0) {
      timerState.remainingTime--;
      updateBadge();
      
      if (timerState.remainingTime === 0) {
        completeSession();
      }
    }
  }, 1000);
  
  updateBadge();
}

async function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // Update state
  timerState.isActive = false;
  timerState.isPaused = false;
  
  // Update settings
  const { settings } = await chrome.storage.local.get('settings');
  settings.isActive = false;
  await chrome.storage.local.set({ settings });
  
  // Clear badge
  chrome.action.setBadgeText({ text: '' });
}

async function completeSession() {
  clearInterval(timerInterval);
  
  const { settings, analytics, sessions } = await chrome.storage.local.get(['settings', 'analytics', 'sessions']);
  
  // Determine next phase
  let nextPhase;
  let nextDuration;
  
  if (timerState.currentPhase === 'focus') {
    // Focus session completed
    timerState.completedSessions++;
    
    // Update analytics
    analytics.totalSessions++;
    analytics.totalFocusMinutes += settings.focusDuration;
    analytics.sessionsToday++;
    
    // Update streak
    const today = new Date().toDateString();
    const lastDate = analytics.lastSessionDate ? new Date(analytics.lastSessionDate).toDateString() : null;
    
    if (lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastDate === yesterday.toDateString()) {
        analytics.streakDays++;
      } else if (lastDate !== today) {
        analytics.streakDays = 1;
      }
      
      analytics.lastSessionDate = new Date().toISOString();
      analytics.sessionsToday = 1;
    }
    
    // Save session data
    sessions.push({
      date: new Date().toISOString(),
      duration: settings.focusDuration,
      type: 'focus',
      completed: true
    });
    
    await chrome.storage.local.set({ analytics, sessions });
    
    // Determine break type
    if (timerState.completedSessions % settings.sessionsUntilLongBreak === 0) {
      nextPhase = 'longBreak';
      nextDuration = settings.longBreakDuration;
    } else {
      nextPhase = 'shortBreak';
      nextDuration = settings.breakDuration;
    }
    
    // Show notification
    if (settings.notifications.sessionComplete) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Focus Session Complete! 🎯',
        message: `Great work! Time for a ${nextPhase === 'longBreak' ? 'long' : 'short'} break.`,
        priority: 2
      });
    }
    
  } else {
    // Break completed
    analytics.totalBreakMinutes += timerState.currentPhase === 'longBreak' 
      ? settings.longBreakDuration 
      : settings.breakDuration;
    
    await chrome.storage.local.set({ analytics });
    
    nextPhase = 'focus';
    nextDuration = settings.focusDuration;
    
    // Show notification
    if (settings.notifications.breakComplete) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Break Time Over! 💪',
        message: 'Ready to focus again? Start your next session!',
        priority: 2
      });
    }
  }
  
  // Auto-start next phase or stop
  timerState.isActive = false;
  settings.isActive = false;
  settings.currentPhase = nextPhase;
  await chrome.storage.local.set({ settings });
  
  // Clear badge
  chrome.action.setBadgeText({ text: '' });
}

function updateBadge() {
  const mins = Math.floor(timerState.remainingTime / 60);
  const secs = timerState.remainingTime % 60;
  
  if (timerState.isActive) {
    chrome.action.setBadgeText({ 
      text: `${mins}:${secs.toString().padStart(2, '0')}` 
    });
    
    // Change color based on phase
    const color = timerState.currentPhase === 'focus' ? '#667eea' : '#4CAF50';
    chrome.action.setBadgeBackgroundColor({ color });
  }
}

// ==================== WEBSITE BLOCKING ====================
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only check main frame navigations
  if (details.frameId !== 0) return;
  
  const { settings } = await chrome.storage.local.get('settings');
  
  // Only block during active focus sessions
  if (!settings.isActive || settings.currentPhase !== 'focus') {
    return;
  }
  
  // Check if URL is blocked
  const url = new URL(details.url);
  const hostname = url.hostname.replace('www.', '');
  
  const isBlocked = settings.blockedSites.some(site => {
    return hostname.includes(site) || site.includes(hostname);
  });
  
  if (isBlocked) {
    // Update analytics
    const { analytics } = await chrome.storage.local.get('analytics');
    analytics.distractionAttempts = (analytics.distractionAttempts || 0) + 1;
    await chrome.storage.local.set({ analytics });
    
    // Redirect to blocked page
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL('blocked.html')
    });
  }
});

// Also check when tabs are updated (e.g., clicking links)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const { settings } = await chrome.storage.local.get('settings');
    
    if (!settings.isActive || settings.currentPhase !== 'focus') {
      return;
    }
    
    try {
      const url = new URL(changeInfo.url);
      const hostname = url.hostname.replace('www.', '');
      
      const isBlocked = settings.blockedSites.some(site => {
        return hostname.includes(site) || site.includes(hostname);
      });
      
      if (isBlocked) {
        const { analytics } = await chrome.storage.local.get('analytics');
        analytics.distractionAttempts = (analytics.distractionAttempts || 0) + 1;
        await chrome.storage.local.set({ analytics });
        
        chrome.tabs.update(tabId, {
          url: chrome.runtime.getURL('blocked.html')
        });
      }
    } catch (e) {
      // Invalid URL, ignore
    }
  }
});

// ==================== MESSAGE HANDLING ====================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      switch (request.action) {
        case 'startSession':
          const { settings } = await chrome.storage.local.get('settings');
          await startTimer(settings.focusDuration, 'focus');
          sendResponse({ success: true });
          break;
          
        case 'stopSession':
          await stopTimer();
          sendResponse({ success: true });
          break;
          
        case 'getTimerState':
          sendResponse({ 
            ...timerState,
            settings: (await chrome.storage.local.get('settings')).settings
          });
          break;
          
        case 'getRemainingTime':
          sendResponse({ remainingTime: timerState.remainingTime });
          break;
          
        case 'getAnalytics':
          const analytics = await chrome.storage.local.get(['analytics', 'sessions']);
          sendResponse(analytics);
          break;
          
        case 'resetAnalytics':
          await chrome.storage.local.set({ 
            analytics: DEFAULT_ANALYTICS,
            sessions: []
          });
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  })();
  
  return true; // Keep message channel open for async response
});

// ==================== ALARM HANDLING ====================
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyReset') {
    resetDailyStats();
  }
});

async function resetDailyStats() {
  const { analytics } = await chrome.storage.local.get('analytics');
  analytics.sessionsToday = 0;
  await chrome.storage.local.set({ analytics });
}

// Set up daily reset alarm
chrome.alarms.create('dailyReset', {
  when: getNextMidnight(),
  periodInMinutes: 24 * 60
});

function getNextMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime();
}

// ==================== CONTEXT MENU (Optional Enhancement) ====================
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'blockThisSite',
    title: 'Block this site with Focus Assistant',
    contexts: ['page']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'blockThisSite') {
    try {
      const url = new URL(tab.url);
      const hostname = url.hostname.replace('www.', '');
      
      const { settings } = await chrome.storage.local.get('settings');
      
      if (!settings.blockedSites.includes(hostname)) {
        settings.blockedSites.push(hostname);
        await chrome.storage.local.set({ settings });
        
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'Site Blocked',
          message: `${hostname} has been added to your block list`,
          priority: 1
        });
      }
    } catch (e) {
      console.error('Error blocking site:', e);
    }
  }
});

// ==================== KEEP SERVICE WORKER ALIVE ====================
// Prevent service worker from going inactive
setInterval(() => {
  chrome.storage.local.get('settings', () => {
    // Keep alive ping
  });
}, 20000); // Every 20 seconds

console.log('Smart Focus Assistant background service worker initialized');