import { ArrowLeft, Shield, Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
	const navigate = useNavigate();

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
					<Shield size={20} className="text-brand" />
				</div>
				<h1 className="text-2xl sm:text-3xl font-extrabold text-brand">
					Maxfiylik siyosati
				</h1>
			</div>
			<p className="text-xs text-text-secondary mb-8 ml-[52px]">
				Sambarali: 18-iyul, 2026 •-versiya 1.0
			</p>

			<div className="space-y-8 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
				<section>
					<h2 className="text-base font-bold text-text-primary mb-3 flex items-center gap-2">
						<span className="w-6 h-6 rounded-md bg-brand/10 text-brand text-xs font-bold flex items-center justify-center">1</span>
						Umumiy ma'lumot
					</h2>
					<p>
						"Master Group" ilovasi (bundan keyin "Ilova") foydalanuvchilarga professional
						ustalarni topish va ularga xizmat buyurtma qilish imkonini beradi.
						Ushbu maxfiylik siyosati Ilova orqali yig'iladigan, saqlanadigan va
						qayta ishlanadigan shaxsiy ma'lumotlarni tavsiflaydi.
					</p>
					<div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
						<p className="text-xs text-text-secondary">
							<strong>Ilova egasi:</strong> Master Group MCHJ<br />
							<strong>Manzil:</strong> Toshkent shahri, O'zbekiston<br />
							<strong>Ro'yxatdan o'tish raqami:</strong> XXXXXXXX
						</p>
					</div>
				</section>

				<section>
					<h2 className="text-base font-bold text-text-primary mb-3 flex items-center gap-2">
						<span className="w-6 h-6 rounded-md bg-brand/10 text-brand text-xs font-bold flex items-center justify-center">2</span>
						Yig'iladigan ma'lumotlar
					</h2>
					<p>Ilova quyidagi shaxsiy ma'lumotlarni yig'ishi mumkin:</p>
					<div className="mt-3 grid gap-2">
						{[
							{ title: 'Ism va familiya', desc: "Ro'yxatdan o'tish paytida kiritiladi" },
							{ title: 'Telefon raqami', desc: 'Autentifikatsiya va bog\'lanish uchun' },
							{ title: 'Lokatsiya ma\'lumotlari', desc: 'Yaqin atrofdagi ustalarni topish uchun (faqat ruxsat bilan)' },
							{ title: 'Xizmat buyurtmalari', desc: 'Buyurtmalar tarixi va holati' },
							{ title: 'Sharh va baholar', desc: "Ustalar haqida qoldirilgan fikrlar" },
							{ title: 'To\'lov ma\'lumotlari', desc: 'Tranzaksiyalar tarixi (to\'liq kartaroq raqamlari saqlanmaydi)' },
						].map((item) => (
							<div key={item.title} className="flex items-start gap-2 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
								<span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
								<div>
									<span className="font-semibold text-text-primary">{item.title}</span>
									<span className="text-text-secondary"> — {item.desc}</span>
								</div>
							</div>
						))}
					</div>
				</section>

				<section>
					<h2 className="text-base font-bold text-text-primary mb-3 flex items-center gap-2">
						<span className="w-6 h-6 rounded-md bg-brand/10 text-brand text-xs font-bold flex items-center justify-center">3</span>
						Ma'lumotlardan foydalanish
					</h2>
					<p>Yig'ilgan ma'lumotlar quyidagi maqsadlarda ishlatiladi:</p>
					<ul className="list-disc pl-5 mt-2 space-y-1.5">
						<li>Ilova xizmatlarini ko'rsatish va yaxshilash</li>
						<li>Foydalanuvchilar o'rtasida bog'lanishni ta'minlash</li>
						<li>Buyurtmalar va to'lovlarni boshqarish</li>
						<li>Texnik yordam ko'rsatish</li>
						<li>Xavfsizlik va firibgarlikning oldini olish</li>
						<li>Qonuniy majburiyatlarni bajarish</li>
					</ul>
				</section>

				<section>
					<h2 className="text-base font-bold text-text-primary mb-3 flex items-center gap-2">
						<span className="w-6 h-6 rounded-md bg-brand/10 text-brand text-xs font-bold flex items-center justify-center">4</span>
						Ma'lumotlarni saqlash va himoya qilish
					</h2>
					<p>
						Foydalanuvchi ma'lumotlari xavfsiz serverlarda SSL/TLS shifrlash
						bilan saqlanadi. Ma'lumotlar faqat xizmatni ko'rsatish uchun zarur
						bo'lgan muddat davomida saqlanadi.
					</p>
					<div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50">
						<p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
							🔒 Foydalanuvchi o'z hisobini o'chirishni so'rasa, uning shaxsiy
							ma'lumotlari 30 kun ichida butunlay o'chiriladi.
						</p>
					</div>
				</section>

				<section>
					<h2 className="text-base font-bold text-text-primary mb-3 flex items-center gap-2">
						<span className="w-6 h-6 rounded-md bg-brand/10 text-brand text-xs font-bold flex items-center justify-center">5</span>
						Ma'lumotlarni uchinchi tomonlar bilan bo'lishish
					</h2>
					<p>
						Biz foydalanuvchilarning shaxsiy ma'lumotlarini uchinchi tomonlarga
						sotmaymiz yoki ijaraga bermaymiz. Quyidagi holatlarda ma'lumotlar
						boshqalar bilan bo'lishilishi mumkin:
					</p>
					<ul className="list-disc pl-5 mt-2 space-y-1.5">
						<li>Foydalanuvchi o'zi ruxsat bergan holda</li>
						<li>Qonun talab qilgan hollarda (sud buyrug'i yoki huquqni muhofaza qilish organlari so'rovi)</li>
						<li>Xizmat ko'rsatuvchi hamkorlar bilan (to'lov tizimlari, SMS xizmatlari) — faqat xizmatni ko'rsatish uchun zarur miqdorda</li>
					</ul>
				</section>

				<section>
					<h2 className="text-base font-bold text-text-primary mb-3 flex items-center gap-2">
						<span className="w-6 h-6 rounded-md bg-brand/10 text-brand text-xs font-bold flex items-center justify-center">6</span>
						Foydalanuvchining huquqlari
					</h2>
					<div className="grid sm:grid-cols-2 gap-2 mt-2">
						{[
							"O'z shaxsiy ma'lumotlarini ko'rish",
							"Noto'g'ri ma'lumotlarni tahrirlash",
							"Hisobni to'liq o'chirishni so'rash",
							"Ma'lumotlar eksportini so'rash",
							"Marketga baholashdan voz kechish",
							"Maxfiylik siyosati haqida ma'lumot olish",
						].map((right) => (
							<div key={right} className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
								<svg className="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
									<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
								</svg>
								<span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{right}</span>
							</div>
						))}
					</div>
				</section>

				<section>
					<h2 className="text-base font-bold text-text-primary mb-3 flex items-center gap-2">
						<span className="w-6 h-6 rounded-md bg-brand/10 text-brand text-xs font-bold flex items-center justify-center">7</span>
						Bolarning maxfiyligi
					</h2>
					<p>
						Ilova 13 yoshdan kichik bolalardan ma'lumot yig'maydi. Agar
						biz 13 yoshdan kichik foydalanuvchining shaxsiy ma'lumotlarini
						aniqlasak, ularni darhol o'chirib tashlaymiz.
					</p>
				</section>

				<section>
					<h2 className="text-base font-bold text-text-primary mb-3 flex items-center gap-2">
						<span className="w-6 h-6 rounded-md bg-brand/10 text-brand text-xs font-bold flex items-center justify-center">8</span>
						Cookie fayllar
					</h2>
					<p>
						Ilova sessiya boshqaruv va autentifikatsiya maqsadlarda zarur cookie
						fayllardan foydalanadi — ular ilova ishlashi uchun majburiy.
					</p>
					<p className="mt-2">
						Bundan tashqari, xizmat sifatini yaxshilash uchun anonim statistika
						(Google Analytics) yig'ilishi mumkin. Bu faqat siz birinchi kirishda
						chiqadigan oynada ruxsat berganingizdan keyin yoqiladi — rad etsangiz,
						Google skriptlari umuman yuklanmaydi va hech qanday analitika cookie
						fayli yaratilmaydi. Tanlovingizni brauzer ma'lumotlarini tozalash
						orqali istalgan vaqtda qaytarib olishingiz mumkin.
					</p>
				</section>

				<section>
					<h2 className="text-base font-bold text-text-primary mb-3 flex items-center gap-2">
						<span className="w-6 h-6 rounded-md bg-brand/10 text-brand text-xs font-bold flex items-center justify-center">9</span>
						Maxfiylik siyosatidagi o'zgarishlar
					</h2>
					<p>
						Biz ushbu maxfiylik siyosatini vaqti-vaqti bilan yangilashimiz
						mumkin. O'zgarishlar ushbu sahifada e'lon qilinadi. O'zgarishlar
						qabul qilingandan so'ng Ilovani davom ettirish orqali foydalanuvchi
						ushbu o'zgarishlarni qabul qilgan hisoblanadi.
					</p>
				</section>

				<section>
					<h2 className="text-base font-bold text-text-primary mb-3 flex items-center gap-2">
						<span className="w-6 h-6 rounded-md bg-brand/10 text-brand text-xs font-bold flex items-center justify-center">10</span>
						Bog'lanish
					</h2>
					<p>
						Maxfiylik siyosati yoki shaxsiy ma'lumotlar bilan bog'liq
						savollaringiz bo'lsa, biz bilan bog'laning:
					</p>
					<div className="mt-3 grid sm:grid-cols-3 gap-2">
						<div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
							<Mail size={16} className="text-brand shrink-0" />
							<div>
								<p className="text-[10px] text-text-secondary uppercase font-bold">Email</p>
								<p className="text-xs font-semibold text-text-primary">info@ustalar.uz</p>
							</div>
						</div>
						<div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
							<Phone size={16} className="text-brand shrink-0" />
							<div>
								<p className="text-[10px] text-text-secondary uppercase font-bold">Telefon</p>
								<p className="text-xs font-semibold text-text-primary">+998 XX XXX XX XX</p>
							</div>
						</div>
						<div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
							<MapPin size={16} className="text-brand shrink-0" />
							<div>
								<p className="text-[10px] text-text-secondary uppercase font-bold">Manzil</p>
								<p className="text-xs font-semibold text-text-primary">Toshkent, O'zbekiston</p>
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
