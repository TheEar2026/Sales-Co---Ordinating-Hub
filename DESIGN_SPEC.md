# The Ear Academy Sales System — UI/UX Design Specification

A screen-by-screen design brief for rebuilding the interface in Google Stitch
(or any design tool). Written to be pasted in section by section: each screen
has a **Stitch prompt** block you can use directly, followed by the exact
detail behind it.

---

## 1. What this app is

A daily working tool for a **two-person sales team** selling a music-education
platform to schools:

- **Rus** (founder) — closes deals. Works his personal pipeline of warm/active
  leads ("Motion A").
- **The Coordinator** (Badikazi) — runs high-volume cold outreach ("Motion B"),
  and hands any interested reply over to Rus.

It is a **desktop web app**, used at a laptop for focused work sessions — not a
mobile app, not a marketing site. Think "internal operations dashboard": dense,
fast, scannable, calm. It is operated, not read. Two people, all day, every day.

The whole product is **three tabs** plus a login screen and one modal editor:
**Motion A**, **Motion B**, **Scorecard**.

---

## 2. Design language

**Personality:** professional, warm, understated. A boutique operations tool,
not a SaaS product with a flashy hero. Restraint over decoration. The gold is
the brand signature — used as an accent, never wall-to-wall.

### Color tokens

| Token | Hex | Use |
|---|---|---|
| `navy` | `#1F2D3D` | Top bar background, primary text, primary buttons |
| `gold` | `#B8860B` | Primary accent, active states, T-status text |
| `gold-mid` | `#D4A017` | Brighter gold — Motion A metric, logo, "reply" actions |
| `gold-light` | `#F5EFE0` | Selected-row background, soft gold fills |
| `brand-gold` | `#9E814B` | The logo wordmark's own gold (login screen) |
| `green` | `#2E7D4F` | "Won"/paying, positive metrics, "Sent" & "Mark contacted" buttons, coordinator dot |
| `green-light` | `#EAF3EC` | Green chip backgrounds |
| `red` | `#B23A3A` | Overdue (>60 days), lost/declined, error toasts |
| `red-light` | `#FAF0F0` | Red chip backgrounds |
| `amber` | `#C17F24` | Handover accent, T2/warning states, "Flag for Rus" |
| `amber-light` | `#FEF3E2` | Handover rule box, amber chip backgrounds |
| Neutral bg | `#F9FAFB` (gray-50) | App body background |
| Surface | `#FFFFFF` | Cards, panels, top bar right side |
| Borders | `#E5E7EB` (gray-200) | Dividers, card borders |
| Muted text | `#6B7280` (gray-500) | Sub-labels, metadata |

**Semantic color is separate from the accent.** Green = good/won, red =
overdue/lost, amber = needs-attention/handover. Gold is brand accent only.

### Typography

- **System sans-serif stack** throughout (`system-ui, Segoe UI, Roboto`). No
  display face — this is a utility tool. If Stitch wants a face: **Inter** is the
  closest match, kept plain.
- **Uppercase micro-labels** with wide letter-spacing (`0.2em`) for section
  headers and eyebrows — e.g. "SALES DASHBOARD", "RUS — DAILY PRIORITY LIST",
  "NEXT ACTION". This is the main typographic signature.
- Metric numbers are large and semibold; their labels are small and muted.
- Tabular numerals wherever figures align in columns.

### Shape & spacing

- Small radius on cards and chips (`4–8px`), pill shape (fully rounded) only on
  status chips and user avatars.
- Generous but not airy — this is a dense tool. Rows are compact.
- Flat. Minimal shadow (only modals and toasts lift off the page).

---

## 3. Global chrome (present on every screen after login)

Three stacked horizontal bands, full width, fixed at the top:

### 3a. Top bar

