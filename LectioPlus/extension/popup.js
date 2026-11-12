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

start();
