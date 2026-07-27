import {
  Pencil, CreditCard, HelpCircle, Moon, Sun, Monitor,
  ChevronRight, LayoutDashboard, Smartphone, Award, Clock,
  Wrench, AlertTriangle, RefreshCw, Plus, CheckCircle2,
  LogOut, User, UserCheck, Briefcase, MapPin, Phone, Trash2,
  XCircle, Save, Shield, BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../../lib/categories';
import { REGION_DATA } from '../../lib/regions';
import { store } from '../UstaApp.store';
import AppVersionFooter from '../AppVersionFooter';

export default function ProfileTab() {
  const navigate = useNavigate();
  const {
    userSession, masterStatus, partnershipName, partnershipCategory,
    partnershipPhone, partnershipAvatar, partnershipFirstName,
    partnershipLastName, partnershipExtraPhone, partnershipTelegram,
    partnershipSpecialty, partnershipExp, partnershipPrice,
    partnershipServices, partnershipPriceComment, partnershipBio,
    partnershipRegion, partnershipDistrict,
    setActiveTab, showToast, isDarkMode, theme, cycleTheme,
    customLogoUrl, onLogoClick,
    isPremiumActive, premiumTimeLeft,
    pendingPayments, setPaymentHistoryModalOpen,
    pwaInstallPrompt, setPwaInstallPrompt, setPwaModalOpen, pwaModalOpen,
    masterIsActive, myMasterProfile, allMasters,
    profileEditTab,
    masterWorkStart, masterWorkEnd, masterRestDays,
    handleAvatarFileChange, handleSavePartnershipProfile,
    activePendingPayment, tariffs, paymentPackage, paymentReceipt,
    paymentProofImage, submittingPayment, handlePayPremiumSubmit,
    handlePaymentProofUpload, adminCard, adminCardHolder,
    showPwaBanner, setShowPwaBanner,
    sp, spm, sep, ps, pm, ep, isSamePhone, currentUstaPhone,
    setAllMasters, api, dbMasterToLegacy, sw, ws,
    UstaLogo, onLogout, onAdminOpen, authProfile,
  } = store;

  return (
    <div className="p-4 flex flex-col gap-5 lg:max-w-3xl lg:mx-auto lg:w-full">
      <div className="p-5 rounded-xl border flex flex-col items-center text-center relative bg-surface-card border-border shadow-sm">
        <button onClick={() => sep('modalOpen', true)} className={`absolute top-3 right-3 p-2 rounded-xl cursor-pointer transition-all ${isDarkMode ? 'bg-surface-tertiary text-text-primary hover:bg-surface-secondary' : 'bg-slate-50 text-text-secondary hover:bg-surface-tertiary'}`} aria-label="Profilni tahrirlash">
          <Pencil size={13} />
        </button>

        <div className="flex justify-center mb-3">
          <UstaLogo size={66} customUrl={customLogoUrl} onClick={onLogoClick} />
        </div>
        <h3 className="text-base font-black text-text-primary">{userSession?.name || 'Javlonbek Akramov'}</h3>
        {masterStatus === 'approved' && (
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mt-0.5">Usta statusi (Hamkor)</p>
        )}

        <div className="w-full h-px bg-slate-50 dark:bg-slate-800/80 my-4" />

        <div className="flex flex-col gap-2.5 w-full text-left text-xs text-text-secondary font-bold">
          <div className="flex items-center justify-between">
            <span>Telefon:</span>
            <span className="text-slate-950 dark:text-white font-black font-mono">{userSession?.phone || '+998 90 123-45-67'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Xizmat shartnomasi:</span>
            <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-[9px]">Tasdiqlangan</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {masterStatus === 'approved' && (
          <button onClick={() => { setActiveTab('workspace'); showToast("Ish stolingizga o'tdingiz", 'info'); }} className={`w-full py-3.5 px-4 rounded-xl border border-blue-500/20 font-black text-xs flex items-center justify-between cursor-pointer bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 text-blue-700 dark:text-blue-300`}>
            <span className="flex items-center gap-2"><LayoutDashboard size={14} className="text-blue-600 dark:text-blue-400" /> Shaxsiy ish stoliga o'tish</span>
            <ChevronRight size={14} className="text-blue-400" />
          </button>
        )}

        <button onClick={() => setPaymentHistoryModalOpen(true)} className="w-full py-3 px-4 rounded-xl border border-border bg-surface-card font-bold text-xs flex items-center justify-between cursor-pointer hover:bg-surface-tertiary transition-colors">
          <span className="flex items-center gap-2"><CreditCard size={14} className="text-brand" /> To'lovlar tarixi{pendingPayments.length > 0 && <span className="bg-brand/10 text-brand text-[9px] font-black px-1.5 py-0.5 rounded-full">{pendingPayments.length}</span>}</span>
          <ChevronRight size={14} />
        </button>

        <button onClick={() => navigate('/guide')} className="w-full py-3 px-4 rounded-xl border border-border bg-surface-card font-bold text-xs flex items-center justify-between cursor-pointer hover:bg-surface-tertiary transition-colors">
          <span className="flex items-center gap-2"><BookOpen size={14} className="text-brand" /> Foydalanish qo'llanmasi</span>
          <ChevronRight size={14} />
        </button>

        <button onClick={() => showToast('Yordam xizmati: @Usta_Support_Bot', 'info')} className="w-full py-3 px-4 rounded-xl border border-border bg-surface-card font-bold text-xs flex items-center justify-between cursor-pointer hover:bg-surface-tertiary transition-colors">
          <span className="flex items-center gap-2"><HelpCircle size={14} className="text-brand" /> Yordam va qo'llab-quvvatlash</span>
          <ChevronRight size={14} />
        </button>

        {onAdminOpen && (
          <button onClick={onAdminOpen} className="w-full py-3 px-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 font-bold text-xs flex items-center justify-between cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors">
            <span className="flex items-center gap-2"><Shield size={14} className="text-amber-600 dark:text-amber-400" /> Admin panel</span>
            <ChevronRight size={14} />
          </button>
        )}

        <button onClick={() => { cycleTheme(); showToast(theme === 'light' ? 'Tungi rejim yoqildi' : theme === 'dark' ? 'Tizim rejimi yoqildi' : 'Kunduzgi rejim yoqildi', 'info'); }} className="w-full py-3 px-4 rounded-xl border border-border bg-surface-card font-bold text-xs flex items-center justify-between cursor-pointer hover:bg-surface-tertiary transition-all duration-200 group" aria-label={theme === 'light' ? 'Tungi rejim' : theme === 'dark' ? 'Tizim rejimi' : 'Kunduzgi rejim'}>
          <span className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-brand/10 text-brand transition-transform duration-300 group-hover:scale-110">
              {theme === 'light' ? <Moon size={14} /> : theme === 'dark' ? <Sun size={14} /> : <Monitor size={14} />}
            </span>
            <span className="text-text-primary text-[11px]">{theme === 'light' ? 'Tungi rejim' : theme === 'dark' ? 'Kunduzgi rejim' : 'Tizim rejimi'}</span>
          </span>
          <span className={`relative w-12 h-6 rounded-full transition-all duration-300 shrink-0 ${theme === 'dark' ? 'bg-brand shadow-[inset_0_0_4px_rgba(29,78,216,0.5)]' : theme === 'light' ? 'bg-amber-400 shadow-[inset_0_0_4px_rgba(251,191,36,0.3)]' : 'bg-slate-400 dark:bg-slate-500'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${theme === 'dark' ? 'translate-x-6 scale-105' : theme === 'light' ? 'translate-x-0 scale-100' : 'translate-x-3 scale-100'}`}>
              {theme === 'dark' ? <Moon size={10} className="absolute inset-0 m-auto text-brand" /> : theme === 'light' ? <Sun size={10} className="absolute inset-0 m-auto text-amber-500" /> : <Monitor size={10} className="absolute inset-0 m-auto text-text-secondary" />}
            </span>
          </span>
        </button>

        <button onClick={async () => { if (pwaInstallPrompt) { try { await pwaInstallPrompt.prompt(); const { outcome } = await pwaInstallPrompt.userChoice; if (outcome === 'accepted') { showToast('Ilova muvaffaqiyatli yuklandi!', 'success'); setPwaInstallPrompt(null); setShowPwaBanner(false); return; } } catch (e) { console.debug('[PWA] Install prompt failed:', e); } setPwaInstallPrompt(null); } setPwaModalOpen(true); }} className="w-full py-3.5 px-4 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/20 dark:bg-blue-950/20 text-brand dark:text-blue-400 font-bold text-xs flex items-center justify-between cursor-pointer transition-all hover:bg-blue-100/30 shadow-sm">
          <span className="flex items-center gap-2.5">
            <Smartphone size={16} className="text-brand" />
            <span className="flex flex-col text-left">
              <span className="text-[14px] font-black tracking-wide text-brand dark:text-blue-400 uppercase">YUKLASH</span>
              <span className="text-[9px] text-brand dark:text-blue-400/80 font-bold mt-0.5">Ilovani telefonga o'rnatish (PWA)</span>
            </span>
          </span>
          <span className="text-[9px] font-black text-brand bg-blue-100 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full uppercase">PWA ILOVA</span>
        </button>
      </div>

      {masterStatus !== 'approved' && userSession?.role !== 'master' && (
        <div onClick={() => sp('modalOpen', true)} className={`p-5 rounded-2xl border text-left flex flex-col gap-3 relative cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg group ${isDarkMode ? 'bg-surface-card border-blue-900/40 hover:border-blue-800' : 'bg-gradient-to-br from-blue-50/80 to-indigo-50/30 border-blue-200/60 hover:from-blue-50 hover:to-indigo-50 shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Award size={18} className="text-white" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-text-primary">Usta bo'ling</h4>
                <p className="text-[9px] text-text-secondary font-bold mt-0.5">Rasmiy hamkor va usta profili</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-brand dark:text-blue-400 bg-blue-500/10 px-2.5 py-1.5 rounded-lg">
              <span className="text-[9px] font-black">Ariza</span>
              <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-1 text-[10px]">
            <span className="flex items-center gap-1 text-text-secondary font-bold"><CheckCircle2 size={11} className="text-emerald-500" /> 4 qadam</span>
            <span className="flex items-center gap-1 text-text-secondary font-bold"><Clock size={11} /> 3 daqiqa</span>
            <span className="flex items-center gap-1 text-text-secondary font-bold"><Shield size={11} className="text-brand" /> Bepul</span>
          </div>
        </div>
      )}

      {masterStatus === 'approved' && (
        <div className="p-5 rounded-xl border text-left flex flex-col gap-4 relative bg-surface-card border-border shadow-sm">
          <div className="flex items-center justify-between border-b pb-2 border-slate-50 dark:border-slate-800/80">
            <div className="flex items-center gap-2"><Wrench size={16} className="text-brand" /><h4 className="text-xs font-black uppercase tracking-wider text-text-primary">Usta Profili (Kabineti)</h4></div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${isPremiumActive ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-500/10 text-rose-500'}`}>{isPremiumActive ? 'Premium Faol' : "Premium To'lov Kutilmoqda"}</span>
          </div>

          {!isPremiumActive ? (
            <div className="flex flex-col gap-4 animate-fade-in">
              {activePendingPayment ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/20 flex flex-col gap-3 text-center">
                  <div className="mx-auto w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-500"><Clock size={20} /></div>
                  <div>
                    <h5 className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">To'lovingiz tekshirilmoqda</h5>
                    <p className="text-[10px] text-slate-600 dark:text-text-secondary font-bold mt-1 leading-relaxed text-left">Siz yuborgan premium to'lov arizasi admin tomonidan ko'rib chiqilmoqda.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePayPremiumSubmit} className="flex flex-col gap-3.5 text-left">
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] text-red-600 dark:text-red-400 font-bold leading-normal">
                    <h5 className="font-black uppercase tracking-wider text-[10px] text-red-500 flex items-center gap-1 mb-1"><AlertTriangle size={12} /> Premium Tarif Faollashtirilmagan</h5>
                    Sizning hamkorlik profilingiz faol holatda saqlanishi va mijozlardan bemalol buyurtmalar qabul qilishingiz uchun premium tarif to'lovini amalga oshirishingiz lozim.
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black uppercase text-text-secondary tracking-wider">1. Tarif rejasini tanlang:</span>
                    {tariffs.length === 0 ? (
                      <p className="text-[10px] font-bold text-text-secondary p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
                        Hozircha tariflar mavjud emas. Iltimos, birozdan so'ng qayta urinib ko'ring.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {tariffs.map((pkg: any) => (
                          <button key={pkg.id} type="button" onClick={() => spm('paymentPackage', pkg.id)} className={`p-2.5 rounded-xl border flex flex-col gap-0.5 items-center justify-center transition-all cursor-pointer ${paymentPackage === pkg.id ? 'border-brand bg-blue-500/5 dark:bg-blue-500/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}>
                            <span className="text-[9px] font-black uppercase text-text-secondary truncate max-w-full">{pkg.name}</span>
                            <span className={`text-[10px] font-black ${paymentPackage === pkg.id ? 'text-brand dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{(pkg.price || 0).toLocaleString()} UZS</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                    <span className="text-[9px] font-black uppercase text-text-secondary tracking-wider">2. To'lov tafsilotlari:</span>
                    <p className="text-[10px] text-slate-600 dark:text-text-secondary font-bold leading-normal mt-0.5">Tarif to'lov summasini quyidagi admin karta raqamiga o'tkazing:</p>
                    <div className="mt-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-text-secondary">Karta raqami:</span>
                        <span className="text-text-primary dark:text-white font-mono font-black tracking-wider flex items-center gap-1.5">{adminCard}<button type="button" onClick={() => { navigator.clipboard.writeText(adminCard.replace(/\s+/g, '')); showToast('Karta raqami nusxalandi!', 'info'); }} className="text-brand text-[9px] uppercase hover:underline cursor-pointer">Nusxa</button></span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-text-secondary">Karta egasi:</span>
                        <span className="text-text-primary dark:text-white font-black uppercase">{adminCardHolder}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-text-secondary tracking-wider">3. To'lov tasdig'i:</label>
                    <input type="text" value={paymentReceipt} onChange={(e) => spm('paymentReceipt', e.target.value)} className="w-full p-2.5 text-xs font-bold rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-surface-tertiary border-border" placeholder="Kvitansiya / Tranzaksiya raqami" />
                    <div className="flex items-center gap-2 mt-1">
                      <label className="flex-1 py-2 px-3 border border-dashed border-brand text-brand dark:text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 rounded-xl font-bold text-[10px] text-center cursor-pointer transition-all">
                        {paymentProofImage ? '✓ Chek rasmi yuklandi' : "➕ To'lov chekini yuklash"}
                        <input type="file" accept="image/*" onChange={handlePaymentProofUpload} className="hidden" />
                      </label>
                      {paymentProofImage && <button type="button" onClick={() => spm('paymentProofImage', '')} className="text-rose-500 hover:text-rose-600 font-black text-[9px] uppercase shrink-0 cursor-pointer">O'chirish</button>}
                    </div>
                  </div>

                  <button type="submit" disabled={submittingPayment} className="w-full mt-2 py-3 bg-brand hover:bg-brand-hover text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5">
                    {submittingPayment ? <RefreshCw size={12} className="animate-spin" /> : "To'lovni tasdiqlash uchun yuborish"}
                  </button>
                </form>
              )}
              <button type="button" onClick={() => { sp('status', 'not_applied'); showToast('Usta statusi bekor qilindi (Mijoz rejimiga qaytdingiz)', 'info'); }} className="text-[9px] font-black text-text-secondary hover:text-rose-500 transition-colors cursor-pointer text-right flex items-center gap-1.5 mt-1.5 self-end uppercase tracking-wider">
                <RefreshCw size={10} /> Sinov rejimini o'chirish
              </button>
            </div>
          ) : (
            <>
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-teal-500/10 border border-blue-500/20 text-[10px] text-slate-700 dark:text-blue-300 font-bold leading-normal flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 uppercase tracking-wider text-[10px] font-black text-blue-600 dark:text-blue-400"><Award size={12} className="shrink-0 text-blue-500" /> Premium Tarifi Faol</div>
                <p className="text-[9px] text-slate-600 dark:text-text-secondary font-bold leading-relaxed">Sizning professional hamkorlik premium balansingiz faol holatda. Qolgan muddat:</p>
                <div className="text-[11px] font-black font-mono text-brand dark:text-blue-400 mt-1 bg-white/50 dark:bg-slate-900/60 px-3 py-2.5 rounded-xl border border-blue-500/10 text-center">{premiumTimeLeft}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 flex items-center gap-4">
                <div className="relative group shrink-0">
                  <img src={partnershipAvatar} className="w-16 h-16 rounded-2xl object-cover avatar-face shadow-md border-2 border-brand bg-white dark:bg-slate-800" alt="Usta hamkor profili rasmi" />
                  <label className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center text-[10px] font-extrabold text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-center px-1">
                    Yuklash<input type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarFileChange(e, true)} />
                  </label>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h5 className="text-xs font-black text-slate-800 dark:text-white leading-tight">{partnershipName}</h5>
                    <span className="text-[10px] font-bold text-text-secondary bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md uppercase">{CATEGORIES.find((c: any) => c.id === partnershipCategory)?.name || 'Santexnik'}</span>
                  </div>
                  <p className="text-[10px] text-text-secondary font-bold font-mono mt-0.5">{partnershipPhone}</p>
                  <div className="flex flex-col gap-1 mt-2">
                    <span className="text-[9px] font-bold text-text-secondary">Rasm o'zgartirish:</span>
                    <label className="text-[9.5px] text-brand dark:text-blue-400 font-black cursor-pointer hover:underline flex items-center gap-0.5 mt-0.5"><Plus size={10} className="inline" /> Galeriyadan rasm tanlash<input type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarFileChange(e, true)} /></label>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border text-left bg-white dark:bg-[#181C20] border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-brand dark:text-blue-400 border-b pb-2 border-slate-100 dark:border-slate-800 flex items-center gap-1.5"><Award size={14} /> Profil Ma'lumotlarini Tahrirlash</h4>

                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900">
                  {([{ id: 'personal', label: 'Shaxsiy' }, { id: 'work', label: 'Kasbiy' }, { id: 'schedule', label: 'Ish tartibi' }] as const).map((tab) => (
                    <button key={tab.id} onClick={() => sp('profileEditTab', tab.id)} className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${profileEditTab === tab.id ? 'bg-white dark:bg-[#181C20] text-brand dark:text-blue-400 shadow-sm' : 'text-text-secondary'}`}>{tab.label}</button>
                  ))}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-text-secondary font-black">Faoliyat rejimi</label>
                  <button onClick={async () => { if (!myMasterProfile) return; const next = !masterIsActive; try { const updated = await api.updateMaster(myMasterProfile.id, { isActive: next }); setAllMasters((prev: any[]) => prev.map((m: any) => m.id === updated.id ? dbMasterToLegacy(updated) : m)); sp('isActive', next); sw('active', next); showToast(next ? "Siz faol rejimga o'tdingiz!" : 'Siz nofaol rejimdasiz.', 'info'); } catch (err) { showToast(err instanceof Error ? err.message : 'Xatolik yuz berdi', 'error'); } }} className={`w-full py-2.5 px-3 rounded-xl border font-bold text-[10px] flex items-center justify-between transition-all cursor-pointer ${masterIsActive ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-text-secondary'}`}>
                    <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${masterIsActive ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`} />{masterIsActive ? "Ayni vaqtda mijozlar uchun faolman" : "Nofaol (Mijozlar meni ko'ra olmaydi)"}</span>
                    <div className={`w-6 h-3.5 rounded-full p-0.5 transition-colors ${masterIsActive ? 'bg-blue-500' : 'bg-slate-300'}`}><div className={`w-2.5 h-2.5 bg-white rounded-full shadow transition-transform duration-200 transform ${masterIsActive ? 'translate-x-2.5' : 'translate-x-0'}`} /></div>
                  </button>
                </div>

                {profileEditTab === 'personal' && (
                  <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-text-secondary font-black">Ism</label>
                        <input type="text" value={partnershipFirstName} onChange={(e) => sp('firstName', e.target.value)} className="w-full text-[10px] font-black p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-surface-input border-border" placeholder="Ism" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-text-secondary font-black">Familiya</label>
                        <input type="text" value={partnershipLastName} onChange={(e) => sp('lastName', e.target.value)} className="w-full text-[10px] font-black p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-surface-input border-border" placeholder="Familiya" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-text-secondary font-black">Telefon raqami (Asosiy)</label>
                        <input type="text" value={partnershipPhone} disabled className="w-full text-[10px] font-black p-2.5 rounded-lg border outline-none opacity-60 bg-surface-tertiary border-border text-text-primary" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-text-secondary font-black">Qo'shimcha telefon</label>
                        <input type="text" value={partnershipExtraPhone} onChange={(e) => sp('extraPhone', e.target.value)} className="w-full text-[10px] font-black p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-surface-input border-border" placeholder="+998 90 987-65-43" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase tracking-wider text-text-secondary font-black">Telegram Username</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-text-secondary font-mono text-[10px]">@</span>
                        <input type="text" value={partnershipTelegram} onChange={(e) => sp('telegram', e.target.value)} className="w-full text-[10px] font-black pl-7 p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-surface-input border-border" placeholder="telegram_username" />
                      </div>
                    </div>
                  </div>
                )}

                {profileEditTab === 'work' && (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-text-secondary font-black">Kasbi</label>
                        <select value={partnershipCategory} onChange={(e) => sp('category', e.target.value)} className="w-full text-[10px] font-black p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-surface-input border-border">
                          {CATEGORIES.filter((c: any) => c.id !== 'all').map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-text-secondary font-black">Mutaxassisligi</label>
                        <input type="text" value={partnershipSpecialty} onChange={(e) => sp('specialty', e.target.value)} className="w-full text-[10px] font-black p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-surface-input border-border" placeholder="Isitish tizimlari ustasi" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-text-secondary font-black">Ish tajribasi (Yil)</label>
                        <input type="number" value={partnershipExp} onChange={(e) => sp('experience', parseInt(e.target.value) || 0)} className="w-full text-[10px] font-black p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-surface-input border-border" min="1" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-text-secondary font-black">Xizmat / Soatiga to'lov (UZS)</label>
                        <input type="number" value={partnershipPrice} onChange={(e) => sp('price', parseInt(e.target.value) || 0)} className="w-full text-[10px] font-black p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-surface-input border-border" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-text-secondary font-black">Ish viloyati</label>
                        <select value={partnershipRegion} onChange={(e) => { sp('region', e.target.value); sp('district', REGION_DATA[e.target.value]?.[0] || ''); }} className="w-full text-[10px] font-black p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-surface-input border-border">
                          {Object.keys(REGION_DATA).map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-text-secondary font-black">Ish tumani</label>
                        <select value={partnershipDistrict} onChange={(e) => sp('district', e.target.value)} className="w-full text-[10px] font-black p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-surface-input border-border">
                          {(REGION_DATA[partnershipRegion] || []).map((d: string) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {profileEditTab === 'schedule' && (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-text-secondary font-black">Ish boshlanishi</label>
                        <input type="text" value={masterWorkStart} onChange={(e) => sp('workStart', e.target.value)} placeholder="09:00" className="w-full text-[10px] font-black p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-center bg-surface-input border-border" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-text-secondary font-black">Ish tugashi</label>
                        <input type="text" value={masterWorkEnd} onChange={(e) => sp('workEnd', e.target.value)} placeholder="18:00" className="w-full text-[10px] font-black p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-center bg-surface-input border-border" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-text-secondary font-black">Dam olish kunlari</label>
                        <input type="text" value={masterRestDays} onChange={(e) => sp('restDays', e.target.value)} placeholder="Yakshanba" className="w-full text-[10px] font-black p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-center bg-surface-input border-border" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase tracking-wider text-text-secondary font-black">Xizmatlar ro'yxati</label>
                      <textarea value={partnershipServices} onChange={(e) => sp('services', e.target.value)} rows={2} placeholder="Kran almashtirish, quvurlar montaji..." className="w-full text-[10px] font-bold p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none bg-surface-input border-border" />
                      <button onClick={() => window.location.reload()} className="mt-1 py-2 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-black text-[10px] rounded-lg transition-all cursor-pointer active:scale-95">Ilovani yangilash</button>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase tracking-wider text-text-secondary font-black">Narx haqida izoh</label>
                      <input type="text" value={partnershipPriceComment} onChange={(e) => sp('priceComment', e.target.value)} placeholder="Bajariladigan ish hajmiga ko'ra kelishiladi" className="w-full text-[10px] font-bold p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-surface-input border-border" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase tracking-wider text-text-secondary font-black">Ish tavsifi (Bio)</label>
                      <textarea value={partnershipBio} onChange={(e) => sp('bio', e.target.value)} rows={2.5} placeholder="Mijozlar siz haqida bilishi uchun..." className="w-full text-[10px] font-bold p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none bg-surface-input border-border" />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 border-t pt-3 border-slate-100 dark:border-slate-800">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80">
                    <h5 className="text-[9px] uppercase tracking-wider text-rose-600 dark:text-rose-400 font-black mb-2 flex items-center gap-1"><AlertTriangle size={13} className="text-rose-500 shrink-0" /> O'zgartirib bo'lmaydigan ma'lumotlar</h5>
                    <div className="flex flex-col gap-2 text-[10px] font-bold text-text-secondary">
                      <div className="flex items-center justify-between"><span>Kompaniya nomi:</span><span className="text-slate-800 dark:text-slate-300 font-extrabold">Master Group MCHJ</span></div>
                      <div className="flex items-center justify-between"><span>Tizimdagi login (Telefon):</span><span className="text-slate-800 dark:text-slate-300 font-mono">{partnershipPhone}</span></div>
                      <div className="flex items-center justify-between"><span>Usta Hamkor ID:</span><span className="text-brand dark:text-blue-400 font-mono font-black">ID-{myMasterProfile?.id ?? '—'}</span></div>
                    </div>
                  </div>
                </div>

                <button type="button" onClick={handleSavePartnershipProfile} className="w-full mt-2 py-3 bg-brand hover:bg-brand-hover dark:bg-blue-600 dark:hover:bg-brand-hover text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer">
                  <CheckCircle2 size={13} /> O'zgarishlarni Saqlash
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <button onClick={onLogout} className="w-full mt-4 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 border-2 text-danger border-danger-border bg-danger-bg hover:bg-danger/10 hover:border-danger">
        <LogOut size={14} /> Profilni tark etish
      </button>

      <AppVersionFooter />
    </div>
  );
}
