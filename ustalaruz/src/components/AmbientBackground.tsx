// Three blurred gradient blobs drifting slowly behind hero/auth content.
// Pure CSS animation (transform/opacity only, see index.css) - no JS
// per-frame work, so it costs nothing extra on low-end devices, and
// prefers-reduced-motion freezes it globally.
export default function AmbientBackground() {
	return (
		<div className="ambient-blob-field" aria-hidden="true">
			<div className="ambient-blob ambient-blob-1" />
			<div className="ambient-blob ambient-blob-2" />
			<div className="ambient-blob ambient-blob-3" />
		</div>
	);
}
