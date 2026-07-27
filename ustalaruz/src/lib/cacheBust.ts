export function cacheBustUrl(url: string, key = 'Usta_cache_version'): string {
  if (!url || url.startsWith('data:')) return url;
  const version = localStorage.getItem(key) || '0';
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${version}`;
}
