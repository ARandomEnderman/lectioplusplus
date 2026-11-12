import { localStore } from '$lib/utils/localStore';

// Colour designs and densities ported from the LectioPlus+ extension.
// `mark` is the swatch colour shown in the picker.
// The CSS for each design lives in app.pcss under :root[data-design='<key>'].
export const designs = [
	{ key: 'indigo', label: 'Indigo', mark: '#5a58d0' },
	{ key: 'ocean', label: 'Havblå', mark: '#117eab' },
	{ key: 'forest', label: 'Skovgrøn', mark: '#338059' },
	{ key: 'teal', label: 'Turkis', mark: '#15817c' },
	{ key: 'slate', label: 'Skifer', mark: '#526982' },
	{ key: 'lavender', label: 'Lavendel', mark: '#8256be' },
	{ key: 'raspberry', label: 'Hindbær', mark: '#b34780' },
	{ key: 'ruby', label: 'Rubin', mark: '#b94459' },
	{ key: 'coral', label: 'Koral', mark: '#b95a39' },
	{ key: 'amber', label: 'Rav', mark: '#95711b' }
] as const;

export const densities = [
	{ key: 'comfortable', label: 'Luftig' },
	{ key: 'compact', label: 'Kompakt' }
] as const;

export type Design = (typeof designs)[number]['key'];
export type Density = (typeof densities)[number]['key'];
export type Appearance = { design: Design; density: Density };

export const defaultAppearance: Appearance = { design: 'indigo', density: 'comfortable' };

// Key must match the inline script in app.html, which applies the stored values before first paint.
export const appearanceStore = localStore<Appearance>('appearance', defaultAppearance);

export function normalizeAppearance(value: Partial<Appearance> | null | undefined): Appearance {
	return {
		design: designs.some((d) => d.key === value?.design) ? value!.design! : defaultAppearance.design,
		density: densities.some((d) => d.key === value?.density)
			? value!.density!
			: defaultAppearance.density
	};
}

export function applyAppearance(root: HTMLElement, value: Partial<Appearance> | null | undefined) {
	const { design, density } = normalizeAppearance(value);
	root.dataset.design = design;
	root.dataset.density = density;
}
