import { useMemo } from 'react';
import { motion } from 'motion/react';
import { useMotionPreset } from '../lib/useMotionPreset';
import { cacheBustUrl } from '../lib/cacheBust';

interface UstaLogoProps {
	className?: string;
	size?: number;
	interactive?: boolean;
	customUrl?: string | null;
	onClick?: (e: React.MouseEvent) => void;
}

export default function UstaLogo({
	className = '',
	size = 80,
	interactive = true,
	customUrl = null,
	onClick,
}: UstaLogoProps) {
	const { scaleHover, scaleTap, spring, enabled } = useMotionPreset();
	// The 192/512px files are the OS/PWA install icons (see manifest.json) -
	// this component never renders past 76px, so even the 192px file was
	// still 69KB for a ~150px-at-2x image (Lighthouse's image-delivery-
	// insight flagged this directly). icon-96x96.png is a dedicated in-app
	// asset, sharp at 2x for every size this component is actually used at.
	const src = useMemo(() => cacheBustUrl(customUrl || '/icon-96x96.png'), [customUrl]);
	return (
		<motion.div
			className={`relative select-none flex items-center justify-center overflow-hidden rounded-[24%] cursor-pointer ${className}`}
			style={{ width: size, height: size }}
			whileHover={interactive && enabled ? { scale: scaleHover, y: -2 } : {}}
			whileTap={interactive && enabled ? { scale: scaleTap } : {}}
			transition={
				enabled
					? {
							type: 'spring',
							stiffness: spring.stiffness,
							damping: spring.damping,
						}
					: { duration: 0 }
			}
			onClick={onClick}
		>
			<img
				src={src}
				alt="Master Group – Professional ustalar platformasi logotipi"
				className="w-full h-full object-cover select-none pointer-events-none border-0 outline-none shadow-none"
				referrerPolicy="no-referrer"
				draggable={false}
			/>
		</motion.div>
	);
}
