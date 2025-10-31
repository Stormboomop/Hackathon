// Content Script - Smart Focus Assistant
// Runs on every page to provide additional blocking features

(function() {
  'use strict';

  let isBlocked = false;
  let checkInterval = null;

  // Check if current page should be blocked
  async function checkBlockStatus() {
    try {
      const { settings } = await chrome.storage.local.get('settings');
      
      if (!settings || !settings.isActive || settings.currentPhase !== 'focus') {
        if (isBlocked) {
          removeBlockOverlay();
          isBlocked = false;
        }
        return;
      }

      const currentUrl = window.location.hostname.replace('www.', '');
      const shouldBlock = settings.blockedSites.some(site => 
        currentUrl.includes(site) || site.includes(currentUrl)
      );

      if (shouldBlock && !isBlocked) {
        showBlockOverlay();
        isBlocked = true;
      } else if (!shouldBlock && isBlocked) {
        removeBlockOverlay();
        isBlocked = false;
      }
    } catch (error) {
      console.error('Focus Assistant Error:', error);
    }
  }

  // Show blocking overlay (backup to webNavigation)
  function showBlockOverlay() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'focus-assistant-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: white;
    `;

    overlay.innerHTML = `
      <div style="text-align: center; padding: 40px; max-width: 600px;">
        <div style="font-size: 80px; margin-bottom: 30px; animation: bounce 1s infinite;">🎯</div>
        <h1 style="font-size: 48px; margin-bottom: 20px; font-weight: 700;">Stay Focused!</h1>
        <p style="font-size: 24px; margin-bottom: 30px; opacity: 0.9;">
          This site is blocked during your focus session
        </p>
        <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 30px; margin: 30px 0;">
          <div style="font-size: 64px; font-weight: bold; font-family: 'Courier New', monospace;" id="overlayTimer">
            25:00
          </div>
          <div style="margin-top: 15px; opacity: 0.9;">Time remaining in focus session</div>
        </div>
        <p style="font-size: 18px; opacity: 0.8; line-height: 1.6; margin-top: 30px;">
          "The successful warrior is the average man, with laser-like focus."
        </p>
        <button onclick="window.close()" style="
          margin-top: 30px;
          padding: 15px 40px;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 30px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        ">Close Tab</button>
      </div>
      <style>
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      </style>
    `;

    document.body.appendChild(overlay);

    // Update timer in overlay
    updateOverlayTimer();
    const timerInterval = setInterval(updateOverlayTimer, 1000);
    overlay.dataset.timerInterval = timerInterval;
  }

  // Update overlay timer
  async function updateOverlayTimer() {
    const timerElement = document.getElementById('overlayTimer');
    if (!timerElement) return;

    try {
      const response = await chrome.runtime.sendMessage({ action: 'getRemainingTime' });
      
      if (response && response.remainingTime > 0) {
        const mins = Math.floor(response.remainingTime / 60);
        const secs = response.remainingTime % 60;
        timerElement.textContent = 
          `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
    } catch (error) {
      // Ignore errors if background script is not responding
    }
  }

  // Remove blocking overlay
  function removeBlockOverlay() {
    const overlay = document.getElementById('focus-assistant-overlay');
    if (overlay) {
      const timerInterval = overlay.dataset.timerInterval;
      if (timerInterval) {
        clearInterval(parseInt(timerInterval));
      }
      overlay.remove();
    }
  }

  // Prevent bypassing (disable developer tools attempts)
  function preventBypass() {
    // Disable right-click on overlay
    const overlay = document.getElementById('focus-assistant-overlay');
    if (overlay) {
      overlay.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
      });
    }

    // Detect and prevent keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!isBlocked) return;

      // Prevent common bypass attempts
      const blockedKeys = [
        'F12', // Dev tools
        'I', 'J', 'C', 'U' // With Ctrl/Cmd
      ];

      if (e.key === 'F12' || 
          ((e.ctrlKey || e.metaKey) && blockedKeys.includes(e.key.toUpperCase()))) {
        e.preventDefault();
        return false;
      }
    });
  }

  // Monitor for dynamic content changes
  function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      if (isBlocked) {
        const overlay = document.getElementById('focus-assistant-overlay');
        if (!overlay) {
          // Overlay was removed, re-add it
          showBlockOverlay();
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: false
    });
  }

  // Track page visibility
  function trackPageVisibility() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && isBlocked) {
        // Ensure overlay is still shown when tab becomes visible
        const overlay = document.getElementById('focus-assistant-overlay');
        if (!overlay) {
          showBlockOverlay();
        }
      }
    });
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkBlock') {
      checkBlockStatus();
      sendResponse({ blocked: isBlocked });
    } else if (request.action === 'forceCheck') {
      checkBlockStatus();
    }
    return true;
  });

  // Initialize
  function init() {
    // Initial check
    checkBlockStatus();

    // Check periodically (every 5 seconds)
    checkInterval = setInterval(checkBlockStatus, 5000);

    // Setup additional protection
    preventBypass();
    setupMutationObserver();
    trackPageVisibility();

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.settings) {
        checkBlockStatus();
      }
    });
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (checkInterval) {
      clearInterval(checkInterval);
    }
    removeBlockOverlay();
  });

})();