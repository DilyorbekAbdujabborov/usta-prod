import { MessageSquare, HelpCircle, Trash2, ImageIcon } from 'lucide-react';
import { CATEGORIES } from '../../lib/categories';
import { store } from '../UstaApp.store';
import { PRESET_USTA_AVATARS } from '../UstaApp';

// Time-only is fine for today's messages; anything older needs a date or it
// reads as ambiguous ("14:32" - today? yesterday? last week?).
function formatListTime(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
}

export default function MessagesTab() {
  const {
    conversations, deletedChats, setDeletedChats,
    setSupportChatOpen, setChatMaster, showToast, confirmToast,
    isMasterChatMode, myTicket,
  } = store;

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="sticky top-0 z-20 pb-2 border-b flex justify-between items-center bg-surface border-border">
        <h3 className="text-sm font-black flex items-center gap-1.5 text-text-primary">
          <MessageSquare size={16} className="text-brand" />
          Xabarlar va Suhbatlar
        </h3>
      </div>

      {/* DOIMIY QO'LLAB-QUVVATLASH CHATI */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          setChatMaster(null);
          setSupportChatOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          setChatMaster(null);
          setSupportChatOpen(true);
        }}
        className="p-3.5 rounded-2xl border border-border bg-surface-card flex items-center gap-3 cursor-pointer transition-colors hover:bg-surface-tertiary text-left"
      >
        <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center shrink-0">
          <HelpCircle size={20} className="text-white" />
        </div>
        <div className="text-left flex-1 min-w-0">
          <h4 className="text-xs font-black text-text-primary">
            Master Group Qo'llab-quvvatlash
          </h4>
          <p className="text-[10px] text-text-secondary font-bold mt-1 line-clamp-1">
            {myTicket?.messages.length
              ? myTicket.messages[myTicket.messages.length - 1].text
              : "Savolingiz bo'lsa, shu yerga yozing"}
          </p>
        </div>
      </div>

      {/* SUHBATDOSHLAR RO'YXATI */}
      <div className="flex flex-col gap-2 text-left">
        {(() => {
          const lastActivity = (c: any) => {
            const last = c.messages[c.messages.length - 1];
            return last ? new Date(last.time).getTime() : 0;
          };
          // Newest thread first - the API returns conversations in creation
          // order, which pushed the chat someone just replied in further down
          // the list the longer the account had been used.
          const visibleConversations = conversations
            .filter(
              (c: any) =>
                c.viewerRole === (isMasterChatMode ? 'master' : 'client') &&
                !deletedChats.includes(c.partner.id)
            )
            .slice()
            .sort((a: any, b: any) => lastActivity(b) - lastActivity(a));

          if (visibleConversations.length === 0) {
            return (
              <div className="text-center py-12 px-4 bg-surface-card border border-border rounded-2xl">
                <MessageSquare className="mx-auto text-text-muted mb-2" size={32} />
                <h4 className="text-xs font-black text-text-primary">
                  Suhbatlar mavjud emas
                </h4>
                <p className="text-[10px] text-text-secondary mt-1 font-bold">
                  {isMasterChatMode
                    ? "Hozircha sizga buyurtmachilar yozmagan."
                    : "Ustalarni qidirib, ular bilan suhbat boshlang."}
                </p>
              </div>
            );
          }

          return visibleConversations.map(
            ({ partner, messages, unreadCount }: any) => {
              const lastMsgObj = messages[messages.length - 1];
              const isLastImage = lastMsgObj?.text?.startsWith('🖼 ');
              const lastText = !lastMsgObj
                ? 'Xabarlar mavjud emas'
                : isLastImage
                  ? null
                  : lastMsgObj.text;
              const lastTime = lastMsgObj ? formatListTime(new Date(lastMsgObj.time)) : '';
              const categoryName = partner.categoryId
                ? CATEGORIES.find((c: any) => c.id === partner.categoryId)?.name
                : undefined;

              const openConversation = () => {
                setSupportChatOpen(false);
                setChatMaster({
                  id: partner.id,
                  name: partner.name,
                  avatar: partner.avatar || PRESET_USTA_AVATARS[0],
                  phone: partner.phone,
                });
              };

              return (
                <div
                  key={partner.id}
                  role="button"
                  tabIndex={0}
                  onClick={openConversation}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return;
                    e.preventDefault();
                    openConversation();
                  }}
                  className="p-3.5 rounded-2xl border border-border bg-surface-card flex items-center justify-between cursor-pointer transition-colors hover:bg-surface-tertiary text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      loading="lazy"
                      src={partner.avatar || PRESET_USTA_AVATARS[0]}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover avatar-face shrink-0"
                    />
                    <div className="text-left min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black text-text-primary truncate">{partner.name}</h4>
                        {categoryName && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-tertiary text-text-secondary font-extrabold shrink-0">
                            {categoryName}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-text-secondary font-bold mt-1 line-clamp-1 flex items-center gap-1">
                        {isLastImage && <ImageIcon size={10} className="shrink-0" />}
                        {isLastImage ? 'Rasm' : lastText}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[10px] text-text-secondary font-black">{lastTime}</span>
                    <div className="flex items-center gap-1.5">
                      {unreadCount > 0 && (
                        // min-w + padding, not a fixed 16px box: a two-digit
                        // count overflowed the circle.
                        <span className="min-w-[18px] h-[18px] px-1 bg-danger text-white text-[10px] font-black rounded-full flex items-center justify-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const ok = await confirmToast("Ushbu suhbatni o'chirmoqchimisiz? (Faqat siz uchun o'chiriladi)");
                          if (!ok) return;
                          setDeletedChats((prev: any) => [...prev, partner.id]);
                          showToast("Suhbat o'chirildi.", 'info');
                        }}
                        aria-label="Suhbatni o'chirish"
                        title="Suhbatni o'chirish"
                        className="p-1.5 rounded-lg text-danger hover:bg-danger-bg transition-colors cursor-pointer flex items-center justify-center"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
          );
        })()}
      </div>
    </div>
  );
}
