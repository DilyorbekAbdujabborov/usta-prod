import { useEffect, useState } from 'react';

// Cookie / analytics consent. Nothing is loaded from Google until the
// visitor answers the banner: index.html only defines the loader
// (window.__ustaLoadAnalytics) and sets Consent Mode v2 defaults to denied,
// and this module is the single place that flips them.
export const CONSENT_KEY = 'usta_consent_v1';
export const CONSENT_EVENT = 'usta-consent-change';

export type ConsentChoice = 'granted' | 'denied';

export function getConsent(): ConsentChoice | null {
	try {
		const raw = localStorage.getItem(CONSENT_KEY);
		return raw === 'granted' || raw === 'denied' ? raw : null;
	} catch {
		// Storage blocked (private mode / cookies off) - treat as undecided
		// rather than assuming consent.
		return null;
	}
}

export function setConsent(choice: ConsentChoice) {
	try {
		localStorage.setItem(CONSENT_KEY, choice);
	} catch (err) {
		console.debug('[Consent] Failed to persist choice:', err);
	}

	if (choice === 'granted') {
		window.__ustaLoadAnalytics?.();
	} else {
		window.__ustaDenyAnalytics?.();
	}

	window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
}

/** Current choice, re-rendering when it changes anywhere in the app. */
export function useConsent(): ConsentChoice | null {
	const [choice, setChoice] = useState<ConsentChoice | null>(getConsent);

	useEffect(() => {
		const handler = () => setChoice(getConsent());
		window.addEventListener(CONSENT_EVENT, handler);
		// Another tab answering the banner counts too.
		window.addEventListener('storage', handler);
		return () => {
			window.removeEventListener(CONSENT_EVENT, handler);
			window.removeEventListener('storage', handler);
		};
	}, []);

	return choice;
}
