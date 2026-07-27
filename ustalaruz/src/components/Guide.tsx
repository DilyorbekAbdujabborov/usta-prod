import { useState } from 'react';
import {
	ArrowLeft, BookOpen, User, Wrench, ShieldCheck,
	Search, Calendar, MessageSquare, Briefcase, Award,
	CheckCircle2, Star,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Role = 'client' | 'master' | 'admin';

interface Step {
	title: string;
	desc: string;
}

const CLIENT_STEPS: Step[] = [
	{
		title: "Ro'yxatdan o'ting",
		desc: "\"Ro'yxatdan o'tish\" tugmasi orqali ism, telefon raqami va parol bilan hisob oching. Hisob avtomatik \"Mijoz\" roli bilan yaratiladi.",
	},
	{
		title: 'Buyurtma yarating',
		desc: "\"Yaratish\" bo'limida kerakli toifani tanlang (masalan Santexnik, Elektrik, Qurilish), ishning tavsifini yozing, taxminiy byudjet va manzilni kiriting.",
	},
	{
		title: 'Usta tanlang',
		desc: "\"Usta qidirish\" bo'limida toifa, viloyat va reyting bo'yicha filtrlab, usta profilini (tajriba, sharhlar, narx) ko'ring va \"Xabarlar\" orqali bevosita yozishing mumkin.",
	},
	{
		title: 'Holatni kuzating',
		desc: "\"Buyurtmalar\" bo'limida buyurtma holati ko'rinadi: kutilmoqda → faol → bajarildi (yoki kechiktirildi/bekor qilindi — sababi bilan).",
	},
	{
		title: 'Baholang',
		desc: "Ish tugagach buyurtmani \"Bajarildi\" deb belgilaysiz va ustaga reyting/sharh qoldirasiz — bu keyingi mijozlarga yordam beradi.",
	},
];

const MASTER_STEPS: Step[] = [
	{
		title: "Hamkor bo'lish arizasi",
		desc: "Profil → \"Usta bo'ling\" tugmasi orqali ism, kasbiy toifa, tajriba va viloyatingizni kiritib ariza yuboring. Ariza holati: kutilmoqda → tasdiqlandi/rad etildi.",
	},
	{
		title: "Ish stolim (Workspace)",
		desc: "Ariza tasdiqlangach, \"Ish stolim\" bo'limi ochiladi — hududingizdagi yangi buyurtmalarni shu yerda ko'rasiz va qabul qilasiz.",
	},
	{
		title: "Faollik va Premium",
		desc: "Profilda \"Faoliyat rejimi\"ni yoqib turing — aks holda mijozlar sizni qidiruvda ko'rmaydi. Premium tarifga o'tib qidiruvda yuqorida chiqishingiz mumkin (to'lov chekini yuklaysiz, admin tasdiqlaydi).",
	},
	{
		title: 'Buyurtmani bajarish',
		desc: "Mijoz bilan \"Xabarlar\" orqali kelishib, ishni bajarasiz va holatni yangilaysiz: qabul qilindi → jarayonda → bajarildi (kechiksangiz sababini ko'rsatib \"kechiktirildi\" deb belgilang).",
	},
	{
		title: 'Reyting yig\'ing',
		desc: "Har bir bajarilgan ish uchun mijoz sharh qoldiradi — yuqori reyting yangi mijozlarni jalb qiladi.",
	},
];

const ADMIN_STEPS: Step[] = [
	{
		title: 'Admin panelga kirish',
		desc: "Hisobingiz \"Admin\" rolida bo'lsa, Profil bo'limida \"Admin panel\" tugmasi ko'rinadi. Bu — frontenddagi boshqaruv paneli (Django admin’dan alohida).",
	},
	{
		title: 'Arizalarni tasdiqlash',
		desc: "\"Approvals\" tabida yangi usta arizalari ko'rinadi — hujjat/tajribani tekshirib \"Tasdiqlash\" yoki \"Rad etish\" bosasiz. Tasdiqlangan usta darhol \"Ish stolim\"ga ega bo'ladi.",
	},
	{
		title: "Buyurtma va to'lovlarni nazorat qilish",
		desc: "\"Orders\" tabida barcha buyurtmalar, \"Payments\" tabida Premium to'lov cheklari ko'rinadi — chek rasmiga qarab tasdiqlaysiz yoki rad etasiz.",
	},
	{
		title: 'Kontentni boshqarish',
		desc: "\"Categories\", \"Ads\", \"Marketplace\", \"SmsTemplates\", \"Logo\" tablarida toifalar, bannerlar va SMS matnlarini tahrirlaysiz.",
	},
	{
		title: "Qo'llab-quvvatlash va tahlil",
		desc: "\"Support\"/\"Conversations\" tabida foydalanuvchi murojaatlariga javob berasiz, \"Analytics\" tabida umumiy statistikani (ustalar, buyurtmalar, tushum) kuzatasiz.",
	},
	{
		title: 'Django admin (server sozlamalari)',
		desc: "/admin manzilida — SMS shablonlari, sayt sozlamalari va PWA manifest.json (ilova nomi, ranglari) shu yerdan, kod o'zgartirmasdan boshqariladi.",
	},
];

const ROLE_CONFIG: Record<Role, {
	label: string;
	icon: typeof User;
	color: string;
	steps: Step[];
	example: string;
}> = {
	client: {
		label: 'Mijoz',
		icon: User,
		color: 'blue',
		steps: CLIENT_STEPS,
		example:
			"Kraningiz oqmoqda. \"Yaratish\" → toifa: Santexnik → tavsif: \"Kran oqmoqda, tezroq kerak\" → byudjet: 150 000 so'm → manzil: Chilonzor. 10 daqiqada 3 ta usta javob beradi — reyting va narxini solishtirib birini tanlaysiz, \"Xabarlar\"da manzil aniqlashtirasiz. Usta ishni tugatgach buyurtmani \"Bajarildi\" qilib, 5 yulduz va sharh qoldirasiz.",
	},
	master: {
		label: 'Usta',
		icon: Wrench,
		color: 'emerald',
		steps: MASTER_STEPS,
		example:
			"Siz elektriksiz. Profil → \"Usta bo'ling\" → toifa: Elektrik, tajriba: 5 yil, viloyat: Toshkent — arizani yuborasiz. Admin bir necha soatda tasdiqlaydi. \"Ish stolim\"da \"Rozetka almashtirish, Yunusobod, 80 000 so'm\" buyurtmasini ko'rib qabul qilasiz, mijozga xabar yozib manzilga borasiz, ishni bajarib \"Bajarildi\" deb belgilaysiz.",
	},
	admin: {
		label: 'Admin',
		icon: ShieldCheck,
		color: 'amber',
		steps: ADMIN_STEPS,
		example:
			"Yangi usta arizasi keldi. \"Approvals\" tabini ochasiz, hujjatlarini ko'rasiz va \"Tasdiqlash\"ni bosasiz — foydalanuvchiga SMS/push bildirishnoma boradi va u \"Ish stolim\" orqali buyurtma qabul qila boshlaydi. Ertasiga to'lov cheki tushadi — \"Payments\" tabida chekni ko'rib \"Tasdiqlash\" bossangiz, uning profili Premium bo'lib qidiruvda birinchi o'rinlarga chiqadi.",
	},
};

const COLOR_CLASSES: Record<string, { activeBg: string; activeText: string; iconBg: string; iconText: string; exampleBg: string; exampleBorder: string; exampleText: string }> = {
	blue: {
		activeBg: 'bg-blue-600',
		activeText: 'text-white',
		iconBg: 'bg-blue-500/10',
		iconText: 'text-blue-600 dark:text-blue-400',
		exampleBg: 'bg-blue-50 dark:bg-blue-950/30',
		exampleBorder: 'border-blue-100 dark:border-blue-900/50',
		exampleText: 'text-blue-700 dark:text-blue-300',
	},
	emerald: {
		activeBg: 'bg-emerald-600',
		activeText: 'text-white',
		iconBg: 'bg-emerald-500/10',
		iconText: 'text-emerald-600 dark:text-emerald-400',
		exampleBg: 'bg-emerald-50 dark:bg-emerald-950/30',
		exampleBorder: 'border-emerald-100 dark:border-emerald-900/50',
		exampleText: 'text-emerald-700 dark:text-emerald-300',
	},
	amber: {
		activeBg: 'bg-amber-600',
		activeText: 'text-white',
		iconBg: 'bg-amber-500/10',
		iconText: 'text-amber-600 dark:text-amber-400',
		exampleBg: 'bg-amber-50 dark:bg-amber-950/30',
		exampleBorder: 'border-amber-100 dark:border-amber-900/50',
		exampleText: 'text-amber-700 dark:text-amber-300',
	},
};

const NAV_ICONS = [
	{ icon: Search, label: 'Usta qidirish' },
	{ icon: Calendar, label: 'Buyurtmalar' },
	{ icon: MessageSquare, label: 'Xabarlar' },
	{ icon: Briefcase, label: 'Ish stolim' },
];

export default function Guide() {
	const navigate = useNavigate();
	const [role, setRole] = useState<Role>('client');
	const config = ROLE_CONFIG[role];
	const colors = COLOR_CLASSES[config.color];
	const RoleIcon = config.icon;

	return (
		<div className="w-full max-w-3xl mx-auto text-left">
			<button
				onClick={() => navigate(-1)}
				className="flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-brand transition-colors mb-6 cursor-pointer"
			>
				<ArrowLeft size={16} />
				Orqaga
			</button>

			<div className="flex items-center gap-3 mb-2">
				<div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
					<BookOpen size={20} className="text-brand" />
				</div>
				<h1 className="text-2xl sm:text-3xl font-extrabold text-brand">
					Foydalanish qo'llanmasi
				</h1>
			</div>
			<p className="text-xs text-text-secondary mb-6 ml-[52px]">
				Har bir rol uchun qadam-baqadam yo'riqnoma va aniq misol
			</p>

			{/* Role switcher */}
			<div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 mb-8">
				{(Object.keys(ROLE_CONFIG) as Role[]).map((r) => {
					const c = ROLE_CONFIG[r];
					const Icon = c.icon;
					const active = role === r;
					const rc = COLOR_CLASSES[c.color];
					return (
						<button
							key={r}
							onClick={() => setRole(r)}
							className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
								active ? `${rc.activeBg} ${rc.activeText} shadow-sm` : 'text-text-secondary hover:text-text-primary'
							}`}
						>
							<Icon size={14} />
							{c.label}
						</button>
					);
				})}
			</div>

			<div className="flex items-center gap-3 mb-5">
				<div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center`}>
					<RoleIcon size={20} className={colors.iconText} />
				</div>
				<h2 className="text-lg font-bold text-text-primary">
					{config.label} sifatida qanday ishlaydi
				</h2>
			</div>

			<div className="space-y-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
				{config.steps.map((step, idx) => (
					<section key={step.title} className="flex gap-3">
						<span className={`w-6 h-6 rounded-md ${colors.iconBg} ${colors.iconText} text-xs font-bold flex items-center justify-center shrink-0 mt-0.5`}>
							{idx + 1}
						</span>
						<div>
							<h3 className="font-bold text-text-primary mb-1">{step.title}</h3>
							<p>{step.desc}</p>
						</div>
					</section>
				))}

				<div className={`mt-2 p-4 rounded-xl border ${colors.exampleBg} ${colors.exampleBorder}`}>
					<p className={`text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5 ${colors.exampleText}`}>
						<Star size={13} /> Misol
					</p>
					<p className={`text-xs font-medium ${colors.exampleText}`}>{config.example}</p>
				</div>
			</div>

			{role !== 'admin' && (
				<div className="mt-8 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
					<p className="text-xs font-black uppercase tracking-wider text-text-secondary mb-3 flex items-center gap-1.5">
						<CheckCircle2 size={13} className="text-brand" /> Ilovadagi asosiy bo'limlar
					</p>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
						{NAV_ICONS.filter((n) => role === 'master' || n.label !== 'Ish stolim').map((n) => (
							<div key={n.label} className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-white dark:bg-surface-card border border-slate-100 dark:border-slate-800">
								<n.icon size={16} className="text-brand" />
								<span className="text-[10px] font-bold text-text-secondary text-center">{n.label}</span>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="mt-6 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
				<Award size={18} className="text-brand shrink-0 mt-0.5" />
				<p className="text-xs text-text-secondary">
					Savolingiz qolsa, Profil → "Yordam va qo'llab-quvvatlash" orqali qo'llab-quvvatlash xizmatiga yozing.
				</p>
			</div>
		</div>
	);
}
