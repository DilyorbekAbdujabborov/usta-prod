import UstaLogo from './UstaLogo';
import AmbientBackground from './AmbientBackground';

// Full-screen branded splash shown once at app bootstrap while the session
// is being resolved (App.tsx's `!isLoaded`) - a few hundred ms on a warm
// cache, longer on a cold one, so it needs to look intentional rather than
// like a bare loading spinner.
export default function SplashScreen() {
	return (
		<div className="min-h-screen w-full relative flex flex-col items-center justify-center overflow-hidden bg-white dark:bg-surface">
			<AmbientBackground />
			<div className="relative z-10 flex flex-col items-center gap-5">
				<div className="relative flex items-center justify-center">
					<span className="absolute inset-0 rounded-3xl bg-brand/20 splash-pulse-ring" />
					<span className="absolute inset-0 rounded-3xl bg-brand/20 splash-pulse-ring splash-pulse-ring-delayed" />
					<UstaLogo size={76} interactive={false} />
				</div>
				<div className="flex items-center gap-2 text-text-secondary">
					<span className="w-1.5 h-1.5 rounded-full bg-brand splash-dot" />
					<span className="w-1.5 h-1.5 rounded-full bg-brand splash-dot splash-dot-2" />
					<span className="w-1.5 h-1.5 rounded-full bg-brand splash-dot splash-dot-3" />
				</div>
			</div>
		</div>
	);
}
