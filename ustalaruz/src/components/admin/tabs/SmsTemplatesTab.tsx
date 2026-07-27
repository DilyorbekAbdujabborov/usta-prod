import { useState } from 'react';
import { MessageSquareText, Save } from 'lucide-react';
import { Card, SectionHeader, Badge, GradientPageHeader, EmptyState } from '../AdminUI';
import type { AdminData } from '../useAdminData';
import type { SmsTemplate } from '../../../lib/api';

function TemplateRow({
	template,
	onSave,
}: {
	template: SmsTemplate;
	onSave: (key: string, body: string, isActive: boolean) => void;
}) {
	const [body, setBody] = useState(template.body);
	const dirty = body !== template.body;

	return (
		<Card className="p-4 flex flex-col gap-3">
			<div className="flex items-center justify-between gap-2 flex-wrap">
				<h4 className="text-xs font-black text-text-primary">{template.label}</h4>
				<div className="flex items-center gap-2">
					<Badge variant={template.isActive ? 'success' : 'neutral'}>
						{template.isActive ? 'Faol' : 'Nofaol'}
					</Badge>
					<button
						onClick={() => onSave(template.key, template.body, !template.isActive)}
						className="text-[11px] font-black text-brand hover:underline cursor-pointer"
					>
						{template.isActive ? "O'chirish" : 'Yoqish'}
					</button>
				</div>
			</div>
			<textarea
				value={body}
				onChange={(e) => setBody(e.target.value)}
				rows={3}
				className="w-full bg-surface-secondary border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-brand transition-all font-medium text-text-primary"
			/>
			<div className="flex items-center justify-between">
				<span className="text-[10px] text-text-muted font-bold">
					{'{code}'} — bir martalik kod uchun joy egallovchi (agar shablon shuni talab qilsa)
				</span>
				<button
					onClick={() => onSave(template.key, body, template.isActive)}
					disabled={!dirty}
					className="flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-lg bg-brand text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:opacity-90 transition-all"
				>
					<Save size={12} /> Saqlash
				</button>
			</div>
		</Card>
	);
}

export default function SmsTemplatesTab({ data }: { data: AdminData }) {
	const { smsTemplates, handlers } = data;

	const handleSave = (key: string, body: string, isActive: boolean) => {
		handlers.handleUpdateSmsTemplate(key, { body, isActive });
	};

	return (
		<div className="flex flex-col gap-6 text-left">
			<GradientPageHeader
				icon={MessageSquareText}
				title="SMS Shablonlari (Eskiz)"
				subtitle="Eskiz.uz orqali yuboriladigan SMS matnlarini boshqarish — ro'yxatdan o'tish, buyurtma holatlari, to'lovlar va parolni tiklash"
				badge="📩 Eskiz SMS"
				tone="slate"
			/>

			<SectionHeader
				title="Shablonlar"
				subtitle="Har bir shablon tegishli voqea yuz berganda avtomatik yuboriladi"
			/>

			{smsTemplates.length === 0 ? (
				<EmptyState icon={MessageSquareText} title="Shablon topilmadi" />
			) : (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					{smsTemplates.map((t) => (
						<TemplateRow key={t.key} template={t} onSave={handleSave} />
					))}
				</div>
			)}
		</div>
	);
}
