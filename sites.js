let blockedSites = [];

// Load blocked sites from Chrome storage
async function loadSites() {
  const { settings = {}, analytics = {} } = await chrome.storage.local.get(['settings', 'analytics']);
  if (!settings.blockedSites) settings.blockedSites = [];
  blockedSites = settings.blockedSites;

  renderSites(blockedSites);
  updateStats();

  document.getElementById('attemptCount').textContent = analytics.distractionAttempts || 0;
}

// Render list of blocked sites
function renderSites(sites) {
  const list = document.getElementById('sitesList');
  document.getElementById('siteCount').textContent = sites.length;
  document.getElementById('blockedCount').textContent = sites.length;

  if (sites.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🌐</div>
        <h3>No blocked sites yet</h3>
        <p>Add websites that distract you to stay focused during sessions</p>
      </div>`;
    return;
  }

  // Create the DOM dynamically (no inline onclick)
  list.innerHTML = '';
  sites.forEach((site, i) => {
    const item = document.createElement('div');
    item.className = 'site-item';

    const info = document.createElement('div');
    info.className = 'site-info';
    info.innerHTML = `<span class="site-icon">🚫</span><span class="site-name">${site}</span>`;

    const actions = document.createElement('div');
    actions.className = 'site-actions';

    const btn = document.createElement('button');
    btn.className = 'btn-remove';
    btn.textContent = 'Remove';
    btn.addEventListener('click', () => removeSite(i));

    actions.appendChild(btn);
    item.appendChild(info);
    item.appendChild(actions);
    list.appendChild(item);
  });
}

// Add new site
async function addSite() {
  const input = document.getElementById('siteInput');
  let site = input.value.trim().toLowerCase();

  if (!site) return showNotification('Please enter a website', true);

  site = site.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');

  if (blockedSites.includes(site))
    return showNotification('Site already blocked', true);

  blockedSites.push(site);
  await saveSites();
  renderSites(blockedSites);
  input.value = '';
  showNotification('Site added successfully!');
}

// Quick-add site
async function quickAdd(site) {
  if (blockedSites.includes(site))
    return showNotification('Site already blocked', true);

  blockedSites.push(site);
  await saveSites();
  renderSites(blockedSites);
  showNotification(`${site} added!`);
}

// Remove one site
async function removeSite(i) {
  const removed = blockedSites.splice(i, 1);
  await saveSites();
  renderSites(blockedSites);
  showNotification(`${removed} removed`);
}

// Save list to Chrome storage
async function saveSites() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  settings.blockedSites = blockedSites;
  await chrome.storage.local.set({ settings });
}

// Clear all sites
async function clearAllSites() {
  if (!confirm('Remove all blocked sites?')) return;
  blockedSites = [];
  await saveSites();
  renderSites(blockedSites);
  showNotification('All sites cleared');
}

// Export list
function exportSites() {
  const blob = new Blob([JSON.stringify(blockedSites, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'focus-assistant-blocked-sites.json';
  a.click();
  showNotification('Sites exported successfully!');
}

// Import list
function importSites() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!Array.isArray(imported)) throw new Error();
        blockedSites = [...new Set([...blockedSites, ...imported])];
        await saveSites();
        renderSites(blockedSites);
        showNotification('Sites imported successfully!');
      } catch {
        showNotification('Invalid file format', true);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// Update stats
function updateStats() {
  document.getElementById('successRate').textContent = blockedSites.length ? '100%' : '0%';
}

// Show notification
function showNotification(msg, err = false) {
  const n = document.getElementById('notification');
  n.textContent = msg;
  n.classList.toggle('error', err);
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), 3000);
}

// Bind all event listeners safely (CSP-compliant)
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnAddSite').addEventListener('click', addSite);
  document.querySelectorAll('.quick-add-btn').forEach(btn => {
    btn.addEventListener('click', () => quickAdd(btn.dataset.site));
  });
  document.getElementById('searchBox').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    renderSites(blockedSites.filter(s => s.includes(q)));
  });
  document.getElementById('btnClearAll').addEventListener('click', clearAllSites);
  document.getElementById('btnExport').addEventListener('click', exportSites);
  document.getElementById('btnImport').addEventListener('click', importSites);
  document.getElementById('btnBack').addEventListener('click', () => window.close());
  document.getElementById('siteInput').addEventListener('keypress', e => {
    if (e.key === 'Enter') addSite();
  });

  loadSites();
});
