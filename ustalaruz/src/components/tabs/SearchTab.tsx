import { useState } from 'react';
import {
  ChevronLeft, Search, User, Award, CheckCircle2,
  MapPin, Briefcase, MessageSquare, Phone, XCircle, ClipboardList,
  ChevronDown, ChevronRight, Building2, Wrench
} from 'lucide-react';
import { CATEGORIES } from '../../lib/categories';
import { store } from '../UstaApp.store';
import { PRESET_USTA_AVATARS } from '../UstaApp';

export default function SearchTab() {
  const {
    setActiveTab, setActiveCategory, setSearchQuery,
    selectedRegion, selectedDistrict,
    searchResults, searchQuery, searchLoading,
    isDarkMode, activeCategory, setViewingMaster,
    showToast, currentUstaPhone, isSamePhone,
    handleSelectMaster, handleOpenBookingModal,
    setChatMaster, setSupportChatOpen,
    setBottomSheetOpen, setBottomSheetStep, hasSelectedRegion,
    searchPage, setSearchPage, searchTotal, SEARCH_LIMIT,
    searchMode, setSearchMode, enterpriseOrders, enterpriseLoading,
  } = store;
  const totalPages = Math.ceil(searchTotal / SEARCH_LIMIT);
  const isEnterprise = searchMode === 'enterprise';
  // Listing bodies are long-form; only one is expanded at a time so the list
  // stays scannable.
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  return (
    <div className="p-4 flex flex-col gap-4 animate-fade-in text-left">
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b pb-3 bg-surface border-border">
        <button
          onClick={() => {
            setActiveTab('home');
            setActiveCategory('all');
            setSearchQuery('');
          }}
          className="p-2 rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-90 bg-surface-tertiary text-text-primary"
        >
          <ChevronLeft size={16} />
        </button>
        <h3 className="text-xs font-black tracking-tight uppercase text-text-primary">
          {isEnterprise ? 'Korxona Buyurtmalari' : 'Ustalar Qidiruvi'}
        </h3>
      </div>

      <div className="flex items-center justify-between text-[10px] text-text-secondary font-bold px-1 mt-1">
        <button
          onClick={() => { setBottomSheetStep('region'); setBottomSheetOpen(true); }}
          className="flex items-center gap-1 hover:text-brand transition-colors cursor-pointer"
        >
          <MapPin size={11} />
          {hasSelectedRegion ? `${selectedRegion}, ${selectedDistrict}` : 'Hududni tanlang'}
          <ChevronDown size={10} />
        </button>
        <span className="text-brand dark:text-blue-400">
          {isEnterprise
            ? `${enterpriseOrders.length} ta buyurtma topildi`
            : `${searchResults.length} ta usta topildi`}
        </span>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder={isEnterprise ? 'Korxona nomi yoki ish turi...' : 'Ism, kasb yoki haqida...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full rounded-lg pl-11 pr-4 py-3.5 text-sm font-bold border transition-all outline-none ${
            isDarkMode
              ? 'bg-surface-input border-border text-text-primary focus:border-blue-500/50'
              : 'bg-surface-input border-border text-text-primary focus:border-brand/50'
          }`}
        />
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map((category: any) => {
          const isSelected = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black whitespace-nowrap cursor-pointer transition-all ${
                isSelected
                  ? 'bg-brand text-white shadow-sm'
                  : isDarkMode
                    ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {category.name}
            </button>
          );
        })}
      </div>

      <div className="flex gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900/70 border border-border">
        {([
          { id: 'masters', label: 'Ustalar', icon: Wrench },
          { id: 'enterprise', label: 'Korxona buyurtmalari', icon: Building2 },
        ] as const).map((mode) => {
          const ModeIcon = mode.icon;
          const isSelected = searchMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setSearchMode(mode.id)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isSelected
                  ? 'bg-surface-card text-brand dark:text-blue-400 shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <ModeIcon size={12} /> {mode.label}
            </button>
          );
        })}
      </div>

      {isEnterprise ? (
        enterpriseLoading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-10 h-10 border-2 border-slate-200 border-t-brand rounded-full animate-spin mb-4" />
            <p className="text-xs font-bold text-text-secondary">Buyurtmalar yuklanmoqda...</p>
          </div>
        ) : enterpriseOrders.length === 0 ? (
          <div className="flex flex-col items-center py-16 px-4 animate-fade-in text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mx-auto mb-3">
              <Building2 size={24} className="text-text-secondary" />
            </div>
            <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">
              Korxona buyurtmalari topilmadi
            </h4>
            <p className="text-[10px] text-text-secondary font-bold mt-1.5 max-w-[250px] mx-auto leading-relaxed">
              Boshqa toifa yoki hududni tanlab ko'ring — qurilish korxonalari yangi buyurtmalarni muntazam joylab boradi.
            </p>
            {activeCategory !== 'all' && (
              <button
                onClick={() => setActiveCategory('all')}
                className="mt-4 px-4 py-2 rounded-xl text-[10px] font-black cursor-pointer transition-all bg-brand/10 text-brand hover:bg-brand/20 uppercase tracking-wider"
              >
                Barcha toifalar
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 pb-6">
            {enterpriseOrders.map((order: any) => {
              const isExpanded = expandedOrderId === order.id;
              const phoneHref = `tel:${String(order.phone).replace(/[^+\d]/g, '')}`;
              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border overflow-hidden shadow-sm transition-all ${
                    isDarkMode
                      ? 'bg-[#1e2329] border-slate-800 text-slate-200'
                      : 'bg-surface-card border-border text-slate-800'
                  }`}
                >
                  <div className="px-3 py-1.5 flex items-center justify-between bg-gradient-to-r from-amber-600 to-orange-700 text-white">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-50 flex items-center gap-1 truncate">
                      <Building2 size={11} className="shrink-0" />
                      <span className="truncate">{order.companyName}</span>
                    </span>
                    <span className="text-[9px] font-black uppercase text-white bg-black/20 px-1.5 py-0.5 rounded shrink-0 ml-2">
                      Korxona
                    </span>
                  </div>

                  {order.image && (
                    <img
                      loading="lazy"
                      src={order.image}
                      alt={order.title}
                      className="w-full h-40 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}

                  <div className="p-3.5 flex flex-col gap-2.5">
                    <h4 className="text-sm font-black leading-tight text-slate-800 dark:text-white">
                      {order.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {order.categoryName && (
                        <span className="text-[9px] text-brand dark:text-blue-400 font-extrabold px-1.5 py-0.5 rounded bg-brand/10 dark:bg-blue-500/20 uppercase tracking-wider">
                          {order.categoryName}
                        </span>
                      )}
                      {(order.region || order.district) && (
                        <span className="text-[9px] text-text-secondary font-bold flex items-center gap-1">
                          <MapPin size={10} className="text-brand dark:text-blue-400" />
                          {[order.region, order.district].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-[11px] font-bold leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line ${
                        isExpanded ? '' : 'line-clamp-3'
                      }`}
                    >
                      {order.description}
                    </p>

                    <button
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="self-start text-[10px] font-black text-brand dark:text-blue-400 hover:underline cursor-pointer uppercase tracking-wider"
                    >
                      {isExpanded ? 'Yopish' : 'Batafsil'}
                    </button>

                    <div className="border-t border-dashed border-slate-100 dark:border-slate-800" />

                    <div className="flex items-center justify-between gap-2">
                      <div className="bg-slate-100 dark:bg-slate-800/80 rounded-lg px-2 py-1 text-[10px] font-black font-mono text-slate-950 dark:text-white border border-slate-200/50 dark:border-slate-700 select-all">
                        {order.phone}
                      </div>
                      <a
                        href={phoneHref}
                        onClick={() => showToast(`${order.companyName} bilan bog'lanilmoqda`, 'info')}
                        className="flex-1 py-2 bg-brand hover:bg-brand-hover dark:bg-blue-600 dark:hover:bg-brand-hover text-white font-extrabold text-[10px] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Phone size={12} /> Bog'lanish
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : searchLoading ? (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-brand rounded-full animate-spin mb-4" />
          <p className="text-xs font-bold text-text-secondary">Ustalar yuklanmoqda...</p>
        </div>
      ) : searchResults.length === 0 ? (
        <div className="flex flex-col items-center py-16 px-4 animate-fade-in text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mx-auto mb-3">
            <User size={24} className="text-text-secondary" />
          </div>
          <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">
            {hasSelectedRegion ? "Bu hududda ustalar topilmadi" : "Hududni tanlang"}
          </h4>
          <p className="text-[10px] text-text-secondary font-bold mt-1.5 max-w-[250px] mx-auto leading-relaxed">
            {hasSelectedRegion ? "Boshqa hudud yoki yo'nalishni tanlab ko'ring" : "Yuqoridagi hudud tanlash tugmasini bosing va o'zingizga qulay hududni tanlang."}
          </p>

          {hasSelectedRegion && (
            <div className="flex flex-wrap justify-center gap-1.5 mt-4 max-w-xs">
              {CATEGORIES.filter((c) => c.id !== activeCategory).slice(0, 6).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="px-3 py-1.5 rounded-full text-[10px] font-black whitespace-nowrap cursor-pointer transition-all bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  {cat.name}
                </button>
              ))}
              {activeCategory !== 'all' && (
                <button
                  onClick={() => setActiveCategory('all')}
                  className="px-3 py-1.5 rounded-full text-[10px] font-black whitespace-nowrap cursor-pointer transition-all bg-brand/10 text-brand hover:bg-brand/20"
                >
                  Barcha toifalar
                </button>
              )}
            </div>
          )}

          {hasSelectedRegion && (
            <button
              onClick={() => { setBottomSheetStep('region'); setBottomSheetOpen(true); }}
              className="mt-4 px-4 py-2 rounded-xl text-[10px] font-black cursor-pointer transition-all bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 uppercase tracking-wider"
            >
              Hududni o'zgartirish
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 pb-6">
          {searchResults.map((master: any) => (
            <div
              key={master.id}
              onClick={() => {
                setViewingMaster(master);
                showToast(`${master.name} profili`, 'info');
              }}
              className={`shrink-0 rounded-2xl border cursor-pointer transition-all active:scale-[0.99] hover:shadow-md text-left overflow-hidden relative ${
                isSamePhone(master.phone, currentUstaPhone)
                  ? 'bg-purple-50/50 border-purple-400 dark:bg-purple-950/30 dark:border-purple-800 ring-2 ring-purple-400/40 text-slate-800 dark:text-slate-200 shadow-purple-500/10'
                  : isDarkMode
                    ? 'bg-[#1e2329] border-blue-900/40 hover:border-blue-800/80 text-slate-200 shadow-lg'
                    : 'bg-surface-input border-border/80 hover:border-blue-700/20 shadow-md shadow-slate-100'
              }`}
            >
              <div className={`px-3 py-1.5 flex items-center justify-between ${
                isSamePhone(master.phone, currentUstaPhone)
                  ? 'bg-gradient-to-r from-purple-700 to-indigo-850 text-white'
                  : 'bg-gradient-to-r from-brand to-blue-700 text-white'
              }`}>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-100 flex items-center gap-1">
                  <Award size={10} className="text-amber-400 fill-amber-400" />
                  {isSamePhone(master.phone, currentUstaPhone) ? 'Sizning Shaxsiy Profilingiz' : 'Rasmiy Hamkor Vizitkasi'}
                </span>
                <span className="text-[10px] font-black uppercase text-white bg-black/20 px-1.5 py-0.5 rounded">
                  ID raqami: {master.id}0{master.id}
                </span>
              </div>

              <div className="p-3.5 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0 mt-0.5">
                    <img
                      loading="lazy"
                      src={master.avatar}
                      alt={`${master.name} – Usta profili`}
                      className="w-14 h-14 rounded-xl object-cover avatar-face shadow-md border-2 border-slate-200 dark:border-slate-700"
                    />
                    {master.isActive === false ? (
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center bg-rose-500 rounded-full border border-white dark:border-[#1e2329]" title="Dam olishda" />
                    ) : master.isOnline ? (
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-duration-1000" />
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500 border border-white dark:border-[#1e2329]" />
                      </span>
                    ) : (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-slate-300 border border-white dark:border-[#1e2329]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-black truncate text-slate-800 dark:text-white leading-none flex items-center gap-1">
                        {master.name}
                        {isSamePhone(master.phone, currentUstaPhone) && (
                          <span className="bg-purple-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase shrink-0">Siz</span>
                        )}
                      </h4>
                      <span className="p-0.5 bg-blue-500 text-white rounded-full flex items-center justify-center shrink-0">
                        <CheckCircle2 size={10} fill="currentColor" />
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className="text-[9px] text-brand dark:text-blue-400 font-extrabold px-1.5 py-0.5 rounded bg-brand/10 dark:bg-blue-500/20 uppercase tracking-wider">
                        {master.category}
                      </span>
                      {master.isActive === false && (
                        <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30 uppercase tracking-wider">
                          Dam olishda
                        </span>
                      )}
                      <span className="text-[9px] text-slate-600 dark:text-text-secondary font-bold">{master.experience} yil tajriba</span>
                    </div>

                    <p className="text-[9px] text-text-secondary dark:text-text-secondary font-bold mt-2 flex items-center gap-1">
                      <MapPin size={10} className="text-brand dark:text-blue-400" />
                      {master.region}, {master.district}
                    </p>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-100 dark:border-slate-800" />

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-[10px] text-slate-600 dark:text-text-secondary font-bold">
                    <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
                      <CheckCircle2 size={11} className="fill-blue-500/10 text-blue-500" /> {master.reviewsCount || 0} sharh
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-brand dark:text-blue-400">
                      <Briefcase size={10} /> {master.completedJobs || 0} ta ish
                    </span>
                  </div>

                  <div className="bg-slate-100 dark:bg-slate-800/80 rounded-lg px-2 py-1 text-[10px] font-black font-mono text-slate-950 dark:text-white border border-slate-200/50 dark:border-slate-700 select-all">
                    {master.phone}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-1.5">
                  {isSamePhone(master.phone, currentUstaPhone) ? (
                    <button disabled className="w-full py-2 bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-extrabold text-[10px] rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed opacity-85 border border-purple-200 dark:border-purple-900">
                      <User size={12} /> O'z profilingiz
                    </button>
                  ) : master.isActive === false ? (
                    <button disabled className="w-full py-2 bg-slate-100 dark:bg-slate-900/60 text-text-secondary dark:text-slate-600 font-extrabold text-[10px] rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-200/50 dark:border-slate-800">
                      <XCircle size={12} /> Dam olishda
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenBookingModal(master); }}
                      className="w-full py-2 bg-brand hover:bg-brand-hover dark:bg-blue-600 dark:hover:bg-brand-hover text-white font-extrabold text-[10px] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <ClipboardList size={12} /> Buyurtmani rasmiylashtirish
                    </button>
                  )}

                  <div className="flex gap-2">
                    {isSamePhone(master.phone, currentUstaPhone) ? (
                      <button disabled className="flex-1 py-2 bg-slate-100 dark:bg-slate-900/60 text-text-secondary dark:text-slate-600 font-extrabold text-[10px] rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-200/50 dark:border-slate-800">
                        <MessageSquare size={11} /> O'zingizga xabar yozib bo'lmaydi
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSupportChatOpen(false);
                          setChatMaster(master);
                          setActiveTab('messages');
                          showToast(`${master.name} bilan suhbat boshlandi`, 'info');
                        }}
                        className="flex-1 py-2 bg-brand/10 hover:bg-brand/20 text-brand dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 font-black text-[10px] rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <MessageSquare size={11} /> Xabar yozish
                      </button>
                    )}

                    <a
                      href={`tel:${master.phone.replace(/\s+/g, '')}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-[10px] rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer border border-slate-200/40 dark:border-slate-700/40 shadow-sm"
                    >
                      <Phone size={11} /> Bog'lanish
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-2 pb-4">
              <button
                onClick={() => setSearchPage(Math.max(1, searchPage - 1))}
                disabled={searchPage <= 1}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 ${
                  searchPage <= 1
                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
                }`}
              >
                <ChevronLeft size={12} /> Oldingi
              </button>
              <span className="text-[10px] font-bold text-text-secondary">
                {searchPage} / {totalPages}
              </span>
              <button
                onClick={() => setSearchPage(Math.min(totalPages, searchPage + 1))}
                disabled={searchPage >= totalPages}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 ${
                  searchPage >= totalPages
                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
                }`}
              >
                Keyingi <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
