<script lang="ts">
  import { appearanceStore, designs, densities, normalizeAppearance, type Appearance } from '$lib/appearance';
  import { setMode, userPrefersMode } from 'mode-watcher';

  const themes = [
    { key: 'system', label: 'Følg systemet' },
    { key: 'light', label: 'Lys' },
    { key: 'dark', label: 'Mørk' }
  ] as const;

  $: appearance = normalizeAppearance($appearanceStore);

  function set(change: Partial<Appearance>) {
    appearanceStore.update((current) => ({ ...normalizeAppearance(current), ...change }));
  }

  const option =
    'relative flex cursor-pointer items-center justify-center gap-2 rounded-md border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-accent has-[:checked]:font-semibold has-[:checked]:text-accent-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background';
</script>

<div class="space-y-4">
  <fieldset>
    <legend class="mb-2 font-semibold">Tema</legend>
    <div class="grid grid-cols-3 gap-2">
      {#each themes as theme}
        <label class={option}>
          <input
            class="sr-only"
            type="radio"
            name="theme"
            value={theme.key}
            checked={$userPrefersMode === theme.key}
            on:change={() => setMode(theme.key)}
          />
          {theme.label}
        </label>
      {/each}
    </div>
  </fieldset>

  <fieldset>
    <legend class="mb-2 font-semibold">Farvedesign</legend>
    <div class="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {#each designs as design}
        <label class="{option} flex-col">
          <input
            class="sr-only"
            type="radio"
            name="design"
            value={design.key}
            checked={appearance.design === design.key}
            on:change={() => set({ design: design.key })}
          />
          <span class="size-5 rounded-md" style="background: {design.mark}" aria-hidden="true" />
          {design.label}
        </label>
      {/each}
    </div>
  </fieldset>

  <fieldset>
    <legend class="mb-2 font-semibold">Afstand</legend>
    <div class="grid grid-cols-2 gap-2">
      {#each densities as density}
        <label class={option}>
          <input
            class="sr-only"
            type="radio"
            name="density"
            value={density.key}
            checked={appearance.density === density.key}
            on:change={() => set({ density: density.key })}
          />
          {density.label}
        </label>
      {/each}
    </div>
  </fieldset>
</div>
