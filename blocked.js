const quotes = [
  "The successful warrior is the average man, with laser-like focus.",
  "Concentrate all your thoughts upon the work in hand.",
  "It's not that I'm so smart, it's just that I stay with problems longer.",
  "Where focus goes, energy flows.",
  "The key to success is to focus our conscious mind on things we desire.",
  "Lack of direction, not lack of time, is the problem.",
  "You can't depend on your eyes when your imagination is out of focus.",
  "Starve your distractions, feed your focus."
];

document.getElementById('quote').textContent =
  `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;

async function loadStats() {
  const { analytics, sessions } = await chrome.storage.local.get(['analytics', 'sessions']);
  if (!analytics) return;
  document.getElementById('sessionsToday').textContent = getTodaySessions(sessions);
  document.getElementById('focusTime').textContent = analytics.totalFocusMinutes || 0;
  document.getElementById('blockedAttempts').textContent = analytics.distractionAttempts || 0;
  document.getElementById('streak').textContent = analytics.streakDays || 0;
}

function getTodaySessions(sessions = []) {
  const today = new Date().toDateString();
  return sessions.filter(s => new Date(s.date).toDateString() === today).length;
}

async function updateTimer() {
  const res = await chrome.runtime.sendMessage({ action: 'getRemainingTime' });
  if (res?.remainingTime > 0) {
    const m = Math.floor(res.remainingTime / 60);
    const s = res.remainingTime % 60;
    document.getElementById('timer').textContent =
      `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}

loadStats();
updateTimer();
setInterval(updateTimer, 1000);
