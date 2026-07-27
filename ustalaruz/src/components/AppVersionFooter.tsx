import { useEffect, useState } from 'react';
import { API_BASE } from '../lib/api';
import DeveloperCredit from './DeveloperCredit';

// Client version is the git SHA + commit date baked in at build time
// (vite.config.ts). Server version is fetched once here since this renders
// deep inside the signed-in app, away from App.tsx's own polling effect
// that drives the marketing-footer copy of the same data.
export default function AppVersionFooter() {
	const [backendVersion, setBackendVersion] = useState<string | null>(null);
	const [backendVersionDate, setBackendVersionDate] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		fetch(`${API_BASE}/api/version`, { cache: 'no-store' })
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (!cancelled && data?.version) {
					setBackendVersion(data.version);
					setBackendVersionDate(data.date || null);
				}
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<div className="mt-4 text-center text-[10px] text-text-muted font-mono">
			<p>
				Master Group v{__APP_VERSION__}
				{__APP_VERSION_DATE__ && ` (${__APP_VERSION_DATE__})`}
				{backendVersion && ` · server v${backendVersion}`}
				{backendVersionDate && ` (${backendVersionDate})`}
			</p>
			<DeveloperCredit className="mt-1 block" />
		</div>
	);
}
