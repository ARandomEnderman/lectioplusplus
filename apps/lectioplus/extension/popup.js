const appearance = globalThis.lectioPlusAppearance;
const enabled = document.getElementById('enabled');
const status = document.getElementById('status');
const system = matchMedia('(prefers-color-scheme: dark)');
let preferences = appearance.defaults;
const controls = appearance.controls(save);

function render() {
  appearance.apply(document.documentElement, preferences, system.matches);
  enabled.checked = preferences.enabled;
  controls.sync(preferences);
}

async function save(changes) {
  const before = preferences;
  const next = appearance.normalize({ ...preferences, ...changes });
  preferences = next;
  render();
  try {
    await chrome.storage.local.set(changes);
    status.textContent = '';
  } catch {
    if (preferences === next) {
      preferences = before;
      render();
    }
    status.textContent = 'Indstillingen kunne ikke gemmes.';
  }
}

async function start() {
  try {
    preferences = appearance.normalize(await chrome.storage.local.get(appearance.defaults));
    document.getElementById('preferences').append(controls.node);
    enabled.disabled = false;
    enabled.addEventListener('change', () => save({ enabled: enabled.checked }));
    system.addEventListener('change', render);
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      const next = { ...preferences };
      for (const key of Object.keys(appearance.defaults)) {
        if (changes[key]) next[key] = changes[key].newValue;
      }
      preferences = appearance.normalize(next);
      render();
    });
    render();
  } catch {
    status.textContent = 'Indstillingerne kunne ikke indlæses.';
  }
}

// Filled in by the release workflow; left as-is in unpacked development copies, which skips the check.
const releaseRepo = '__GITHUB_REPOSITORY__';

function newer(latest, current) {
  const a = latest.split('.').map(Number);
  const b = current.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0);
  }
  return false;
}

async function checkForUpdate() {
  if (releaseRepo.startsWith('__')) return;
  try {
    const response = await fetch(`https://api.github.com/repos/${releaseRepo}/releases/latest`, { cache: 'no-store' });
    if (!response.ok) return;
    const release = await response.json();
    const latest = String(release.tag_name || '').replace(/^v/, '');
    if (!/^\d+\.\d+\.\d+$/.test(latest) || !newer(latest, chrome.runtime.getManifest().version)) return;
    const link = document.getElementById('update');
    link.href = release.html_url;
    link.textContent = `Ny version ${latest} er klar – se hvordan du opdaterer`;
    link.hidden = false;
  } catch {
    // Offline or rate-limited: no notice.
  }
}

start();
checkForUpdate();
