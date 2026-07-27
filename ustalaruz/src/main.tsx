import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './auth/AuthProvider.tsx';
import { ThemeProvider } from './theme/ThemeProvider.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './lib/errorReporter';
import './index.css';

createRoot(document.getElementById('root')!).render(
	<BrowserRouter>
		<ErrorBoundary>
			<AuthProvider>
				<ThemeProvider>
					<App />
				</ThemeProvider>
			</AuthProvider>
		</ErrorBoundary>
	</BrowserRouter>
);

// Registered only in production builds - in dev, a previously-installed SW
// from an earlier `vite preview`/build test on the same origin will keep
// serving stale cached bundles over new source changes (silently, since
// Vite's dev server has no way to bust an already-active SW's cache), which
// reads as a phantom bug that a hard refresh or cache clear doesn't fix.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
	navigator.serviceWorker.register('/sw.js').then((reg) => {
		reg.addEventListener('updatefound', () => {
			const newSW = reg.installing;
			if (newSW) {
				newSW.addEventListener('statechange', () => {
					if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
						newSW.postMessage({ type: 'SKIP_WAITING' });
					}
				});
			}
		});
		if (reg.active && !navigator.serviceWorker.controller) {
			window.location.reload();
		}
	});
} else if ('serviceWorker' in navigator) {
	// Self-heal a dev origin that has a SW left over from an earlier
	// production-mode test, instead of every future dev session silently
	// serving whatever was cached at that time.
	navigator.serviceWorker.getRegistrations().then((regs) => {
		regs.forEach((reg) => reg.unregister());
	});
}
