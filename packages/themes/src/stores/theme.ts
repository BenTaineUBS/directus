import { defineStore } from 'pinia';
import { reactive } from 'vue';
import type { Theme } from '../schemas/theme.js';

import { theme as themeDirectusDefaultLight } from '../themes/light/directus-default.js';
import { theme as themeDirectusTEST } from '../themes/light/directus-test.js';

import { theme as themeDirectusDefaultDark } from '../themes/dark/directus-default.js';

const defaultLightThemes: Theme[] = [themeDirectusDefaultLight, themeDirectusTEST];
const defaultDarkThemes: Theme[] = [themeDirectusDefaultDark];

export const useThemeStore = defineStore('🎨 Themes', () => {
	const themes = reactive({
		light: defaultLightThemes,
		dark: defaultDarkThemes,
	});

	const registerTheme = (theme: Theme) => {
		if (theme.appearance === 'light') {
			themes.light.push(theme);
		} else {
			themes.dark.push(theme);
		}
	};

	return { themes, registerTheme };
});
