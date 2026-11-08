---
name: Astoren Wallet
description: Friendly, phone-first USD/EUR exchange wallet. shadcn/ui + Tailwind; this DESIGN.md specifies the brand-layer delta only.
status: final
created: 2026-11-08
updated: 2026-11-08
colors:
  # Brand overrides on top of shadcn defaults. Unlisted shadcn tokens
  # (popover, popover-foreground, destructive-foreground) inherit.
  # Hex values are drafts against the product owner's direction:
  # light = lighter blue + lighter grey, dark = dark blue + dark grey.
  # In dark theme every {colors.x} resolves to {colors.x-dark}.
  background: '#F5F7FA'
  foreground: '#1C2433'
  card: '#FFFFFF'
  card-foreground: '#1C2433'
  muted: '#EEF1F5'
  muted-foreground: '#5B6474'
  border: '#DDE2EA'
  input: '#7D8696'
  ring: '#2563EB'
  primary: '#2563EB'
  primary-foreground: '#FFFFFF'
  accent: '#DBEAFE'
  accent-foreground: '#1E3A8A'
  destructive: '#C62828'
  status-success: '#137333'
  status-warning: '#A14A07'
  status-neutral: '#5B6474'
  test-banner: '#FEF3C7'
  test-banner-foreground: '#78350F'
  background-dark: '#0E1320'
  foreground-dark: '#E6EAF2'
  card-dark: '#161C2B'
  card-foreground-dark: '#E6EAF2'
  muted-dark: '#1E2535'
  muted-foreground-dark: '#9AA4B8'
  border-dark: '#2A3243'
  input-dark: '#66728A'
  ring-dark: '#4C8DFF'
  primary-dark: '#4C8DFF'
  primary-foreground-dark: '#0A1630'
  accent-dark: '#1A2B4F'
  accent-foreground-dark: '#BFD6FF'
  destructive-dark: '#F87171'
  status-success-dark: '#4ADE80'
  status-warning-dark: '#FBBF24'
  status-neutral-dark: '#9AA4B8'
  test-banner-dark: '#3A2E0B'
  test-banner-foreground-dark: '#FCD34D'
typography:
  # [ASSUMPTION] Inter replaces shadcn's default sans. Every amount, rate,
  # code and countdown uses tabular numerals (font-feature-settings: 'tnum').
  amount-display:
    fontFamily: 'Inter'
    fontSize: 36px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  amount-lg:
    fontFamily: 'Inter'
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  title:
    fontFamily: 'Inter'
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.3'
  body:
    fontFamily: 'Inter'
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label:
    fontFamily: 'Inter'
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
  caption:
    fontFamily: 'Inter'
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
  code:
    # [ASSUMPTION] JetBrains Mono for withdrawal codes and references.
    fontFamily: 'JetBrains Mono'
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.08em
rounded:
  # Softer than shadcn defaults: friendly consumer, not a tool.
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  full: 9999px
spacing:
  # shadcn / Tailwind 4-based scale inherited. Named tokens only:
  gutter-mobile: 16px
  gutter-desktop: 24px
  touch-target: 44px
  button-height: 48px
  row-min: 64px
  content-max: 560px
  board-max: 1040px
components:
  button-primary:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.md}'
    height: '{spacing.button-height}'
  balance-card:
    background: '{colors.card}'
    foreground: '{colors.card-foreground}'
    radius: '{rounded.lg}'
    amount: '{typography.amount-display}'
  direction-switch:
    background: '{colors.muted}'
    active-background: '{colors.primary}'
    active-foreground: '{colors.primary-foreground}'
    radius: '{rounded.full}'
  amount-input:
    background: '{colors.card}'
    border: '{colors.input}'
    radius: '{rounded.sm}'
    typography: '{typography.amount-lg}'
  quote-row-house:
    background: '{colors.muted}'
    foreground: '{colors.foreground}'
    radius: '{rounded.md}'
    min-height: '{spacing.row-min}'
  quote-row-better:
    background: '{colors.accent}'
    foreground: '{colors.accent-foreground}'
    radius: '{rounded.md}'
    min-height: '{spacing.row-min}'
  quote-row-own:
    background: '{colors.card}'
    border: '{colors.primary}'
    foreground: '{colors.foreground}'
    radius: '{rounded.md}'
  quote-row-out-of-range:
    background: 'transparent'
    border: 'dashed {colors.border}'
    rate-foreground: '{colors.muted-foreground}'
    label-foreground: '{colors.foreground}'
  preview-sheet:
    background: '{colors.card}'
    radius: '{rounded.xl}'
  lock-countdown:
    foreground: '{colors.primary}'
    track: '{colors.muted}'
  withdrawal-code-card:
    background: '{colors.muted}'
    foreground: '{colors.foreground}'
    typography: '{typography.code}'
    radius: '{rounded.lg}'
  status-pill:
    background: '{colors.card}'
    radius: '{rounded.full}'
    typography: '{typography.caption}'
  status-timeline:
    done: '{colors.foreground}'
    current: '{colors.primary}'
    future: '{colors.muted-foreground}'
    line: '{colors.border}'
  reconnecting-strip:
    background: '{colors.muted}'
    foreground: '{colors.muted-foreground}'
    typography: '{typography.caption}'
  test-money-banner:
    background: '{colors.test-banner}'
    foreground: '{colors.test-banner-foreground}'
    typography: '{typography.caption}'
