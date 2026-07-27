// Developer attribution. The UTM tags let AlphaCore attribute traffic that
// arrives from this footer specifically, rather than lumping it into
// "direct" alongside everything else.
const DEV_URL =
	'https://alphacore.sharqsoft.uz/?utm_source=mastergroup&utm_medium=referral&utm_campaign=developer_credit&utm_content=footer';

export default function DeveloperCredit({ className = '' }: { className?: string }) {
	return (
		<span className={className}>
			Ishlab chiquvchi:{' '}
			<a
				href={DEV_URL}
				target="_blank"
				rel="noopener"
				className="text-brand hover:underline underline-offset-2 font-bold"
			>
				AlphaCore
			</a>
		</span>
	);
}
