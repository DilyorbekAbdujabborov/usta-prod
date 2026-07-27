import {
  MapPin, ChevronDown, Bell, BellOff, X, Search, Mic,
  LayoutDashboard, Smartphone, Download, ChevronRight,
  Briefcase, Award, Trophy, ChevronLeft, MessageSquare,
  HelpCircle, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES } from '../../lib/categories';
import { responsiveCategoryImgProps } from '../../lib/imgResponsive';
import { store } from '../UstaApp.store';

export default function HomeTab() {
  const {
    viewingLeaderboard, setViewingLeaderboard,
    allMasters, handleSelectMaster, isSamePhone, currentUstaPhone,
    setActiveCategory, setActiveTab, setSearchQuery,
    setBottomSheetOpen, setBottomSheetStep,
    selectedRegion, selectedDistrict,
    showNotificationsDropdown, setShowNotificationsDropdown,
    notifications, setNotifications,
    totalUnreadCount, backendUnreadCount, api,
    notificationsRef, pwaInstallPrompt, setPwaInstallPrompt,
    showPwaBanner, setShowPwaBanner, setPwaModalOpen, pwaModalOpen,
    ads, theme, cycleTheme,
    setAllCategoriesOpen, setSelectedCategoryForSheet,
    masterStatus, isPremiumActive, showToast,
    isDarkMode, chatMaster,
    setChatMaster, setSupportChatOpen, supportChatOpen,
  } = store;

  return (
    <div className="flex flex-col gap-4">
      {viewingLeaderboard ? (
        <div className="flex flex-col gap-4 p-4 animate-fade-in text-left">
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface pb-3">
            <button onClick={() => setViewingLeaderboard(false)} className="p-2 rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-90 bg-surface-tertiary text-text-primary">
              <ChevronLeft size={16} />
            </button>
            <h3 className="text-xs font-black tracking-tight uppercase text-text-primary">Ustalar Reytingi</h3>
            <div className="w-8" />
          </div>

          <div className="grid grid-cols-3 gap-2.5 items-end pt-5 pb-3 text-center bg-gradient-to-b from-blue-500/10 to-transparent rounded-xl p-4">
            {[1, 0, 2].map((pos) => {
              const master = allMasters[pos];
              const isFirst = pos === 0;
              const place = pos + 1;
              if (!master) {
                return (
                  <div key={pos} className="flex flex-col items-center gap-1">
                    <div className={`flex flex-col items-center justify-center ${isFirst ? 'h-24 opacity-60' : 'h-20 opacity-40'}`}>
                      <div className={`rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black ${isFirst ? 'w-10 h-10' : 'w-8 h-8'}`}>{place}</div>
                      <span className="text-[10px] font-bold text-text-secondary mt-1">Usta yo'q</span>
                    </div>
                  </div>
                );
              }
              return (
                <div key={master.id} className={`flex flex-col items-center gap-1 ${isFirst ? '-translate-y-2' : ''}`}>
                  <div className="relative">
                    <img loading="lazy" src={master.avatar} alt={master.name} className={`rounded-full object-cover avatar-face shadow-sm ${isFirst ? 'w-16 h-16 border-4 border-amber-400 shadow-md' : 'w-12 h-12 border-2'} ${pos === 1 ? 'border-slate-300' : pos === 2 ? 'border-amber-600' : ''}`} />
                    <span className={`absolute -bottom-1.5 -right-1.5 rounded-full flex items-center justify-center shadow border ${isFirst ? 'w-6 h-6 bg-amber-400 border-amber-300' : 'w-5 h-5 bg-slate-100 dark:bg-surface-tertiary border-slate-200 dark:border-border'}`}>
                      {isFirst ? <Trophy size={12} className="text-amber-100 fill-amber-100" /> : <Award size={11} className="text-text-secondary" />}
                    </span>
                  </div>
                  <span className={`font-black truncate w-full mt-1 ${isFirst ? 'text-xs text-brand dark:text-blue-400' : 'text-[10px]'}`}>{master.name.split(' ')[0]}</span>
                  <span onClick={(e) => { e.stopPropagation(); setActiveCategory(master.categoryId); setActiveTab('search'); setSearchQuery(''); }} className="text-[9px] text-text-secondary hover:text-brand transition-all font-extrabold uppercase bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded cursor-pointer">{master.category}</span>
                  <span className="font-black text-brand dark:text-blue-400 flex items-center justify-center gap-0.5">
                    <Briefcase size={isFirst ? 11 : 10} className="text-brand dark:text-blue-400" /> {master.completedJobs || 0} ta ish
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-black uppercase text-text-secondary tracking-widest block px-1 text-left">Ustalar reytingi</span>
            <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto no-scrollbar pb-6 text-left">
              {allMasters.map((m: any, idx: number) => (
                <div key={m.id} onClick={() => handleSelectMaster(m)} className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40 active:scale-[0.99] ${isSamePhone(m.phone, currentUstaPhone) ? 'bg-purple-50/50 border-purple-400 dark:bg-purple-950/30 dark:border-purple-800 ring-2 ring-purple-400/40' : 'bg-surface-card border-border'}`}>
                  <div className="flex items-center gap-3 text-left">
                    <span className="text-xs font-black text-text-secondary w-4">{idx + 1}</span>
                    <img loading="lazy" src={m.avatar} alt={m.name} className="w-9 h-9 rounded-xl object-cover avatar-face shadow-sm" />
                    <div className="text-left">
                      <h4 className="text-xs font-black flex items-center gap-1.5">{m.name}{isSamePhone(m.phone, currentUstaPhone) && <span className="bg-purple-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Siz</span>}</h4>
                      <span onClick={(e) => { e.stopPropagation(); setActiveCategory(m.categoryId); setActiveTab('search'); setSearchQuery(''); }} className="text-[8.5px] text-brand dark:text-blue-400 hover:underline transition-all font-extrabold uppercase cursor-pointer">{m.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-black text-brand dark:text-blue-400 flex items-center justify-end gap-0.5"><Briefcase size={11} className="text-brand dark:text-blue-400" /> {m.completedJobs || 0} ta ish</span>
                      <span className="text-[9px] text-text-secondary font-bold block">Bajarilgan</span>
                    </div>
                    <ChevronRight size={14} className="text-brand" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between gap-3 pt-2 select-none">
            <button onClick={() => { setBottomSheetStep('region'); setBottomSheetOpen(true); }} className="flex items-center gap-2.5 text-left group cursor-pointer flex-1 min-w-0">
              <div className="p-2 rounded-lg shrink-0 transition-all shadow-sm bg-slate-900 dark:bg-[var(--color-brand)] text-white"><MapPin size={15} /></div>
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase tracking-wider text-text-secondary block leading-none text-left">TANLANGAN HUDUD</span>
                <div className="flex items-center gap-1 mt-0.5 min-w-0">
                  <span className="text-[11px] font-black tracking-tight leading-none truncate text-text-primary">{selectedRegion}, {selectedDistrict}</span>
                  <ChevronDown size={10} className="text-text-secondary shrink-0" />
                </div>
              </div>
            </button>

            <div className="flex items-center gap-2 shrink-0">
              <div className="relative" ref={notificationsRef}>
                <button onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)} aria-label="Bildirishnomalar" aria-expanded={showNotificationsDropdown} className="p-2.5 rounded-xl relative transition-colors cursor-pointer bg-surface-tertiary text-text-secondary hover:bg-surface-tertiary/80">
                  <Bell size={18} />
                  {totalUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-surface-tertiary">{totalUnreadCount > 9 ? '9+' : totalUnreadCount}</span>
                  )}
                </button>
                <AnimatePresence>
                  {showNotificationsDropdown && (
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ type: 'spring', stiffness: 350, damping: 25 }} className="absolute right-0 mt-3 w-80 rounded-2xl shadow-2xl p-4 border z-50 text-left bg-surface-card border-border text-text-primary">
                      <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                        <span className="text-sm font-bold text-brand">Bildirishnomalar{totalUnreadCount > 0 && ` (${totalUnreadCount})`}</span>
                        {totalUnreadCount > 0 && <button onClick={() => { api.markAllNotificationsRead().catch(() => {}); setNotifications([]); }} className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors cursor-pointer">Tozalash</button>}
                      </div>
                      <div className="flex flex-col gap-2 max-h-80 overflow-y-auto no-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center gap-2 py-8 text-center">
                            <BellOff size={22} className="text-text-muted" />
                            <p className="text-sm text-text-muted">Yangi xabarlar yo'q</p>
                          </div>
                        ) : (
                          notifications.map((n: any) => (
                            <div key={n.id} className={`group flex items-start justify-between gap-2 text-sm border-b border-border pb-2 last:border-0 font-medium leading-snug text-left ${n.isRead === false ? 'text-text-primary' : 'text-text-muted'}`}>
                              <button onClick={() => { if (!n.isRead && api.markNotificationRead) api.markNotificationRead(n.id).catch(() => {}); if (n.target) { setActiveTab(n.target.tab); if (n.target.chatMaster) { setSupportChatOpen(false); setChatMaster(n.target.chatMaster); } else if (n.target.openSupport) { setChatMaster(null); setSupportChatOpen(true); } } setShowNotificationsDropdown(false); }} className="flex-1 text-left cursor-pointer hover:text-brand transition-colors">{n.text}</button>
                              <button onClick={(e) => { e.stopPropagation(); if (api.markNotificationRead) api.markNotificationRead(n.id).catch(() => {}); setNotifications((prev: any[]) => prev.filter((x: any) => x.id !== n.id)); }} aria-label="Bildirishnomani o'chirish" className="shrink-0 p-0.5 rounded text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"><X size={13} /></button>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div>
            <div onClick={() => setActiveTab('search')} className={`flex items-center gap-2.5 rounded-xl px-4 py-3.5 shadow-sm border transition-all cursor-pointer ${isDarkMode ? 'bg-surface-input border-border text-text-primary' : 'bg-surface-card border-border'}`}>
              <Search size={18} className="text-brand" />
              <span className="text-sm text-text-secondary font-bold flex-1 text-left">Kasb yoki xizmatni kiriting...</span>
              <Mic size={16} className="text-text-secondary" />
            </div>
          </div>

          {masterStatus === 'approved' && isPremiumActive && (
            <div className="bg-gradient-to-r from-blue-700 to-indigo-900 p-4 rounded-xl border border-blue-500/30 text-white shadow-md text-left relative overflow-hidden animate-fade-in">
              <div className="absolute right-0 bottom-0 opacity-10 select-none pointer-events-none translate-x-4 translate-y-4"><LayoutDashboard size={72} className="text-blue-200" /></div>
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2"><LayoutDashboard size={14} className="text-blue-300" /><span className="text-[9px] font-black uppercase tracking-wider text-blue-200">Shaxsiy Ish Stoli faol!</span></div>
                <span className="bg-blue-800 text-blue-200 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Usta Cabinet</span>
              </div>
              <div className="flex items-center justify-between gap-4 z-10 mt-2">
                <p className="text-[9.5px] text-blue-100 font-medium leading-tight">Ish soatlari, dam olish kunlari va profilingizni boshqarish uchun o'ting.</p>
                <button onClick={() => { setActiveTab('workspace'); showToast("Shaxsiy ish stolingizga o'tdingiz!", 'info'); }} className="px-3 py-1.5 bg-white text-blue-950 font-black text-[9px] rounded-lg shadow hover:bg-blue-50 transition-all shrink-0 cursor-pointer flex items-center gap-1.5">Ish stoliga o'tish <ChevronRight size={10} /></button>
              </div>
            </div>
          )}

          {showPwaBanner && (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-800 p-4 pb-5 rounded-xl border border-blue-500/30 text-white shadow-md text-left relative overflow-hidden animate-fade-in">
              <button onClick={(e) => { e.stopPropagation(); setShowPwaBanner(false); sessionStorage.setItem('Usta_pwa_banner_closed', 'true'); }} className="absolute top-2.5 right-2.5 text-white/75 hover:text-white cursor-pointer"><X size={12} /></button>
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2"><Smartphone size={12} className="text-blue-200" /><span className="text-[9px] font-black uppercase tracking-wider text-blue-100">Mobil va Kompyuterlar uchun</span></div>
              </div>
              <div className="flex items-center justify-between gap-4 z-10 mt-2">
                <div>
                  <h4 className="text-[11px] font-black leading-tight text-white">Master Group ilovasini yuklash</h4>
                  <p className="text-[9px] text-blue-100 font-medium leading-tight mt-0.5">Ilovani yuklab oling va istalgan vaqtda tezda foydalaning!</p>
                </div>
                <button onClick={async () => { if (pwaInstallPrompt) { try { await pwaInstallPrompt.prompt(); const { outcome } = await pwaInstallPrompt.userChoice; if (outcome === 'accepted') { showToast('Ilova muvaffaqiyatli yuklandi!', 'success'); setPwaInstallPrompt(null); setShowPwaBanner(false); return; } } catch (e) { console.debug('[PWA] Install prompt failed:', e); } setPwaInstallPrompt(null); } setPwaModalOpen(true); }} className="px-3 py-2 bg-white text-brand font-black text-[10px] rounded-lg shadow hover:bg-blue-50 transition-all shrink-0 cursor-pointer flex items-center gap-1.5"><Download size={11} /> Yuklash</button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5 mt-0.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black tracking-wider uppercase text-text-primary">Toifalar</h3>
              <button onClick={() => { setAllCategoriesOpen(true); setSelectedCategoryForSheet(null); showToast("Barcha toifalar ro'yxati", 'info'); }} className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Barchasi</button>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {CATEGORIES.filter((c: any) => c.id !== 'all').slice(0, 3).map((category: any) => {
                const IconComp = category.icon;
                const catImg = localStorage.getItem(`Usta_category_image_${category.id}`) || category.image;
                const cacheVer = localStorage.getItem('Usta_cache_version') || '0';
                const catImgSrc = catImg && !catImg.startsWith('data:') ? catImg + '?v=' + cacheVer : catImg;
                const catResp = catImg && !catImg.startsWith('data:') ? responsiveCategoryImgProps(catImg) : { src: catImg, srcSet: undefined };
                return (
                  <button key={category.id} onClick={() => { setActiveCategory(category.id); setActiveTab('search'); setSearchQuery(''); }} className="flex flex-col items-center gap-1.5 cursor-pointer transition-transform active:scale-95 rounded-xl border animate-fade-in shadow-sm overflow-hidden bg-surface-card border-border text-text-primary">
                    <div className="w-full aspect-square shrink-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                      {catImg ? (
                        <img loading="lazy" src={catResp.src} srcSet={catResp.srcSet} sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 25vw" className="w-full h-full object-cover" alt={category.name} referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-brand/10 text-brand"><IconComp size={22} /></div>
                      )}
                    </div>
                    <span className="text-[10px] font-black tracking-tight truncate w-full px-1.5 pb-2">{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {ads.length > 0 && (
            <div className="flex flex-col gap-2 animate-fade-in text-left">
              <h3 className="text-[10px] font-black tracking-wider uppercase text-text-primary">Aksiyalar</h3>
              <div className="flex overflow-x-auto no-scrollbar gap-3 pb-1 -mx-0.5 px-0.5">
                {ads.map((ad: any) => (
                  <div key={ad.id} className={`min-w-[240px] w-[240px] shrink-0 rounded-2xl p-4 text-white relative overflow-hidden bg-gradient-to-r ${ad.bgGradient}`}>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">{ad.discount}</span>
                    <h4 className="text-xs font-black mt-2 leading-tight">{ad.title}</h4>
                    <span className="text-[10px] font-mono font-bold mt-2.5 block bg-white/10 px-2 py-1 rounded w-max">Promo-kod: {ad.code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {allMasters.length > 0 && (
            <div className="flex flex-col gap-2 animate-fade-in text-left">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black tracking-wider uppercase text-text-primary">Eng yuqori reytingli ustalar</h3>
                <button onClick={() => { setViewingLeaderboard(true); showToast('Reyting ochildi!', 'success'); }} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-0.5">Barchasi <ChevronRight size={12} /></button>
              </div>
              <div className="flex overflow-x-auto no-scrollbar gap-3 pb-1">
                {allMasters.slice(0, 3).map((master: any) => (
                  <div key={master.id} onClick={() => handleSelectMaster(master)} className={`min-w-[140px] w-[140px] rounded-2xl p-2.5 border shrink-0 transition-all duration-200 cursor-pointer flex flex-col gap-1.5 hover:shadow-sm ${isSamePhone(master.phone, currentUstaPhone) ? 'bg-purple-50/50 border-purple-400 dark:bg-purple-950/30 dark:border-purple-800 ring-2 ring-purple-400/40' : 'bg-surface-card border-border'}`}>
                    <div className="w-full h-24 rounded-xl overflow-hidden relative">
                      <img loading="lazy" src={master.avatar} alt={master.name} className="w-full h-full object-cover avatar-face" />
                      {master.isOnline && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500 ring-1 ring-white" />}
                    </div>
                    <div className="text-left flex-1 min-h-0">
                      <h4 className="text-[10px] font-black flex items-center justify-between gap-1 text-text-primary">
                        <span className="truncate">{master.name}</span>
                        {isSamePhone(master.phone, currentUstaPhone) && <span className="bg-purple-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase shrink-0">Siz</span>}
                      </h4>
                      <span onClick={(e) => { e.stopPropagation(); setActiveCategory(master.categoryId); setActiveTab('search'); setSearchQuery(''); }} className="text-[10px] text-brand dark:text-blue-400 hover:underline font-bold block mt-0.5 uppercase cursor-pointer">{master.category}</span>
                    </div>
                    <div className="text-left flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-1.5 mt-0.5">
                      <div className="flex items-center gap-0.5 text-[9px] font-bold text-brand dark:text-blue-400"><Briefcase size={9} /><span>{master.completedJobs || 0} ta ish</span></div>
                      <span className="text-[9px] font-extrabold text-brand">{master.startPrice.toLocaleString()} UZS</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