---

## Brand & Style

Astoren makes currency exchange feel routine. The product promise is that you always see the full cost and always know where your money is. The visual language serves that promise. It's a friendly consumer surface, like a modern neobank: soft corners, generous spacing, big legible amounts, and a calm blue doing most of the work against cool greys.

The posture is **a wallet, not a trading platform**. There are no charts, tickers, flashing prices or red/green moves. The numbers that matter (what you pay, what you get, what it costs) are large and quiet, and everything else steps back.

Astoren inherits shadcn/ui and specifies only the brand layer here: colour overrides, a softer radius scale, Inter with tabular numerals, and a handful of product components. Behaviour for every component lives in [EXPERIENCE.md](EXPERIENCE.md).

Mockups, each showing light and dark side by side: [mockups/home.html](mockups/home.html), [mockups/quote-board.html](mockups/quote-board.html), [mockups/withdrawal-code.html](mockups/withdrawal-code.html), [mockups/deposit-detail.html](mockups/deposit-detail.html). **Where a mockup and this file disagree, this file wins.**

## Colors

In dark theme, every `{colors.x}` resolves to `{colors.x-dark}`. The frontmatter is the only place hex values are defined. They're drafts against the product owner's direction (lighter blue and grey for light, dark blue and grey for dark), awaiting confirmation.

**Hard rule (PRD §1):** rates, balances, offers and amounts are never green or red, and never coloured by direction of change. A rate that moved is shown in `{colors.foreground}`, the same as one that didn't.

- **Blue, `{colors.primary}`**: primary actions, active navigation, links, focus rings, the lock countdown, and the current step in a status timeline.
- **Light blue tint, `{colors.accent}`**: only quote rows that beat the house rate, and selected states. It means "a better deal is here", not "you gained".
- **Greys:** the light theme is a cool light-grey canvas (`{colors.background}`) with white cards (`{colors.card}`). The dark theme pairs a dark-blue canvas with dark-grey cards.
- **Input boundary, `{colors.input}`**: form-control borders, at least 3:1 against both canvases and cards (WCAG 1.4.11). `{colors.border}` is for decorative dividers only.
- **Status colours**: lifecycle status only, never amounts. *Warning* means you need to act, *neutral* means it's in flight or closed without loss, *success* means done, and *destructive* means it was refused.
- **Test-money amber, `{colors.test-banner}`** (pilot): only the persistent banner. It's deliberately unlike the brand blue, and it's removed at go-live.

| Status (PRD vocabulary) | Applies to | Token | Icon |
|---|---|---|---|
| awaiting payment | deposit | `{colors.status-warning}` | wallet (action needed) |
| awaiting confirmation | deposit | `{colors.status-neutral}` | clock |
| mismatch | deposit | `{colors.status-warning}` | circle-alert |
| pending | withdrawal | `{colors.status-neutral}` | clock |
| completed | deposit, withdrawal, exchange, transfer | `{colors.status-success}` | circle-check |
| expired | deposit, withdrawal | `{colors.status-neutral}` | hourglass |
| cancelled | withdrawal | `{colors.status-neutral}` | undo-2 (money is back) |
| rejected | withdrawal | `{colors.destructive}` | circle-x |
| open | offer | `{colors.status-neutral}` | circle-dot |
| partially filled | offer | `{colors.status-neutral}` | circle-dashed |
| out of range | offer | `{colors.status-warning}` | circle-pause |

