document.addEventListener('DOMContentLoaded', async () => {
  await loadAnalytics();
});

// Load all analytics data from Chrome storage
async function loadAnalytics() {
  try {
    const { analytics = {}, sessions = [] } = await chrome.storage.local.get(['analytics', 'sessions']);

    // Handle empty state safely
    if (!Object.keys(analytics).length && !sessions.length) {
      console.warn('No analytics data found.');
      return;
    }

    // Update key stats
    document.getElementById('totalSessions').textContent = analytics.totalSessions || 0;
    document.getElementById('totalMinutes').textContent = analytics.totalFocusMinutes || 0;
    document.getElementById('currentStreak').textContent = analytics.streakDays || 0;
    document.getElementById('blockedCount').textContent = analytics.distractionAttempts || 0;

    // Weekly comparison
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekSessions = sessions.filter(s => new Date(s.date) > weekAgo);
    const weekMinutes = weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0);

    document.getElementById('sessionChange').textContent = `+${weekSessions.length} this week`;
    document.getElementById('minuteChange').textContent = `+${weekMinutes} this week`;

    // Build charts
    createWeeklyChart(sessions);
    createHourlyChart(sessions);
    createMonthlyChart(sessions);
    createPieChart(analytics);
  } catch (err) {
    console.error('Error loading analytics:', err);
  }
}

// Weekly focus chart (last 7 days)
function createWeeklyChart(sessions) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data = new Array(7).fill(0);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  sessions.forEach(s => {
    const d = new Date(s.date);
    if (d > weekAgo) data[(d.getDay() + 6) % 7] += s.duration || 0;
  });

  new Chart(document.getElementById('weeklyChart'), {
    type: 'bar',
    data: {
      labels: days,
      datasets: [{
        label: 'Focus Minutes',
        data,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderColor: '#fff',
        borderWidth: 2,
        borderRadius: 10
      }]
    },
    options: chartOptions()
  });
}

// Hourly distribution of focus
function createHourlyChart(sessions) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const data = new Array(24).fill(0);

  sessions.forEach(s => {
    const hour = new Date(s.date).getHours();
    data[hour] += s.duration || 0;
  });

  const labels = hours.map(h =>
    h === 0 ? '12 AM' : h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`
  );

  new Chart(document.getElementById('hourlyChart'), {
    type: 'line',
    data: {
      labels: labels.filter((_, i) => i % 2 === 0),
      datasets: [{
        label: 'Focus Minutes',
        data: data.filter((_, i) => i % 2 === 0),
        borderColor: '#fff',
        backgroundColor: 'rgba(255,255,255,0.2)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#fff'
      }]
    },
    options: chartOptions()
  });
}

// Daily focus over last 30 days
function createMonthlyChart(sessions) {
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d;
  });

  const data = last30.map(d =>
    sessions
      .filter(s => new Date(s.date).toDateString() === d.toDateString())
      .reduce((sum, s) => sum + (s.duration || 0), 0)
  );

  const labels = last30.map((d, i) =>
    i % 5 === 0 ? `${d.getMonth() + 1}/${d.getDate()}` : ''
  );

  new Chart(document.getElementById('monthlyChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Daily Focus',
        data,
        borderColor: '#fff',
        backgroundColor: 'rgba(255,255,255,0.1)',
        fill: true,
        tension: 0.3
      }]
    },
    options: chartOptions()
  });
}

// Focus vs Breaks chart
function createPieChart(analytics) {
  const focus = analytics.totalFocusMinutes || 0;
  const breaks = Math.floor(focus * 0.2);
  const available = Math.max(0, 480 - focus - breaks); // assuming 8hr productive window

  new Chart(document.getElementById('pieChart'), {
    type: 'doughnut',
    data: {
      labels: ['Focus Time', 'Break Time', 'Available'],
      datasets: [{
        data: [focus, breaks, available],
        backgroundColor: [
          'rgba(255,255,255,0.8)',
          'rgba(255,255,255,0.5)',
          'rgba(255,255,255,0.1)'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#fff' }
        }
      }
    }
  });
}

// Shared chart style
function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#fff' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      },
      x: {
        ticks: { color: '#fff' },
        grid: { display: false }
      }
    }
  };
}
