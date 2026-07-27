import React from 'react';
import {
	Grid,
	Droplet,
	Zap,
	Hammer,
	Wind,
	Flame,
	Wrench,
	Paintbrush,
	Sparkle,
	Wifi,
	Laptop,
	Camera,
	Tv,
	Terminal,
} from 'lucide-react';

export interface CategoryItem {
	id: string;
	name: string;
	icon: React.ComponentType<any>;
	color: string;
	image?: string;
}

export const CATEGORIES: CategoryItem[] = [
	{ id: 'all', name: 'Barchasi', icon: Grid, color: 'bg-brand/10 text-brand' },
	{
		id: 'plumbing',
		name: 'Santexnik',
		icon: Droplet,
		color: 'bg-blue-50 text-blue-600',
		image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1',
	},
	{
		id: 'electrician',
		name: 'Elektrik',
		icon: Zap,
		color: 'bg-amber-50 text-amber-600',
		image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e',
	},
	{
		id: 'construction',
		name: 'Qurilish',
		icon: Hammer,
		color: 'bg-orange-50 text-orange-600',
		image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd',
	},
	{
		id: 'ac',
		name: 'Konditsioner',
		icon: Wind,
		color: 'bg-cyan-50 text-cyan-600',
		image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586',
	},
	{
		id: 'welding',
		name: 'Payvandchi',
		icon: Flame,
		color: 'bg-red-50 text-red-600',
		image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122',
	},
	{
		id: 'carpenter',
		name: 'Duradgor',
		icon: Wrench,
		color: 'bg-amber-100 text-amber-800',
		image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88',
	},
	{
		id: 'painter',
		name: "Bo'yoqchi",
		icon: Paintbrush,
		color: 'bg-purple-50 text-purple-600',
		image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f',
	},
	{
		id: 'cleaning',
		name: 'Tozalash',
		icon: Sparkle,
		color: 'bg-blue-50 text-blue-600',
		image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952',
	},
	{
		id: 'internet',
		name: 'Internet',
		icon: Wifi,
		color: 'bg-indigo-50 text-indigo-600',
		image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8',
	},
	{
		id: 'computer',
		name: 'Kompyuter',
		icon: Laptop,
		color: 'bg-slate-50 text-slate-700',
		image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b',
	},
	{
		id: 'camera',
		name: 'Kamera',
		icon: Camera,
		color: 'bg-rose-50 text-rose-600',
		image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9',
	},
	{
		id: 'tv',
		name: 'Televizor',
		icon: Tv,
		color: 'bg-sky-50 text-sky-600',
		image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575',
	},
	{
		id: 'it',
		name: 'IT xizmatlari',
		icon: Terminal,
		color: 'bg-brand/10 text-brand',
		image: 'https://images.unsplash.com/photo-1605379399642-870262d3d051',
	},
];