Icons come from **lucide-react**, shadcn's default set. The names above are lucide names. The hand-drawn icons in the mockups are stand-ins.

**Contrast check (2026-11-08):** every text/background pair, including the status colours on `{colors.card}` and `{colors.background}`, reaches at least 4.5:1 in both themes. The lowest is `{colors.primary}` on `{colors.muted}` (light) at 4.56:1. Re-check whenever a value changes.

## Typography

**Inter** `[ASSUMPTION]` replaces shadcn's default sans. Every number uses tabular numerals so live values don't jitter. Number formatting rules live in EXPERIENCE.md (Voice and Tone).

- `{typography.amount-display}` (36px/600): the hero amount. That's "You get" on the preview sheet, the amount on the withdrawal code card, and each balance card on Home. Normally a screen has a single hero amount. Home is the one exception: it shows both balances at this size.
- `{typography.amount-lg}` (24px/600): the rate on a quote row, "You pay" in the preview, and the amount input.
- `{typography.title}`, `{typography.body}`, `{typography.label}` and `{typography.caption}`: the standard ramp.
- `{typography.code}` (**JetBrains Mono** `[ASSUMPTION]`, 28px, wide tracking): withdrawal codes and deposit references, grouped in fours so they're easy to read aloud at a counter. The format in the mockups (`7KQ4 M2XP 9`) is illustrative. Architecture owns the real length and alphabet.

## Layout & Spacing

**Phone-first.** The shadcn/Tailwind 4-based scale is inherited.

- Phones get a single column with `{spacing.gutter-mobile}` side margins. Content is capped at `{spacing.content-max}` on larger screens, except the quote board.
- At `lg` (1024px+), the quote board widens to `{spacing.board-max}`, with the board on the left and the preview or Post an offer docked on the right.
- Every touch target is at least `{spacing.touch-target}`. Quote rows are at least `{spacing.row-min}`.
- On phones, the primary action is a sticky footer button within thumb reach. On desktop it's inline at the end of the form.

## Elevation & Depth

shadcn's shadows are inherited. Depth is used only for **the thing you're about to commit to**: the preview sheet and the withdrawal code card get a raised shadow. In dark theme, depth comes from the card colour against the canvas, not from shadows.

## Shapes

- `{rounded.sm}` (8px): inputs, chips.
- `{rounded.md}` (12px): buttons, quote rows.
- `{rounded.lg}` (16px): cards, the balance card, the withdrawal code card.
- `{rounded.xl}` (24px): the top corners of bottom sheets.
- `{rounded.full}`: status pills, the direction switch, avatars.

## Components

These shadcn components are used unchanged except for inherited tokens: `Button` (non-primary variants), `Card`, `Dialog`, `Drawer`, `Sheet`, `Tabs`, `Input`, `Select`, `RadioGroup`, `Toast` (Sonner), `Badge`, `Skeleton`, `Alert`, `Progress`, `Separator`, `Avatar`. The Post an offer preview, the price alert form and toasts have no brand delta: they inherit `Drawer`/`Sheet`, `Input`/`Select` and Sonner as they are.

This section gives visual specs only. Behaviour is in EXPERIENCE.md (Component Patterns and State Patterns).

**Global chrome**

- **Test-money banner**, `test-money-banner` (pilot): a full-width strip pinned to the very top of every screen, reading "Test money — no real value".
- **Reconnecting strip**, `reconnecting-strip`: a thin `{colors.muted}` strip directly below the test-money banner and above the header, reading "Reconnecting…".
- **Notifications bell**: a header icon button with an unread dot in `{colors.primary}`. In the inbox, unread rows use `{typography.label}` weight plus a dot. Read rows use `{typography.body}`.
- **Button (primary)**, `button-primary`: `{colors.primary}` fill, `{rounded.md}` corners, `{spacing.button-height}` tall, full width on phones.

**Home**

- **Balance card**, `balance-card`: the flag and currency code, then the available amount in `{typography.amount-display}`. The footer row has two separate buttons, **Held** and **Pending**, in `{typography.label}` and `{colors.muted-foreground}`, each at least `{spacing.touch-target}` tall. → [mockups/home.html](mockups/home.html)
- **"In progress" list**: a `Card` with a `{typography.label}` heading. Each row has an icon, the movement name, the amount and a status pill. The compact withdrawal code card sits at the top.

**Exchange**

