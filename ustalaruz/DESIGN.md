---
name: Usta
description: Uzbek home-services marketplace connecting clients with verified masters
colors:
  brand: "#1d4ed8"
  brand-hover: "#1e40af"
  brand-light: "#dbeafe"
  brand-master: "#0d9488"
  brand-master-hover: "#0f766e"
  brand-master-light: "#99f6e4"
  surface: "#ffffff"
  surface-secondary: "#f8fafc"
  surface-tertiary: "#f1f5f9"
  surface-card: "#ffffff"
  surface-input: "#ffffff"
  text-primary: "#0f172a"
  text-secondary: "#64748b"
  text-muted: "#94a3b8"
  text-inverse: "#ffffff"
  border: "#e2e8f0"
  border-secondary: "#cbd5e1"
  danger: "#ef4444"
  danger-hover: "#dc2626"
  danger-bg: "#fef2f2"
  danger-border: "#fecaca"
  amber-pending: "#f59e0b"
typography:
  body:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontWeight: 700
  label:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontWeight: 900
    letterSpacing: "0.05em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, monospace"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.brand-hover}"
  bubble-outgoing:
    backgroundColor: "{colors.brand-light}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
  bubble-incoming:
    backgroundColor: "{colors.surface-tertiary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
---

# Design System: Usta

## 1. Overview

**Creative North Star: "The Trusted Workbench"**

