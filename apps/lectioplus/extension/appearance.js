(() => {
  'use strict';

  const defaults = { enabled: true, theme: 'dark', design: 'strafe', density: 'comfortable', hideProfilePhoto: false };
  const designs = [
    ['strafe', 'Strafe'],
    ['indigo', 'Indigo'], ['ocean', 'Havblå'], ['forest', 'Skovgrøn'], ['teal', 'Turkis'], ['slate', 'Skifer'],
    ['lavender', 'Lavendel'], ['raspberry', 'Hindbær'], ['ruby', 'Rubin'], ['coral', 'Koral'], ['amber', 'Rav']
  ];
  const themes = [['system', 'Følg systemet'], ['light', 'Lys'], ['dark', 'Mørk']];
  const densities = [['comfortable', 'Luftig'], ['compact', 'Kompakt']];
  const valid = (choices, value, fallback) => choices.some(([key]) => key === value) ? value : fallback;

  function normalize(values = {}) {
    if (!values || typeof values !== 'object') values = {};
    return {
      enabled: typeof values.enabled === 'boolean' ? values.enabled : defaults.enabled,
      theme: valid(themes, values.theme, defaults.theme),
      design: valid(designs, values.design, defaults.design),
      density: valid(densities, values.density, defaults.density),
      hideProfilePhoto: values.hideProfilePhoto === true
    };
  }

  function dark(preferences, systemDark) {
    return preferences.theme === 'dark' || (preferences.theme === 'system' && systemDark);
  }

  function apply(root, preferences, systemDark, active = true) {
    root.toggleAttribute('data-lxp-hide-profile-photo', active && preferences.hideProfilePhoto === true);
    if (active) {
      root.dataset.lxpMode = dark(preferences, systemDark) ? 'dark' : 'light';
      root.dataset.lxpDesign = preferences.design;
      root.dataset.lxpDensity = preferences.density;
    } else {
      delete root.dataset.lxpMode;
      delete root.dataset.lxpDesign;
      delete root.dataset.lxpDensity;
    }
  }

  function controls(onChange) {
    const node = document.createElement('div');
    node.className = 'lxp-appearance';

    function select(key, label, choices) {
      const field = document.createElement('select');
      for (const [value, text] of choices) field.add(new Option(text, value));
      field.addEventListener('change', () => onChange({ [key]: field.value }));
      const row = document.createElement('label');
      row.className = 'lxp-appearance-row';
      row.append(label, field);
      node.append(row);
      return field;
    }

    const theme = select('theme', 'Tema', themes);
    const group = document.createElement('fieldset');
    const heading = document.createElement('legend');
    heading.textContent = 'Design';
    const choices = document.createElement('div');
    choices.className = 'lxp-design-options';
    const radios = designs.map(([value, label]) => {
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'lectioplus-design';
      radio.value = value;
      radio.addEventListener('change', () => onChange({ design: radio.value }));
      const swatch = document.createElement('span');
      swatch.className = 'lxp-design-swatch';
      swatch.dataset.swatch = value;
      swatch.setAttribute('aria-hidden', 'true');
      const card = document.createElement('label');
      card.className = 'lxp-design-option';
      card.append(radio, swatch, label);
      choices.append(card);
      return radio;
    });
    const hideProfilePhoto = document.createElement('input');
    hideProfilePhoto.type = 'checkbox';
    hideProfilePhoto.addEventListener('change', () => onChange({ hideProfilePhoto: hideProfilePhoto.checked }));
    const photoRow = document.createElement('label');
    photoRow.className = 'lxp-appearance-row lxp-photo-setting';
    photoRow.append('Skjul mit profilbillede', hideProfilePhoto);
    group.append(heading, choices, photoRow);
    node.append(group);
    const density = select('density', 'Afstand', densities);

    return { node, sync(preferences) {
      theme.value = preferences.theme;
      density.value = preferences.density;
      hideProfilePhoto.checked = preferences.hideProfilePhoto;
      for (const radio of radios) radio.checked = radio.value === preferences.design;
    } };
  }

  globalThis.lectioPlusAppearance = { defaults, normalize, dark, apply, controls };
})();