> **Stitch prompt:** A slim top navigation bar with a dark navy background
> (#1F2D3D) and a 3px gold bottom border. On the left: the "the ear academy"
> wordmark logo in gold, followed by a small uppercase "SALES" label in muted
> white. Next to it, a rounded pill badge showing today's date and term week,
> e.g. "Monday 13 July 2026 · Term week 1". On the right: two small circular
> user-initial chips ("RN" with a gold dot, "SC" with a green dot) where the
> current user's chip is highlighted; a text link "Templates" (only for Rus);
> and a ghost-outline "Logout" button. White text throughout.

- Height ~56px. The gold bottom border is the one bold brand moment.
- User chips indicate who's who at a glance: RN = Rus (gold dot), SC = Coordinator
  (green dot). The logged-in user's chip is brighter/outlined; the other is dimmed.
- "Templates" link appears **only when Rus is logged in**.

### 3b. Score strip

> **Stitch prompt:** A white horizontal strip below the top bar, divided into 5
> equal columns by thin vertical rules. Each column has a large semibold number
> and a small muted caption beneath. Columns: (1) paying schools count in green,
> caption "of 126 year-end target"; (2) Motion A pipeline count in gold, caption
> with open deal value in Rand e.g. "Motion A · R 259,000 open"; (3) Motion B
> untouched count in navy; (4) sponsor slots as "2/12" in navy, caption "Sponsor
> slots placed"; (5) a year-progress bar — small caption "Year progress · 3/126"
> above a thin green progress bar on a light track.

- These five numbers are the team's north star. They update live as work happens.
- Color-coding: paying = green (the goal), pipeline = gold (Rus's domain),
  everything else navy/neutral.

### 3c. Tab bar

> **Stitch prompt:** A white tab bar with three tabs: "Motion A", "Motion B",
> "Scorecard". The active tab has navy text and a gold underline (bottom border);
> inactive tabs are muted grey. The first two tabs carry a small rounded count
> badge (grey pill) next to their label showing how many items are in each.

- Active tab: navy text + 2px gold bottom border. Inactive: grey, no border.
- Badges: Motion A shows active-lead count; Motion B shows today's-queue count.

---

## 4. Login screen

> **Stitch prompt:** A centered login card on a full-screen dark navy background.
> The card is white, rounded, with a soft shadow, max ~380px wide. Inside, top to
> bottom: the "the ear academy" wordmark logo in brand gold (#9E814B), a small
> uppercase muted label "SALES DASHBOARD" with wide letter-spacing, then an email
> field and a password field (each with a small label above), then a full-width
> navy "Sign in" button. Fields have thin grey borders and a gold focus ring.
> Clean, minimal, no marketing copy.

- Just email + password. No sign-up, no forgot-password, no social login — the
  two accounts are created manually. Two users, ever.
- Error state: a small red line above the button ("Invalid login credentials").
- Button shows "Signing in…" and disables while submitting.

---

## 5. MOTION A tab — Rus's pipeline

**Purpose:** Rus's prioritised daily list of live deals, and a detail panel to
work each one. Two columns: a fixed-width lead list on the left, a flexible
detail panel on the right.

### 5a. Lead list (left column, ~310px fixed)

> **Stitch prompt:** A fixed-width left column (about 310px) with a white
> background and a right border. At the top, a small uppercase muted header "RUS —
> DAILY PRIORITY LIST (5)". Below it, a vertical list of lead cards. Each card
> shows: the contact's name in navy (semibold), a small uppercase tier badge on
> the right (e.g. "CLOSE" in green, "HOT" in amber, "ACTIVE" in gold), the school
> name in muted grey beneath, and a bottom row with "3d silent" on the left and a
> deal value "R 84,000" on the right. Each card has a colored left border stripe:
> green for CLOSE tier, amber for HOT/negotiation, red for leads silent over 60
> days, transparent otherwise. The selected card has a pale gold background
> (#F5EFE0) and a solid gold left border.

- Cards are sorted by priority: Close deals first, then reply-received, demos,
  proposals, negotiation, then by how long they've been silent (most urgent first).
- The colored left stripe is the fastest signal — green = closing, amber = hot,
  red = going cold.
- Tier badges: CLOSE (green fill, white text), HOT (amber fill), ACTIVE (gold
  fill), WARM/COLD/NURTURE (grey).

### 5b. Lead detail panel (right, flexible)

> **Stitch prompt:** A detail panel filling the rest of the width. Header: the
> contact's name large in navy, then a sub-line "School · Role" in grey, then a
> row of small chips (status pill, deal value, "3d silent", owner). Below the
> header, three stacked sections: (1) a "NEXT ACTION" box with a pale gold
> background (#F5EFE0) and an uppercase gold label, containing an editable one-line
> note ("Chase bursar for signed SLA"); (2) a "NOTES" section — uppercase grey
> label above a multi-line editable text area with a thin border; (3) a "TOUCH
> HISTORY" section — uppercase grey label above a list of past-contact cards, each
> showing the touch number (T1–T8) and date on one line, and "Sent by Rus · email"
> plus any reply summary beneath. The whole panel scrolls; a fixed action footer
> stays at the bottom.

- **Next action box** is the single most important field — a manually-written
  "what do I do next with this person" note in a gold box. Auto-saves on blur.
- **Notes** is the running free-text history, also auto-saves on blur.
- **Touch history** is read-only, newest first — an audit trail of every email/call.

### 5c. Detail footer (fixed at bottom of the detail panel)

> **Stitch prompt:** A fixed action bar at the bottom of the detail panel, white
> with a top border. On the left, three buttons: a green "✓ Mark contacted"
> button, a gold "↩ Reply received" button, and a ghost-outline "Log note" button.
> On the right: a date picker labeled "Next touch:" (a native date input), and a
> small owner indicator — a colored dot with "Rus — personal" (gold dot) or
> "Coordinator" (green dot).

- **✓ Mark contacted** (green): logs a touch, resets "days silent" to 0.
- **↩ Reply received** (gold): opens a small modal — pick new status (demo booked,
  proposal sent, negotiation, close, won, lost) + a "what did they say?" note.
- **Log note** (ghost): opens a textarea to append a dated line to notes.
- **Next touch date picker:** starts blank, set manually. Tooltip: "Set based on
  what this contact needs — not a fixed interval." (No auto-calculation — this is
  a deliberate judgement field.)
- Buttons disable while their action is in flight.

**Empty state:** if no lead is selected, the right panel shows centered grey text
"Select a lead to see details."

---

## 6. MOTION B tab — Coordinator's outreach queue

**Purpose:** The coordinator's daily cold-outreach queue and an email-compose
panel. Two columns: a wider fixed queue on the left (~370px), compose panel right.

### 6a. Outreach queue (left column, ~370px fixed)

> **Stitch prompt:** A fixed-width left column (~370px), white. Header block:
> "Coordinator outreach queue" in navy semibold, then "Pool progress · 5/204" with
> a thin green progress bar beneath, then a small row "T1: 3  T2: 2  T3: 1", then a
> small amber warning line "⚠️ Steady-state grows to ~12/day from Week 3". Below,
> the queue is split into labeled sections with colored divider bars: a navy bar
> "T1s — first touch today", an amber-tinted bar "T2 follow-ups due today", a grey
> bar "T3 follow-ups due today". Under each divider, lead cards: a hollow circle
> tick on the left (fills solid green with a check when done), the contact name in
> navy, school in grey beneath, and a small persona badge (e.g. "P4") on the right.
> Completed leads show at 45% opacity with the tick filled green.

- The queue is grouped by touch stage: fresh first-touches (T1), then follow-ups
  due today (T2, T3). Section dividers are color-coded (navy → amber → grey).
- The **tick circle** is the completion signal — empty, then green check when a
  touch is sent. Done rows fade to 45% opacity but stay visible.
- Persona badges (P1–P6) classify the school type, which drives which email
  template is used.

### 6b. Compose panel (right, flexible)

> **Stitch prompt:** A compose panel filling the rest of the width. Header:
> contact name large in navy, "School · Role" sub-line, then a row of small chips
> (persona code, touch number e.g. "T1", and muted text "Coordinator sends · hand
> off on reply"). Below: an email-draft card with a pale blue header bar labeled
> "EMAIL DRAFT" and a small "Switch template" dropdown on its right; the card body
> shows the merged email subject (bold) and body text (the template with the
> lead's real name and school filled in). Below the draft, an amber-background
> "handover rule" box with instructional text. Below that, a "SCHOOL CONTEXT"
> section showing the lead's notes read-only. A fixed footer at the bottom.

- The email draft shows the **real merged email** — template with `{{first_name}}`,
  `{{school_name}}` etc. already filled in from the lead's data. Ready to copy-paste
  into Outlook.
- "Switch template" dropdown appears if more than one template exists for the
  persona.
- **Handover rule box** (amber): fixed guidance — *"If [name] replies with genuine
  interest — a pricing question, a demo request, or they offer a time to talk — use
  the button below. Do not continue the conversation yourself."* This is the core
  rule of the whole system: the coordinator sends, but the moment there's interest,
  it goes to Rus.

### 6c. Compose footer

> **Stitch prompt:** A fixed bottom action bar. Left side buttons: green "✓ Sent —
> mark done", amber-outline "🔔 Flag for Rus — reply received", ghost "Park — wrong
> contact", ghost "Edit in Outlook". Right side: a date picker "T2 if no reply:"
> and a green-dot "Coordinator" owner indicator.

- **✓ Sent — mark done** (green): logs the touch, advances status (untouched →
  t1-sent → t2-sent), ticks the queue circle.
- **🔔 Flag for Rus** (amber outline): opens the Handover modal (below).
- **Park — wrong contact** (ghost): marks the lead parked, removes it from the queue.
- **Edit in Outlook** (ghost): copies the email to clipboard, shows a toast.

### 6d. Handover modal

> **Stitch prompt:** A centered modal over a dimmed backdrop. Title "Hand this lead
> to Rus", a small sub-line with the contact and school. Two optional fields: a
> datetime picker labeled "Demo date/time if already booked", and a textarea "Notes
> for Rus (optional)". Footer: a ghost "Cancel" button and a green "Confirm
> handover" button.

- On confirm: the lead moves from the coordinator's Motion B queue to Rus's Motion
  A list, status becomes "reply received", and an email notification is sent to Rus.
- Success: modal closes, a green toast appears — "Lead handed to Rus. Email
  notification sent." — and the lead vanishes from the queue.
- On Rus's screen, a toast announces the arrival: "New lead from coordinator:
  [name] at [school]".

**Empty state:** "Select a lead from the queue."

---

## 7. SCORECARD tab — the numbers

> **Stitch prompt:** A full-width scrollable page on a light grey background.
> Top: a 3-column grid of 6 metric cards (white, rounded, thin border) — each card
> has a large navy number, a grey label beneath, and an optional smaller sub-label.
> The six: Paying schools (sub "of 126 year-end target"), Motion A pipeline, Motion
> B untouched, Sponsor slots placed ("2/12"), Reply rate 90d ("20%"), Pending
> handovers. Below the grid, a section titled "CLOSE tier — Rus priority list": a
> table with columns Contact/School, Stage, Value, Last touch (days) — where any
> value over 60 days is shown in red. Below that, "Motion B — pool progress": a
> single-row table with columns Untouched, T1 sent, T2 sent, T3 sent, Reply
> received, Won, each showing a count.

- This is the read-only "how are we doing" view. Six summary tiles, then two
  detail tables.
- The CLOSE table is Rus's watch list — red text on the "days since last touch"
  column flags any close-tier deal going quiet.

---

## 8. TEMPLATE EDITOR — Rus only (modal)

> **Stitch prompt:** A large modal (about 90% viewport, max ~1000px) over a dimmed
> backdrop, split into two panes. Left pane (~280px): a scrollable list of email
> templates grouped by persona (P1–P6), each row showing the touch number and
> template name, with a small green/grey toggle switch on the right for active/
> inactive. Right pane: when a template is selected, a "Subject" text input and a
> large "Body" textarea (monospace), with a hint line "Merge fields: {{first_name}},
> {{school_name}}, {{contact_role}}" beneath, and "Save" + "Preview" buttons. The
> Preview state replaces the editor with the same text but merge fields filled with
> sample data (e.g. "Alex", "Riverside Primary").

- Accessible only to Rus, via the "Templates" link in the top bar.
- Templates are the email library — one per persona × touch combination.
- **No delete** — templates are deactivated via the toggle, not removed. Turning
  one on turns off the other active one for that persona+touch.
- **Preview** shows the email with sample merge data filled in.

---

## 9. Shared components (reused across screens)

| Component | Look |
|---|---|
| **Status chip** | Small rounded pill. Untouched=grey, T1/T2/T3-sent=gold-light/gold, reply/demo/proposal/negotiation=amber-light/amber, close/won=green-light/green, lost/declined/blocked=red-light/red, parked=grey. |
| **Tier badge** | Tiny uppercase label. CLOSE=green fill, HOT=amber fill, ACTIVE=gold-mid fill, WARM=gold-light, COLD/NURTURE/PARKED=grey. |
| **Date picker** | Inline label + native date input, gold focus ring. |
| **Owner indicator** | Colored dot + text. Rus=gold dot "Rus — personal", Coordinator=green dot "Coordinator". |
| **Toast** | Bottom-right floating pill. Success=green, error=red. Auto-dismisses ~4s. |
| **Loading spinner** | Small gold-topped spinning ring with optional label. |

---

## 10. Interaction & state notes for Stitch

- **Two-column master–detail** is the core pattern on Motion A and Motion B: fixed
  list left, scrolling detail right, fixed action footer inside the detail.
- **Live updates:** both users see each other's changes appear without refreshing.
  Design "just updated" gracefully — no jarring reflows.
- **Every action button** has a disabled/in-flight state (prevent double-clicks).
- **Auto-save on blur** for the Next Action box and Notes — no explicit save button
  there. (Contrast: the Template editor does have an explicit Save.)
- **Empty states** everywhere a list or selection can be empty (see each section).
- **The date pickers never auto-populate** — blank until the user sets them.

---

## 11. Screen inventory (for Stitch, one prompt each)

1. **Login** — centered card on navy.
2. **App shell** — top bar + score strip + tab bar (the persistent chrome).
3. **Motion A** — lead list + lead detail + detail footer.
4. **Motion A — reply modal** — small status-change modal.
5. **Motion B** — outreach queue + compose panel + compose footer.
6. **Motion B — handover modal** — the flag-for-Rus modal.
7. **Scorecard** — metric grid + two tables.
8. **Template editor** — two-pane modal (Rus only).

Build them in that order; screens 2–3 establish the visual system the rest reuse.

---

*Reference implementation: this repository (React + Tailwind). The live demo shows
every screen with sample data if you want to screenshot the current look before
redesigning.*