- **Direction switch**, `direction-switch`: a two-segment shadcn `Tabs` in a `{rounded.full}` pill. The active segment is `{colors.primary}`.
- **Amount input**, `amount-input`: the amount in `{typography.amount-lg}` with the currency code as a suffix, inside a `{colors.input}` border. Below it are a caption line ("€2,140.00 available") and a "Use all" chip (shadcn `Badge`, outline variant). On Exchange, two of these stack: **You pay** and **You get**.
- **Quote board**: the umbrella for four row variants. Every row shows the rate (`{typography.amount-lg}`), a **Fixed** or **Pegged** caption, what you'd pay, and how much is available. → [mockups/quote-board.html](mockups/quote-board.html)
  - **House row**, `quote-row-house`: `{colors.muted}` fill, a "House rate" label and the caption "Guaranteed fallback".
  - **Better than house**, `quote-row-better`: `{colors.accent}` fill, captioned "Better than house by 0.35%". The only use of the accent on the board.
  - **Your offer**, `quote-row-own`: `{colors.card}` fill with a 1px `{colors.primary}` border and a "Your offer" label.
  - **Out of range**, `quote-row-out-of-range`: transparent, with a dashed `{colors.border}` outline. The rate is set in `{colors.muted-foreground}` to read as dimmed. The "Out of range" label stays in `{colors.foreground}`.
- **Preview sheet**, `preview-sheet`: a bottom `Drawer` on phones and a docked panel at `lg`. Top to bottom: You pay, You get (`{typography.amount-display}`), rate, total cost (money and %), the bureau line, the lock countdown, and the confirm button. Messages (such as a lost race) use a shadcn `Alert` at the top of the sheet.
- **Lock countdown**, `lock-countdown`: a thin `Progress` bar in `{colors.primary}` on a `{colors.muted}` track, labelled "Rate held · 7s". It never turns red.
- **Offer type selector** (Post an offer): a shadcn `RadioGroup` shown as two cards, **Fixed rate** and **Pegged to market**. The pegged card reveals a "market ± %" stepper.
- **My offers row**: the rate, Fixed or Pegged, "€860 of €1,500 left" with a thin `Progress`, a status pill, and a ghost **Cancel** button.

**Movements**

- **Withdrawal code card**, `withdrawal-code-card`: the code in `{typography.code}` on `{colors.muted}`, with `{rounded.lg}` corners and a raised shadow. Below it are the amount, "Valid until 21:10 tomorrow · 23h left", and **Copy** / **Cancel**. The compact Home version drops Cancel. → [mockups/withdrawal-code.html](mockups/withdrawal-code.html)
- **Deposit reference block**: the reference in `{typography.code}` (grouped) on `{colors.muted}`, with Copy. Below it, in `{typography.body}`: the account details (bank transfer) or "Show this reference at the counter" (cash), then the expiry caption. → [mockups/deposit-detail.html](mockups/deposit-detail.html)
- **Receipt attach**: a shadcn outline `Button` ("Attach receipt") that opens the file or camera picker, and an `Input` labelled "Transaction number" with a `{colors.input}` border. An attached file shows as a row with its file name and a remove action. A primary **Send receipt** button follows.
- **Status pill**, `status-pill`: a `{rounded.full}` badge on `{colors.card}`. The icon and label use the status token from the table in Colors.
- **Status timeline**, `status-timeline`: a vertical list joined by a `{colors.border}` line. Past steps have a filled dot in `{colors.foreground}`, the current step a ring dot in `{colors.primary}`, and future steps a hollow dot in `{colors.muted-foreground}`. Timestamps are in `{typography.caption}`.
- **Unmatched funds row**: an "In progress" or Activity row with a *mismatch* pill in `{colors.status-warning}` and a small primary `Button` inline: "Claim $750".

## Do's and Don'ts

| Do | Don't |
|---|---|
| Show amounts big, in tabular numerals | Animate or flash numbers when the rate changes |
| Use the accent tint only for "better than house" rows | Colour rates or balances green or red, ever |
| Always show held and pending next to available | Hide buckets behind a tap or a tooltip |
| Pair every status colour with a label and an icon | Use colour alone to say a deposit is done |
| Show *cancelled* and *expired* as neutral, since the money is safe | Use destructive red for anything except *rejected* and errors |
| Put the primary action in thumb reach on phones | Put the confirm button at the top of a long sheet |
| Inherit shadcn for everything not listed here | Add charts, sparklines or candlesticks anywhere |
| Keep the test-money banner visible on every screen | Style the banner in the brand blue |
