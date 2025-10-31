// Settings page JavaScript - Smart Focus Assistant

// Load current settings
async function loadSettings() {
  const { settings } = await chrome.storage.local.get('settings');
  
  if (settings) {
    document.getElementById('focusDuration').value = settings.focusDuration || 25;
    document.getElementById('focusValue').textContent = settings.focusDuration || 25;
    
    document.getElementById('breakDuration').value = settings.breakDuration || 5;
    document.getElementById('breakValue').textContent = settings.breakDuration || 5;
    
    document.getElementById('longBreakDuration').value = settings.longBreakDuration || 15;
    document.getElementById('longBreakValue').textContent = settings.longBreakDuration || 15;
    
    document.getElementById('sessionsUntilLongBreak').value = settings.sessionsUntilLongBreak || 4;
    document.getElementById('sessionsValue').textContent = settings.sessionsUntilLongBreak || 4;
  }
}

// Update value displays
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();

  document.getElementById('focusDuration').addEventListener('input', (e) => {
    document.getElementById('focusValue').textContent = e.target.value;
  });

  document.getElementById('breakDuration').addEventListener('input', (e) => {
    document.getElementById('breakValue').textContent = e.target.value;
  });

  document.getElementById('longBreakDuration').addEventListener('input', (e) => {
    document.getElementById('longBreakValue').textContent = e.target.value;
  });

  document.getElementById('sessionsUntilLongBreak').addEventListener('input', (e) => {
    document.getElementById('sessionsValue').textContent = e.target.value;
  });

  // Setup button listeners
  document.getElementById('saveBtn').addEventListener('click', saveSettings);
  document.getElementById('resetBtn').addEventListener('click', resetSettings);
  document.getElementById('backBtn').addEventListener('click', () => window.close());

  // Setup preset buttons
  document.querySelectorAll('.preset-btn').forEach((btn, index) => {
    btn.addEventListener('click', () => {
      const presets = [
        [25, 5, 15, 4],
        [50, 10, 30, 3],
        [15, 3, 10, 6],
        [45, 15, 30, 2]
      ];
      applyPreset(...presets[index]);
    });
  });
});

// Apply preset
function applyPreset(focus, shortBreak, longBreak, sessions) {
  document.getElementById('focusDuration').value = focus;
  document.getElementById('focusValue').textContent = focus;
  
  document.getElementById('breakDuration').value = shortBreak;
  document.getElementById('breakValue').textContent = shortBreak;
  
  document.getElementById('longBreakDuration').value = longBreak;
  document.getElementById('longBreakValue').textContent = longBreak;
  
  document.getElementById('sessionsUntilLongBreak').value = sessions;
  document.getElementById('sessionsValue').textContent = sessions;
}

// Save settings
async function saveSettings() {
  const { settings } = await chrome.storage.local.get('settings');
  
  const newSettings = {
    ...settings,
    focusDuration: parseInt(document.getElementById('focusDuration').value),
    breakDuration: parseInt(document.getElementById('breakDuration').value),
    longBreakDuration: parseInt(document.getElementById('longBreakDuration').value),
    sessionsUntilLongBreak: parseInt(document.getElementById('sessionsUntilLongBreak').value)
  };

  await chrome.storage.local.set({ settings: newSettings });
  showNotification('Settings saved successfully!');
}

// Reset settings
async function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to default?')) {
    applyPreset(25, 5, 15, 4);
    await saveSettings();
    showNotification('Settings reset to default!');
  }
}

// Show notification
function showNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}