# Product

## Register

product

## Users

Two roles share the same app shell: **clients** posting home-service jobs and browsing masters, and **masters** (verified tradespeople - plumbers, electricians, construction workers) managing their workspace, orders, and premium subscription. Usage happens mid-task: comparing quotes, coordinating a job, confirming a payment - not idle browsing. Trust matters more than delight; money and real-world work commitments are on the line.

## Product Purpose

Usta is an Uzbek home-services marketplace connecting clients with verified masters. Chat is where the two sides actually coordinate a job after discovery: confirming scope, price, timing, and payment - not a social feature bolted onto a listing site.

## Brand Personality

**Ishonchli va samarali** (trustworthy and efficient). Professional, fast, unobtrusive - a tool for people mid-transaction, not a place to linger. The existing marketing copy already leans on verification language ("tekshirilgan ustalar" - verified masters); the product surfaces should carry that same confidence through into every screen, chat included.

## Anti-references

Do not look like a generic consumer messenger clone (WhatsApp/Telegram/Instagram DM). No playful bubble shapes, no reaction emoji rails, no "social" chrome. This is a work-coordination surface between two people transacting real money over a real job - it should read closer to a professional workbench than a social app.

## Design Principles

- **Clarity over charm.** Every screen serves the task at hand (confirm a job, review a quote, resolve a payment). Decoration that doesn't aid comprehension gets cut.
- **Role-aware, not role-generic.** The app already distinguishes master mode (teal accent) from client mode (brand blue) at the shell level; product surfaces should honor that distinction rather than flattening both roles into one look.
- **Trust is structural, not decorative.** Verification, payment status, and message provenance (who sent what, when, confirmed or pending) must always be legible at a glance - never sacrificed for visual minimalism.
- **Fast under bad conditions.** Users are often on the move, on 3G, mid-job. Optimistic UI, clear pending/sent/failed states, and no false blocking states (see the premium-paywall and pending-message bugs fixed this session) are core to the brand promise, not edge-case polish.
- **Restraint by default.** Flat, minimal shadow use; color used sparingly and semantically (brand accent, danger red, amber for pending) rather than decoratively.

## Accessibility & Inclusion

Standard WCAG AA: body text ≥4.5:1 contrast, interactive targets ≥40px on mobile, full keyboard navigation, `prefers-reduced-motion` respected (already wired globally in index.css). No additional stated requirements.
