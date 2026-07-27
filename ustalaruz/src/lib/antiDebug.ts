// F12/DevTools can't be truly blocked from JS - a determined user can always
// get around this. It's a deterrent for casual users, toggled from Django
// admin (SiteSettings.disable_devtools) so it can be switched off instantly
// without a redeploy if it ever misfires.

const OVERLAY_ID = 'usta-devtools-overlay';
const SIZE_THRESHOLD = 160; // px gap that flags a docked DevTools panel
const MOBILE_BREAKPOINT = 768; // skip the size heuristic - mobile keyboards trigger false positives

let active = false;

function blockShortcut(e: KeyboardEvent) {
  const key = e.key.toLowerCase();
  const blockedCombo =
    key === 'f12' ||
    (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(key)) ||
    (e.metaKey && e.altKey && ['i', 'j', 'c'].includes(key)) || // Safari/Mac
    (e.ctrlKey && key === 'u');
  if (blockedCombo) {
    e.preventDefault();
    e.stopPropagation();
  }
}

function blockContextMenu(e: MouseEvent) {
  e.preventDefault();
}

function ensureOverlay(): HTMLDivElement {
  let el = document.getElementById(OVERLAY_ID) as HTMLDivElement | null;
  if (el) return el;
  el = document.createElement('div');
  el.id = OVERLAY_ID;
  el.style.cssText = `
    position: fixed; inset: 0; z-index: 2147483647;
    display: none; align-items: center; justify-content: center;
    background: #0f172a; color: #fff; text-align: center;
    font-family: system-ui, sans-serif; padding: 24px;
  `;
  el.innerHTML = `<div><div style="font-size:20px;font-weight:700;margin-bottom:8px;">Developer tools o'chirilgan</div><div style="font-size:13px;opacity:.75;">Davom etish uchun DevTools panelini yoping.</div></div>`;
  document.body.appendChild(el);
  return el;
}

function checkDevtoolsSize() {
  if (window.innerWidth < MOBILE_BREAKPOINT) return;
  const widthGap = window.outerWidth - window.innerWidth;
  const heightGap = window.outerHeight - window.innerHeight;
  const open = widthGap > SIZE_THRESHOLD || heightGap > SIZE_THRESHOLD;
  ensureOverlay().style.display = open ? 'flex' : 'none';
}

export function activateAntiDebug(): () => void {
  if (active || typeof window === 'undefined') return () => {};
  active = true;

  document.addEventListener('keydown', blockShortcut, true);
  document.addEventListener('contextmenu', blockContextMenu);

  console.log(
    '%cTo\'xtang!',
    'color:#ef4444;font-size:32px;font-weight:bold;'
  );
  console.log(
    "%cBu brauzer konsoli - bu yerga kod joylashtirish hisobingizni buzishga yordam beruvchi firibgarlar tomonidan so'ralishi mumkin. Kim bo'lishidan qat'i nazar, bu yerga hech qanday kod qo'ymang.",
    'font-size:14px;'
  );

  const intervalId = window.setInterval(checkDevtoolsSize, 1000);
  checkDevtoolsSize();

  return () => {
    active = false;
    document.removeEventListener('keydown', blockShortcut, true);
    document.removeEventListener('contextmenu', blockContextMenu);
    window.clearInterval(intervalId);
    document.getElementById(OVERLAY_ID)?.remove();
  };
}