Usta is where two people - a client and a verified tradesperson - coordinate real work over real money. The interface earns trust the way a well-organized workshop does: nothing decorative, everything legible, every status (paid, pending, verified, unread) visible at a glance without hunting. Density is high by default (the app's list rows and labels run 9-11px, font-weight 900) but never at the cost of the content the user actually came to read.

The system explicitly rejects generic consumer-messenger chrome: no playful bubble tails, no reaction rails, no social-app decoration. It rejects gradient text, glass panels as default surface treatment, and soft ambient card shadows on functional UI (those effects exist only on the marketing hero, never inside `/app`). Role is structural, not cosmetic: masters operate under a teal accent, clients under brand blue, set once at the shell level and inherited everywhere - a component that hardcodes blue where it should read `--color-brand` breaks role-awareness.

**Key Characteristics:**
- Dense, high-weight micro-typography for chrome (nav, labels, meta) contrasted against a slightly larger, calmer type size for actual message/conversation content.
- Flat by default; shadows are rare, shallow, and reserved for genuinely floating elements (modals, overlays), never bolted onto card rest-states.
- One accent color per role (blue for clients, teal for masters), used sparingly - never as the dominant surface color.
- Status is always color + text + icon together, never color alone (accessibility, and because status here has financial weight).

## 2. Colors

Two accent families gated by role, layered onto a strictly neutral slate-based UI; the accent is rare and always meaningful (an action, a state, "this is mine").

### Primary
- **Usta Blue** (`#1d4ed8`, hover `#1e40af`): the client-role accent. Primary buttons, active nav state, outgoing message bubbles in client mode, links.
- **Verified Teal** (`#0d9488`, hover `#0f766e`): the master-role accent, swapped in for the entire `--color-brand` token set the moment a user is in master mode. Signals "you're on the professional side" at a glance - never mixed with blue on the same screen.

### Neutral
- **Slate Ink** (`#0f172a` / dark `#f1f5f9`): primary text.
- **Slate Quiet** (`#64748b` / dark `#94a3b8`): secondary text - timestamps, meta, placeholders.
- **Slate Faint** (`#94a3b8` / dark `#64748b`): muted/disabled text.
- **Paper** (`#ffffff` / dark `#12161a`): base surface.
- **Paper Recessed** (`#f8fafc`, `#f1f5f9` / dark `#181c20`, `#1e2328`): secondary/tertiary surfaces - input fields, incoming bubbles, hover states.
- **Hairline** (`#e2e8f0` / dark `#1e293b`): dividers and borders. Always 1px, never decorative weight.

### Named Rules
**The One Accent Rule.** Exactly one accent color is visible on screen at a time, determined by role. A client never sees teal; a master never sees blue as the primary accent.

**The Status-Never-Alone Rule.** Payment/message status (sent, pending, failed, unread) is always color + icon + label together. Color alone is decorative here, not information.

## 3. Typography

**Body Font:** Plus Jakarta Sans (with ui-sans-serif, system-ui fallback)
**Label/Mono Font:** JetBrains Mono (with ui-monospace fallback) - used only for numeric/technical values (amounts, phone numbers, IDs), never for prose.

**Character:** A single geometric-humanist sans carries both chrome and content; weight (700-900) does the work of hierarchy instead of a second family. Mono is a deliberate accent for anything transactional - it signals "this number is exact and matters."

### Hierarchy
- **Title** (900 weight, 14-16px): screen/panel headers, partner name in chat header.
- **Body** (700 weight, 13-14px): message content - deliberately a step larger than the app's default chrome text, because reading conversation content correctly is the primary task of this surface.
- **Label** (900 weight, 9-10px, 0.05em tracking, uppercase where used): nav items, section headers, meta chrome. The app's dense default.
- **Meta** (600-700 weight, 9-10px): timestamps, status text, sender labels.

### Named Rules
**The Content-Gets-Air Rule.** Chrome (nav, labels, buttons) stays at the app's native dense 9-11px scale. Anything the user is meant to actually *read* as content - a chat message, a ticket reply - steps up to 13-14px. Density is a chrome property, not a content property.

## 4. Elevation

Flat by default - depth comes from surface-color layering (surface → surface-secondary → surface-tertiary), not shadows. Shadows are reserved for elements that are genuinely floating above the page: modals, overlays, the floating action nav. A resting card, bubble, or list row never carries a shadow.

### Shadow Vocabulary
- **Overlay** (`shadow-lg`, dark-mode `--tw-shadow-color: rgba(0,0,0,0.32)`): the chat overlay panel itself when presented as a floating surface above the app shell.
- **Ambient ring** (`shadow-sm`, dark-mode `rgba(0,0,0,0.45)`): small floating chrome (avatars-with-status-dot, floating send button on mobile).

### Named Rules
**The Flat-Rest Rule.** Nothing at rest carries a shadow. If it's not actively floating above another layer, depth comes from a background-color step, not `box-shadow`.

## 5. Components

### Buttons
- **Shape:** 12px radius (`rounded-md` token), never full-pill except icon-only circular buttons.
- **Primary:** solid `--color-brand`, white text, 10px/16px padding, 900 weight label.
- **Hover / Focus:** background steps to `--color-brand-hover`; focus-visible gets the global 2px brand outline ring (already defined in index.css) - never a custom focus treatment per component.
- **Ghost / Icon:** transparent background, `surface-tertiary` on hover, no border.

### Message Bubbles (signature component)
- **Shape:** 16px radius on three corners, the sender-side corner (top-right for outgoing, top-left for incoming) squared to 4px - a directional notch instead of a decorative tail, so sender is legible even at a glance without checking alignment.
- **Outgoing (mine):** `--color-brand-light` background (role-aware: blue-tint for clients, teal-tint for masters via the same token), `text-primary` text, right-aligned.
- **Incoming (theirs):** `surface-tertiary` background, `text-primary` text, left-aligned.
- **Pending:** outgoing bubble at 70% opacity with a small pulsing clock glyph instead of the sent checkmark - never a spinner overlay that hides the message text (users need to read what they just sent while it's in flight).
- **Status glyph:** single check = sent, double check in brand color = read. No delivery/typing indicators beyond this - the app doesn't have real-time presence and shouldn't fake it.

### Inputs / Fields
- **Style:** `surface-input` background, 1px `border`, 12px radius.
- **Focus:** border shifts to `--color-brand`, no glow/ring beyond the global focus-visible outline.
- **Chat composer specifically:** pill-shaped (`rounded-full`) to visually distinguish "compose" from every other form field in the app - the one deliberate departure from the 12px default, earned because it's the most-used input in the product.

### Navigation
- Bottom tab bar (mobile) / sidebar (desktop): active item takes the role accent color + 900-weight label; inactive items sit at `text-secondary`. No pill/background highlight on active state beyond the accent color itself - keeps the nav visually quiet.

## 6. Do's and Don'ts

### Do:
- **Do** use exactly one accent color per screen, chosen by role (blue for client mode, teal for master mode).
- **Do** keep chat message content at 13-14px even though the rest of the app's chrome runs 9-11px - content legibility outranks density here.
- **Do** show pending/sent/read status as color + icon + label together.
- **Do** keep bubbles flat (no shadow) - depth comes from the brand-light/surface-tertiary color step, not elevation.
- **Do** use the directional squared-corner notch to indicate sender, not a speech-bubble tail.

### Don't:
- **Don't** build anything that reads as a WhatsApp/Telegram/Instagram-DM clone - no playful tail bubbles, no reaction emoji rails, no "social" chrome. This is a work-coordination tool, not a social app.
- **Don't** use `border-left`/`border-right` colored stripes as a status indicator.
- **Don't** apply `box-shadow` to any bubble, card, or row at rest - shadows are reserved for genuinely floating overlays only.
- **Don't** mix role accent colors on one screen (no teal-and-blue together).
- **Don't** use a spinner that covers message text for the pending state - the user needs to keep reading what they sent.
- **Don't** drop below 4.5:1 text contrast anywhere, including placeholder and meta/timestamp text.
