import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from 'react';

type Theme = 'light' | 'dark' | 'system';

type EffectiveTheme = 'light' | 'dark';

interface ThemeContextValue {
	theme: Theme;
	effectiveTheme: EffectiveTheme;
	isDarkMode: boolean;
	setTheme: (theme: Theme) => void;
	toggleTheme: () => void;
	cycleTheme: () => void;
}

const STORAGE_KEY = 'Usta_theme';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredTheme(): Theme | null {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === 'light' || stored === 'dark' || stored === 'system')
			return stored;
		} catch (err) { console.debug('[Theme] Failed to persist theme:', err); }
	return null;
}

function getSystemTheme(): EffectiveTheme {
	if (
		typeof window !== 'undefined' &&
		window.matchMedia?.('(prefers-color-scheme: dark)').matches
	) {
		return 'dark';
	}
	return 'light';
}

function getInitialTheme(): Theme {
	return getStoredTheme() ?? 'system';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = useState<Theme>(getInitialTheme);

	const resolve = useCallback((t: Theme): EffectiveTheme => {
		if (t === 'system') return getSystemTheme();
		return t;
	}, []);

	const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() =>
		resolve(getInitialTheme())
	);

	const setTheme = useCallback(
		(t: Theme) => {
			setThemeState(t);
			setEffectiveTheme(resolve(t));
			try {
				localStorage.setItem(STORAGE_KEY, t);
	} catch (err) { console.debug('[Theme] Failed to read stored theme:', err); }
		},
		[resolve]
	);

	// Sync DOM class whenever effectiveTheme changes
	useEffect(() => {
		const root = document.documentElement;
		if (effectiveTheme === 'dark') {
			root.classList.add('dark');
		} else {
			root.classList.remove('dark');
		}
	}, [effectiveTheme]);

	// Listen for OS theme changes — only applies when theme === 'system'
	useEffect(() => {
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		const handler = () => {
			if (theme === 'system') {
				setEffectiveTheme(getSystemTheme());
			}
		};
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	}, [theme]);

	const toggleTheme = useCallback(() => {
		setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
	}, [effectiveTheme, setTheme]);

	const cycleTheme = useCallback(() => {
		// light → dark → system → light
		const order: Theme[] = ['light', 'dark', 'system'];
		const idx = order.indexOf(theme);
		setTheme(order[(idx + 1) % 3]);
	}, [theme, setTheme]);

	return (
		<ThemeContext.Provider
			value={{
				theme,
				effectiveTheme,
				isDarkMode: effectiveTheme === 'dark',
				setTheme,
				toggleTheme,
				cycleTheme,
			}}
		>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme(): ThemeContextValue {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
	return ctx;
}
