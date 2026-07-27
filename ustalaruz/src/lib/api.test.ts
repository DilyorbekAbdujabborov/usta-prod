import { describe, expect, it } from 'vitest';
import { normalizeApiBase } from './api';

// Every caller builds URLs as `${API_BASE}/api${path}`, so API_BASE has to be
// a bare origin. Setting VITE_API_BASE_URL to ".../api" once put the whole
// deploy behind /api/api/... and 404d every request.
describe('normalizeApiBase', () => {
	it('is empty for an unset or blank value, meaning same-origin', () => {
		expect(normalizeApiBase(undefined)).toBe('');
		expect(normalizeApiBase('')).toBe('');
		expect(normalizeApiBase('   ')).toBe('');
	});

	it('keeps a bare origin as-is', () => {
		expect(normalizeApiBase('https://mastergroup.uz')).toBe('https://mastergroup.uz');
		expect(normalizeApiBase('http://localhost:8000')).toBe('http://localhost:8000');
	});

	it('strips trailing slashes', () => {
		expect(normalizeApiBase('https://mastergroup.uz/')).toBe('https://mastergroup.uz');
		expect(normalizeApiBase('https://mastergroup.uz///')).toBe('https://mastergroup.uz');
	});

	it('strips a trailing /api so callers cannot double it', () => {
		expect(normalizeApiBase('https://mastergroup.uz/api')).toBe('https://mastergroup.uz');
		expect(normalizeApiBase('https://mastergroup.uz/api/')).toBe('https://mastergroup.uz');
	});

	it('leaves a path that merely ends in something like api alone', () => {
		expect(normalizeApiBase('https://mastergroup.uz/backendapi')).toBe(
			'https://mastergroup.uz/backendapi'
		);
	});

	it('produces a usable URL when a caller appends /api', () => {
		for (const raw of [
			'https://mastergroup.uz',
			'https://mastergroup.uz/',
			'https://mastergroup.uz/api',
			'https://mastergroup.uz/api/',
		]) {
			expect(`${normalizeApiBase(raw)}/api/version`).toBe(
				'https://mastergroup.uz/api/version'
			);
		}
	});
});
