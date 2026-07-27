import {
  ChevronLeft, Briefcase, User, Image, Settings,
  Save, AlertTriangle, CheckCircle2, Clock, Wrench
} from 'lucide-react';
import { REGION_DATA } from '../../lib/regions';
import { store } from '../UstaApp.store';

export default function WorkspaceTab() {
  const {
    setActiveTab, isDarkMode, showToast,
    uploadImageFile,
    ws, dispatchWs, sw,
    workspaceName, workspacePhone, workspaceAvatar,
    workspaceRegion, workspaceDistrict,
    workspaceHours, workspaceOffDays, workspaceActive,
    hasActiveMasterOrder,
    handleSaveWorkspaceProfile,
    handleSaveWorkingSettings,
    partnershipAvatar,
  } = store;

  return (
    <div className="p-4 flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
        <button onClick={() => setActiveTab('home')} className="flex items-center gap-1 text-xs font-black text-brand dark:text-blue-400 hover:opacity-80">
          <ChevronLeft size={16} /> Ish stoliga qaytish
        </button>
        <span className="text-[10px] bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md font-black uppercase tracking-wider flex items-center gap-1">
          <Briefcase size={12} /> Ish kabineti
        </span>
      </div>

      <div className="p-4 rounded-xl border flex flex-col gap-3 bg-surface-card border-border shadow-sm">
        <div className="flex items-center gap-2 border-b pb-2.5 border-slate-100 dark:border-slate-800">
          <User size={18} className="text-brand dark:text-blue-400 select-none" />
          <h4 className="text-xs font-black uppercase tracking-wider">Profil ma'lumotlari</h4>
        </div>

        <div className="flex flex-col gap-2.5 mt-1">
          <div>
            <label className="text-[9px] text-text-secondary font-extrabold uppercase block mb-1">Profil rasmi:</label>
            <div className="flex gap-2 items-center">
              <img loading="lazy" src={workspaceAvatar || partnershipAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'} className="w-11 h-11 rounded-xl object-cover avatar-face border-2 border-slate-200 dark:border-slate-800 shrink-0 bg-white" alt="Usta profil rasmi" />
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-black text-[9px] text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1 text-purple-700 dark:text-purple-300 shadow-sm">
                  <Image size={12} className="select-none" /> Galeriyadan rasm yuklash
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) { showToast('Rasm hajmi juda katta! 5MB dan kam rasm yuklang.', 'error'); return; }
                    try {
                      const url = await uploadImageFile(file);
                      sw('avatar', url);
                      showToast('Rasm muvaffaqiyatli tanlandi!', 'success');
                    } catch { showToast('Rasmni yuklashda xatolik yuz berdi.', 'error'); }
                  }} />
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[9px] text-text-secondary font-extrabold uppercase block mb-1">F.I.Sh. (To'liq ism):</label>
            <input type="text" value={workspaceName} onChange={(e) => sw('name', e.target.value)} placeholder="Akramov Biloliddin" className="w-full px-3 py-2 text-xs font-bold rounded-lg border focus:outline-none focus:ring-1 focus:ring-brand bg-surface-input border-border text-text-primary" />
          </div>

          <div>
            <label className="text-[9px] text-text-secondary font-extrabold uppercase block mb-1">Telefon raqam:</label>
            <input type="text" value={workspacePhone} onChange={(e) => sw('phone', e.target.value)} placeholder="+998 90 123-45-67" className="w-full px-3 py-2 text-xs font-bold rounded-lg border focus:outline-none focus:ring-1 focus:ring-brand bg-surface-input border-border text-text-primary" />
          </div>

          <div>
            <label className="text-[9px] text-text-secondary font-extrabold uppercase block mb-1">Ish hududi:</label>
            {hasActiveMasterOrder && (
              <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold mb-1.5 flex items-center gap-1">
                <AlertTriangle size={11} /> Faol buyurtmangiz bor - hudud almashtirish vaqtincha bloklangan.
              </p>
            )}
            <div className="flex gap-2">
              <select value={workspaceRegion} disabled={hasActiveMasterOrder} onChange={(e) => { const newReg = e.target.value; sw('region', newReg); sw('district', REGION_DATA[newReg]?.[0] || ''); }} className="flex-1 px-3 py-2 text-xs font-bold rounded-lg border focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50 disabled:cursor-not-allowed bg-surface-input border-border text-text-primary">
                {Object.keys(REGION_DATA).map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={workspaceDistrict} disabled={hasActiveMasterOrder} onChange={(e) => sw('district', e.target.value)} className="flex-1 px-3 py-2 text-xs font-bold rounded-lg border focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50 disabled:cursor-not-allowed bg-surface-input border-border text-text-primary">
                {(REGION_DATA[workspaceRegion] || []).map((d: string) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl border flex flex-col gap-3.5 bg-surface-card border-border shadow-sm">
        <div className="flex items-center justify-between border-b pb-2.5 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-brand dark:text-blue-400 select-none" />
            <h4 className="text-xs font-black uppercase tracking-wider">Ishchi holat va sozlamalar</h4>
          </div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${workspaceActive ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-500/10 text-rose-500'}`}>
            {workspaceActive ? 'Faol' : 'Dam olishda'}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[9px] text-text-secondary font-extrabold uppercase block mb-1">Kunlik Ish soatlari:</label>
            <input type="text" value={workspaceHours} onChange={(e) => sw('hours', e.target.value)} placeholder="Masalan: 09:00 - 18:00 yoki 24/7" className="w-full px-3 py-2 text-xs font-bold rounded-lg border focus:outline-none focus:ring-1 focus:ring-brand bg-surface-input border-border text-text-primary" />
          </div>

          <div>
            <label className="text-[9px] text-text-secondary font-extrabold uppercase block mb-1.5">Dam olish kunlari (tanlang):</label>
            <div className="flex flex-wrap gap-1.5">
              {['Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba','Yakshanba'].map((day) => {
                const isOff = workspaceOffDays.includes(day);
                return (
                  <button key={day} type="button" onClick={() => { if (isOff) { sw('offDays', ws.offDays.filter((d: string) => d !== day)); } else { sw('offDays', [...ws.offDays, day]); } }} className={`px-2.5 py-1 text-[9.5px] font-bold rounded-xl border transition-all cursor-pointer ${isOff ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50' : isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700' : 'bg-surface-input border-border text-slate-600 hover:border-slate-300'}`}>
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-card border border-border shadow-sm">
            <div>
              <span className="text-[10px] font-black text-text-primary block mb-0.5">Ish faoliyat holati</span>
              <span className="text-[9px] text-text-primary font-extrabold leading-normal">"Nofaol" rejimida sizga xizmat buyurtma berib bo'lmaydi</span>
            </div>
            <button type="button" onClick={() => sw('active', !ws.active)} className={`px-3 py-1.5 rounded-xl font-black text-[9.5px] uppercase transition-all cursor-pointer ${workspaceActive ? 'bg-blue-600 text-white hover:bg-brand-hover' : 'bg-slate-400 dark:bg-slate-600 text-white hover:bg-slate-500 dark:hover:bg-slate-500'}`}>
              {workspaceActive ? 'Faol' : 'Nofaol'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <button onClick={() => {
          if (!workspaceName || !workspacePhone) { showToast("Ism va telefon raqam bo'sh bo'lishi mumkin emas!", 'error'); return; }
          handleSaveWorkspaceProfile(workspaceName, workspacePhone, workspaceAvatar, workspaceRegion, workspaceDistrict);
          handleSaveWorkingSettings(workspaceHours, workspaceOffDays, workspaceActive);
        }} className="flex-1 py-3 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-black text-xs rounded-2xl text-center shadow-lg cursor-pointer transition-all flex items-center justify-center gap-1.5">
          <Save size={14} className="select-none" /> O'zgarishlarni saqlash
        </button>
      </div>
    </div>
  );
}
