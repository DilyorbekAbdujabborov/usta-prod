import {
  Briefcase, TrendingUp, Phone, Trash2, CheckCircle2,
  Clock, MapPin, UserCheck, User, UserCircle, Star, X
} from 'lucide-react';
import { CATEGORIES } from '../../lib/categories';
import { store } from '../UstaApp.store';

export default function OrdersTab() {
const {
    masterStatus, orders, masterOrders,
    ordersTab, setOrdersTab, clientOrderFilter, setClientOrderFilter,
    setActiveTab, masterMonthlyEarnings,
    handleAcceptMasterOrder, handlePostponeMasterOrder,
    handleDeclineMasterOrder, handleCompleteMasterOrder,
    handleDeleteMasterOrder, handleDeleteUserOrder,
    handleOpenRatingModal,
    showToast, isDarkMode,
    setViewingMaster, viewingMaster,
    setViewingOrder,
  } = store;

  return (
    <div className="p-4 flex flex-col gap-4">
      {masterStatus === 'approved' ? (
        <>
          <div className="sticky top-0 z-20 flex items-center justify-center gap-6 border-b pb-2 bg-surface border-border/60">
            <button
              onClick={() => setOrdersTab('received')}
              className={`pb-1 text-xs font-bold transition-all relative cursor-pointer ${ordersTab === 'received' ? 'text-brand dark:text-blue-400' : 'text-text-secondary hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <span>Kelgan ({masterOrders.length})</span>
              {ordersTab === 'received' && (
                <span className="absolute bottom-[-9px] left-0 right-0 h-[2px] bg-brand dark:bg-blue-400 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setOrdersTab('analytics')}
              className={`pb-1 text-xs font-bold transition-all relative cursor-pointer ${ordersTab === 'analytics' ? 'text-brand dark:text-blue-400' : 'text-text-secondary hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <span>Analitika</span>
              {ordersTab === 'analytics' && (
                <span className="absolute bottom-[-9px] left-0 right-0 h-[2px] bg-brand dark:bg-blue-400 rounded-full" />
              )}
            </button>
          </div>

          {ordersTab === 'analytics' && (
            <div className="p-4 rounded-xl border text-left bg-surface-input border-border shadow-sm text-text-primary">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-brand" />
                  Oylik Daromad Analitikasi
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black font-mono text-text-primary">{masterMonthlyEarnings.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-text-secondary">UZS</span>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-text-secondary font-bold mb-1">
                  <span>Oylik maqsad: 5 000 000 UZS</span>
                  <span>{Math.round(Math.min(100, (masterMonthlyEarnings / 5000000) * 100))}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (masterMonthlyEarnings / 5000000) * 100)}%` }} />
                </div>
              </div>
            </div>
          )}

          {ordersTab === 'received' &&
            (() => {
              // masterOrders is already scoped server-side to this master's own
              // assigned orders + unclaimed ones (orders/views.py orders_view) -
              // re-filtering by myMasterProfile?.id here used to drop a master's
              // own accepted orders whenever they were toggled offline, since
              // myMasterProfile comes from the public masters list which the
              // backend restricts to is_active=True masters only.
              const visibleMasterOrders = masterOrders.filter((o: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === o.id) === i);
              return (
                <div className="flex flex-col gap-2.5 text-left">
                  <div className="flex justify-between items-center border-b pb-1.5 border-slate-100 dark:border-slate-800">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                      <Briefcase size={12} className="text-brand" />
                      Kelgan buyurtmalar ({visibleMasterOrders.length})
                    </h5>
                    <span className="text-[10px] bg-brand/10 text-brand px-1.5 py-0.5 rounded-md font-bold">Yangi buyurtmalar</span>
                  </div>

                  {visibleMasterOrders.length === 0 ? (
                    <div className="text-center py-12 px-4 border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                      <p className="text-[10px] text-text-secondary font-bold">Hozircha yangi buyurtmalar kelmadi.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {visibleMasterOrders.map((order: any) => (
                        <div 
                          key={order.id} 
                          onClick={() => {
                            setViewingOrder(order);
                          }}
                          className="p-3.5 rounded-2xl border flex flex-col gap-2 transition-all bg-surface-card border-border shadow-sm cursor-pointer"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="text-left">
                              <span className="text-[10px] uppercase tracking-wider font-extrabold text-brand bg-brand/5 px-1.5 py-0.5 rounded-md">Mijoz: {order.clientName}</span>
                              <h6 className="text-[11px] font-black text-slate-700 dark:text-slate-200 mt-1">{order.title}</h6>
                            </div>
                            <span className="text-[10px] font-bold font-mono text-blue-600 bg-blue-50 dark:bg-[#11221a] px-2 py-0.5 rounded-md shrink-0">{order.budget.toLocaleString()} so'm</span>
                          </div>

                          <p className="text-[9px] text-text-secondary font-bold leading-normal text-left">{order.desc}</p>

                          <div className="flex justify-between items-center border-t border-slate-200/50 dark:border-slate-800/80 pt-2 text-[10px] font-bold text-text-secondary">
                            <span className="flex items-center gap-1 font-black font-mono text-slate-950 dark:text-white text-[9px]">
                              <Phone size={10} className="text-brand" /> {order.clientPhone}
                            </span>
                            <span className="flex items-center gap-0.5">
                              {order.status === 'completed' ? (
                                <span className="text-blue-500 font-black">✓ Bajarildi</span>
                              ) : order.status === 'active' ? (
                                <span className="text-emerald-500 font-black">✓ Qabul qilindi</span>
                              ) : order.status === 'postponed' ? (
                                <span className="text-indigo-500 font-black">⏳ Kechiktirildi</span>
                              ) : order.status === 'cancelled' ? (
                                <span className="text-rose-500 font-black">❌ Rad etildi</span>
                              ) : (
                                <span className="text-amber-500 font-black">● Kutilmoqda</span>
                              )}
                            </span>
                          </div>

                          <div className="flex gap-1.5 border-t border-slate-200/40 dark:border-slate-800/80 pt-2.5 mt-0.5 justify-end flex-wrap">
                            {order.status === 'pending' && (
                              <>
                                <button onClick={(e) => { e.stopPropagation(); handleAcceptMasterOrder(order.id); }} className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black flex items-center gap-0.5 transition-all cursor-pointer">
                                  <CheckCircle2 size={10} /> Qabul qilish
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handlePostponeMasterOrder(order.id); }} className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black flex items-center gap-0.5 transition-all cursor-pointer">
                                  <Clock size={10} /> Kechiktirish
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeclineMasterOrder(order.id); }} className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-black flex items-center gap-0.5 transition-all cursor-pointer">
                                  <Trash2 size={10} /> Rad etish
                                </button>
                              </>
                            )}
                            {order.status === 'active' && (
                              <>
                                <button onClick={(e) => { e.stopPropagation(); handleCompleteMasterOrder(order.id, order.budget); }} className="px-2.5 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-[9px] font-black flex items-center gap-1 transition-all cursor-pointer">
                                  <CheckCircle2 size={10} /> Ishni yakunlash
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeclineMasterOrder(order.id); }} className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-black flex items-center gap-0.5 transition-all cursor-pointer">
                                  <Trash2 size={10} /> Bekor qilish
                                </button>
                              </>
                            )}
                            {order.status === 'postponed' && (
                              <>
                                <button onClick={(e) => { e.stopPropagation(); handleAcceptMasterOrder(order.id); }} className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black flex items-center gap-0.5 transition-all cursor-pointer">
                                  <CheckCircle2 size={10} /> Qabul qilish
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeclineMasterOrder(order.id); }} className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-black flex items-center gap-0.5 transition-all cursor-pointer">
                                  <Trash2 size={10} /> Rad etish
                                </button>
                              </>
                            )}
                            {(order.status === 'completed' || order.status === 'cancelled') && (
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteMasterOrder(order.id); }} className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:bg-rose-400/5 dark:text-rose-400 hover:bg-rose-500/20 text-[9px] font-black flex items-center gap-0.5 transition-all cursor-pointer">
                                <Trash2 size={10} /> O'chirish
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
        </>
      ) : (
        <div className="flex flex-col gap-4 text-left">
          <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-800">
            <div className="text-left">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Briefcase size={14} className="text-brand" />
                Mening Buyurtmalarim ({orders.length})
              </h4>
              <p className="text-[9px] text-text-secondary font-bold mt-0.5">Yuborilgan buyurtmalar va ularning real vaqtdagi holati</p>
            </div>
            <span className="text-[10px] bg-brand/10 text-brand dark:bg-blue-950/45 dark:text-blue-300 px-2 py-0.5 rounded-md font-black uppercase tracking-wider">Mijoz rejimi</span>
          </div>

          {orders.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: 'Barchasi' },
                { id: 'pending', label: 'Yangi' },
                { id: 'active', label: 'Jarayonda' },
                { id: 'completed', label: 'Bajarilgan' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setClientOrderFilter(pill.id)}
                  className={`px-3.5 py-1.5 rounded-full text-[10.5px] font-black whitespace-nowrap transition-all cursor-pointer ${clientOrderFilter === pill.id ? 'bg-brand text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-text-secondary hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          )}

          {orders.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center bg-white dark:bg-[#181C20] flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-brand flex items-center justify-center"><UserCheck size={20} /></div>
              <h5 className="text-xs font-black text-slate-800 dark:text-white">Hozircha buyurtmalar yo'q</h5>
              <p className="text-[10px] text-text-secondary font-bold leading-normal max-w-xs mx-auto">Siz hali birorta usta bilan buyurtma rasmiylashtirmagansiz. Asosiy sahifadan istalgan ustani tanlab, "Buyurtmani rasmiylashtirish" tugmasini bosing!</p>
              <button onClick={() => setActiveTab('home')} className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-[10px] font-black rounded-xl transition-all cursor-pointer shadow-sm">Ustalarni qidirish</button>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {orders
                .filter((order: any) => {
                  const masterOrder = masterOrders.find((mo: any) => mo.id === order.id);
                  const currentStatus = masterOrder ? masterOrder.status : order.status;
                  if (clientOrderFilter === 'all') return true;
                  if (clientOrderFilter === 'pending') return currentStatus === 'pending';
                  if (clientOrderFilter === 'active') return currentStatus === 'active' || currentStatus === 'approved' || currentStatus === 'postponed' || currentStatus === 'delayed';
                  if (clientOrderFilter === 'completed') return currentStatus === 'completed';
                  return true;
                })
                .map((order: any) => {
                  const masterOrder = masterOrders.find((mo: any) => mo.id === order.id);
                  const currentStatus = masterOrder ? masterOrder.status : order.status;
                  const orderCategory = CATEGORIES.find((c: any) => c.name === order.category);
                  const OrderCategoryIcon = orderCategory?.icon || Briefcase;

                  return (
                    <div 
                      key={order.id} 
                      onClick={() => {
                        setViewingOrder(order);
                        const masterData = masterOrder ? {
                          id: masterOrder.masterId,
                          name: masterOrder.masterName,
                          avatar: masterOrder.masterAvatar,
                          rating: masterOrder.masterRating,
                          reviewsCount: masterOrder.masterReviewsCount,
                          isOnline: masterOrder.masterIsOnline,
                        } : null;
                        if (masterData) setViewingMaster(masterData);
                      }}
                      className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#181C20] shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all text-left flex flex-col gap-3 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${orderCategory?.color || 'bg-blue-50 text-brand'}`}>
                            <OrderCategoryIcon size={20} />
                          </div>
                          <h5 className="text-[13px] font-black text-slate-900 dark:text-white leading-snug mt-1.5 truncate">{order.title}</h5>
                        </div>

                        {masterOrder && masterOrder.masterName && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const masterData = {
                                id: masterOrder.masterId,
                                name: masterOrder.masterName,
                                avatar: masterOrder.masterAvatar,
                                rating: masterOrder.masterRating,
                                reviewsCount: masterOrder.masterReviewsCount,
                                isOnline: masterOrder.masterIsOnline,
                              };
                              setViewingMaster(masterData);
                            }}
                            className="shrink-0 px-3 py-2 bg-white dark:bg-[#181C20] border border-slate-200 dark:border-slate-700 rounded-2xl hover:shadow-md hover:border-brand/30 dark:hover:border-brand/30 transition-all cursor-pointer flex items-center gap-2.5"
                            aria-label={`Usta profili: ${masterOrder.masterName}`}
                          >
                            {masterOrder.masterAvatar && (
                              <img
                                src={masterOrder.masterAvatar}
                                alt={masterOrder.masterName}
                                className="w-9 h-9 rounded-xl object-cover avatar-face border border-slate-200 dark:border-slate-700"
                              />
                            )}
                            {!masterOrder.masterAvatar && (
                              <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center border border-brand/20">
                                <UserCircle size={18} className="text-brand" />
                              </div>
                            )}
                            <div className="flex flex-col items-start min-w-0">
                              <span className="text-[11px] font-black text-slate-900 dark:text-white truncate max-w-[140px]">
                                {masterOrder.masterName}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {masterOrder.masterRating && (
                                  <>
                                    <Star size={10} className="text-amber-500 fill-current shrink-0" />
                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                      {masterOrder.masterRating}
                                    </span>
                                  </>
                                )}
                                {masterOrder.masterReviewsCount && (
                                  <span className="text-[9px] text-text-secondary font-medium">
                                    ({masterOrder.masterReviewsCount})
                                  </span>
                                )}
                                {masterOrder.masterIsOnline && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-label="Onlayn" />
                                )}
                              </div>
                            </div>
                            <UserCircle size={16} className="text-text-tertiary shrink-0 ml-1" />
                          </button>
                        )}

                        <div className="shrink-0">
                          {currentStatus === 'pending' && (
                            <span className="px-2.5 py-1 text-[8.5px] font-black rounded-xl bg-blue-50 dark:bg-blue-950/20 text-brand dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 flex items-center gap-1 uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" /> Yangi
                            </span>
                          )}
                          {(currentStatus === 'active' || currentStatus === 'approved') && (
                            <span className="px-2.5 py-1 text-[8.5px] font-black rounded-xl bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border border-orange-200/50 dark:border-orange-900/30 flex items-center gap-1 uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" /> Jarayonda
                            </span>
                          )}
                          {(currentStatus === 'postponed' || currentStatus === 'delayed') && (
                            <span className="px-2.5 py-1 text-[8.5px] font-black rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30 flex items-center gap-1 uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" /> Kechiktirildi
                            </span>
                          )}
                          {currentStatus === 'cancelled' && (
                            <span className="px-2.5 py-1 text-[8.5px] font-black rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30 flex items-center gap-1 uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" /> Rad etildi
                            </span>
                          )}
                          {currentStatus === 'completed' && (
                            <span className="px-2.5 py-1 text-[8.5px] font-black rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 flex items-center gap-1 uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /> Bajarildi
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-end justify-between gap-3 pl-[56px] -mt-1.5">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-[10px] text-text-secondary font-bold flex items-center gap-1 truncate">
                            <MapPin size={11} className="text-text-secondary shrink-0" /> {order.district}, {order.region}
                          </span>
                          <span className="text-[9.5px] text-text-secondary font-semibold">{order.date}</span>
                        </div>
                        <span className="text-sm font-black font-mono text-slate-900 dark:text-white shrink-0">{order.budget}</span>
                      </div>

                      <div className={`p-3 rounded-2xl text-[10.5px] font-bold leading-normal text-left ${
                        currentStatus === 'pending'
                          ? 'bg-amber-500/5 border border-amber-500/10 text-amber-700 dark:text-amber-400'
                          : currentStatus === 'active' || currentStatus === 'approved'
                            ? 'bg-emerald-500/5 border border-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : currentStatus === 'postponed' || currentStatus === 'delayed'
                              ? 'bg-indigo-500/5 border border-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                              : currentStatus === 'cancelled'
                                ? 'bg-rose-500/5 border border-rose-500/10 text-rose-700 dark:text-rose-400'
                                : 'bg-blue-500/5 border border-blue-500/10 text-brand dark:text-blue-400'
                      }`}>
                        {currentStatus === 'pending'
                          ? "Usta hozirda arizani ko'rib chiqmoqda. Tez orada tasdiq kelishi kutilmoqda."
                          : currentStatus === 'active' || currentStatus === 'approved'
                            ? 'Usta buyurtmani qabul qildi! Bemalol muloqot qilishingiz mumkin.'
                            : currentStatus === 'postponed' || currentStatus === 'delayed'
                              ? "Usta hozirda boshqa buyurtma bilan band bo'lgani uchun ish vaqtini biroz uzaytirdi."
                              : currentStatus === 'cancelled'
                                ? "Usta ushbu buyurtmani rad etdi. Boshqa ustalar bilan bog'lanishni tavsiya etamiz."
                                : 'Ish muvaffaqiyatli yakunlandi va platforma reytingi yangilandi!'}
                      </div>

                      <div className="flex justify-between items-center pt-2 mt-0.5 border-t border-slate-100 dark:border-slate-800/60">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUserOrder(order.id);
                          }}
                          className="px-3.5 py-2 text-[9px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/5 dark:text-rose-400 dark:hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer flex items-center gap-1 border border-rose-150/50 dark:border-rose-900/25"
                        >
                          <Trash2 size={11} /> O'chirish
                        </button>

                        {currentStatus === 'completed' && order.masterId && (
                          order.clientRating ? (
                            <span className="px-3.5 py-2 text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-500/5 dark:text-amber-400 rounded-xl flex items-center gap-1 border border-amber-150/50 dark:border-amber-900/25">
                              <Star size={11} className="fill-current" /> Baholandi ({order.clientRating})
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenRatingModal(order);
                              }}
                              className="px-3.5 py-2 text-[9px] font-black text-white bg-brand hover:bg-brand-hover rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                              <Star size={11} /> Baho berish
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
