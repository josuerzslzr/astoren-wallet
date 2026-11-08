---
name: Astoren Wallet
status: final
created: 2026-11-08
updated: 2026-11-08
sources:
  - _bmad-output/planning-artifacts/prds/prd-astoren-wallet-2026-11-04/prd.md
  - _bmad-output/planning-artifacts/prds/prd-astoren-wallet-2026-11-04/addendum.md
  - _bmad-output/brainstorming/brainstorm-fintech-practice-project-2026-11-02/brainstorm-intent.md  # supporting only; PRD wins
---

# Astoren Wallet — Experience Spine

## Foundation

Astoren is a single responsive web app (PRD NFR-6), designed **phone-first** and scaled up for desktop. It's built in React with **shadcn/ui + Tailwind** (Radix primitives). This spine specifies only the behaviour that differs from shadcn's defaults. [DESIGN.md](DESIGN.md) is the visual identity reference.

**Governing rules.** Three rules in Interaction Primitives explain most of the tables below: every money movement has an explicit confirm, money never updates optimistically, and live data updates without motion.

**Mockups:** [mockups/home.html](mockups/home.html), [mockups/quote-board.html](mockups/quote-board.html), [mockups/withdrawal-code.html](mockups/withdrawal-code.html) and [mockups/deposit-detail.html](mockups/deposit-detail.html) (states: awaiting payment, completed, mismatch). Every other surface is built from this spine alone. **Where a mockup and this spine disagree, the spine wins.** The amounts, rates and balances in the mockups are illustrative.

**Terms** follow the PRD glossary (§3) exactly, with one UI-label mapping recorded there: the glossary's **house quote** appears in the UI as **"House rate"**. Code, stories and the API keep *house quote*.

**Scope:** the end-user wallet only. Back office (FR-26) and operator simulation controls (FR-27 to FR-29) are API-only in the pilot and have no screens. Offer expiry (FR-23, Could) is deferred and not designed here. The UX is designed as if the money were real (PRD §0). Pilot-only elements are marked **(pilot)**.

## Information Architecture

| Surface | Reached from | Purpose | PRD |
|---|---|---|---|
| Sign up / Sign in | App open, signed out | Email and password, plus a required **display name** at sign-up | FR-1 |
| Home | Tab **Home** (default) | USD and EUR balance cards (available, held, pending); quick actions; "In progress"; recent activity | FR-2, JTBD-3 |
| Exchange (quote board) | Tab **Exchange**; Home quick action | Direction switch, You pay / You get, the house quote and live offers, best first | FR-12 to FR-17 |
| Exchange preview | Tap a quote row | All-in cost preview, quote lock, confirm the take | FR-14, FR-18 to FR-20 |
| Post an offer | Board, "Post your own rate" | Fixed or pegged, amount, rate, preview, post | FR-21, FR-22 |
| My offers | Board header; Home "In progress"; *Held* on a balance card | Open, partially filled and out-of-range offers at their live rate; cancel | FR-21 to FR-23 |
| Add money | Home quick action; "Claim" on unmatched funds | Amount, currency, method (bank transfer or cash), then the deposit request | FR-4, FR-7 |
| Deposit detail | Activity row; Home "In progress" | Reference, payment instructions, status timeline, attach receipt | FR-4 to FR-7 |
| Withdraw | Home quick action | Bank payout or cash code; amount; payout account (bank only); preview | FR-8, FR-9, FR-11 |
| Withdrawal code | After confirming a cash withdrawal; Activity row; Home card | The code, its expiry, copy, cancel | FR-9, FR-10 |
| Send | Home quick action | Recipient email, then their display name; amount; confirm | FR-24 (Should) |
| Activity | Tab **Activity** | Every movement, newest first, filterable by currency and type | FR-3 |
| Movement detail | Activity row; *Pending* on a balance card | Status timeline with timestamps, amounts, cost, linked requests | FR-3, NFR-5 |
| Notifications | Bell in the header | In-app inbox: offers filled, status changes, price alerts | FR-25 (Should) |
| Price alerts | Board, "Alert me"; Account | Create, list, delete | FR-25 (Should) |
| Account | Tab **Account** | Profile (display name), saved payout bank accounts, price alerts, theme, sign out | FR-1, FR-8, FR-25 |

**Navigation** `[ASSUMPTION]`: on phones, a bottom tab bar with four tabs (**Home · Exchange · Activity · Account**) and the notifications bell in the top header. Desktop layout is in Responsive & Platform. Add money, Withdraw and Send open as full-screen flows from Home, with a back arrow.

**Persistent chrome:** the test-money banner (pilot) is pinned to the very top of every surface, including sign-in. When the "Reconnecting…" strip is shown, it sits directly below the banner.

**Resolved assumptions:**
- **Display name:** sign-up asks for a required display name, editable in Account → Profile (FR-1). It's what Send shows the sender (FR-24).
- **Payout bank accounts:** entered the first time in the Withdraw flow and saved there. Account lists saved accounts, where the user can edit or remove them (FR-8).
- `[ASSUMPTION]` **Price alerts:** created from the board's "Alert me" action, pre-filled with the current direction and best rate. Managed in Account.

## Voice and Tone

These rules cover microcopy. Brand posture lives in DESIGN.md (Brand & Style). The core rule: **exchange, never trade**.

| Do | Don't |
|---|---|
| "Exchange", "rate", "offer", "take this rate" | "Trade", "buy / sell", "order", "position", "market order" |
| "You pay €914.20 · You get $1,000.00" | "Sell €914.20" |
| "Total cost €2.70 (0.30%). A typical bureau charges about €64." | "You save €61!", "You profit" |
| "Better than house by 0.35%" | "Hot deal 🔥" |
| "House rate · Guaranteed fallback" | "Always available" (it can briefly pause) |
| "Your $300 is set aside until you collect it." | "Funds locked in escrow" |
| "That offer was just taken. Nothing was charged." | "Error: offer unavailable" |
| "Rates are paused for a moment. They'll resume automatically." | "Market halted" |
| Short, plain sentences in the second person. Name the amount and the next step. | Exclamation marks, jargon (spread, bid/ask, P&L, liquidity) |

"Spread" never appears in user-facing copy. Cost is always shown in money and as a percentage.

**Numbers.** Rates show 4 decimals (`1 EUR = 1.0939 USD`) and money shows 2. `[ASSUMPTION]` The pilot UI is English only. Amounts are formatted for the browser locale (`$1,000.00` / `1.000,00 $`). The currency code appears next to an amount wherever the two currencies could be confused.

## Component Patterns

These are behavioural rules. Visual specs live in DESIGN.md (Components) or in shadcn's defaults. Component states live in State Patterns.

| Component | Use | Behavioural rules |
|---|---|---|
| Balance card | Home | One per currency. The card body has a single "See activity" target that opens Activity filtered to that currency. **Held** and **Pending** are separate footer buttons. Held opens My offers. Pending opens the pending movement, or Activity filtered to pending if there are several. Both are always shown, even at zero. Values update live (NFR-4) without animation. |
| Direction switch | Exchange | Switches between **USD → EUR** and **EUR → USD** and remembers the last choice. Switching keeps the number in whichever field the user last typed in. |
| Amount input | Exchange, Add money, Withdraw, Send, Post an offer | Numeric keypad on phones. Shows the available balance and a "Use all" chip. **On Exchange there are two linked fields, You pay and You get.** The user types in either one, and the other is computed from the selected row, or from the best row when none is selected. Limit and minimum errors (FR-4, FR-11, FR-19, FR-21, FR-24) appear inline as the user types. |
| Quote board | Exchange | Best rate first. The house row is always present and sorted into rate order: better-than-house offers above it, out-of-range offers below it with the rate dimmed. Each row shows the rate, Fixed or Pegged, what you'd pay and how much is available. Rows update in place, and a taken or cancelled offer disappears within 1s (FR-17). A reorder waits 300ms after the last touch, so the list never moves under the user's finger. "Your offer" rows can't be tapped (FR-19). |
| Preview sheet (exchange) | Exchange | Opens from a quote row. For the house rate or a pegged offer, it holds the rate for 10s (FR-14), shown as "Rate held · 7s". Fixed offers show "Fixed rate, no timer". Content: You pay, You get, rate, total cost (money and %, against market), and the bureau line (FR-18). At `lg` it's docked. Before a row is selected, the docked panel reads "Pick a rate to see the full cost." |
| Preview (Post an offer) | Post an offer | **No lock and no countdown.** Shows the amount to be held, the rate (or "market + 0.3%, now 1.0973"), what you'd receive at today's rate, and "€1,500 will be held while your offer is open." At `lg` it opens in the docked panel. |
| Lock countdown | Exchange preview | Counts down in seconds. Never confirms automatically. |
| Withdrawal code card | Withdrawal code screen; Home "In progress" (compact) | Shows the code in groups of four, **Copy**, and "Valid until 21:10 tomorrow · 23h left". **Cancel** appears only on the full screen. It opens a dialog: "Cancel and return $300 to available?", with **Cancel code** / **Keep code**. The compact card shows the code, Copy and the expiry, and tapping it opens the full screen. The compact card stays on Home until the code is redeemed, cancelled or expired. |
| Deposit reference block | Deposit detail | The reference (grouped mono) with Copy. Then the company account details (bank transfer) or "Show this reference at the counter" (cash), and "Pay by Tue 14:00" (72h, FR-4). |
| Receipt attach | Deposit detail | Opens the file picker for an image or PDF, with the camera available on phones. A **Transaction number** field ("on your receipt") is required. **Send receipt** becomes active once both are present. Sending changes the status to *awaiting confirmation* (FR-5). |
| Status timeline | Movement detail, Deposit detail | Lists every status with its timestamp (NFR-5). Future steps have no timestamp. Updates live without a reload (FR-3). *Mismatch* is the last step until the funds are claimed. After the claim, the mismatch step gets a "Resolved by deposit A9…" link to the resolving request (FR-7). |
| "In progress" list | Home | Every movement that isn't final: deposits *awaiting payment* or *awaiting confirmation*, *mismatch* deposits, *pending* withdrawals, unredeemed withdrawal codes, and open offers (as one "3 open offers" row). Sorted by soonest expiry. **Hidden entirely when empty.** |
| Unmatched funds row | Activity, Home "In progress" | Reads "$750 arrived under reference A7KD… (expected $800)". One action, **Claim $750**, opens Add money pre-filled with the exact amount and currency. The claim completes with no payment step (FR-7). |
| My offers row | My offers | Shows the **current** rate (live for pegged offers, FR-22), the amount left out of the original, and a status pill (*open*, *partially filled*, *out of range*). **Cancel** returns the remaining held funds to available (FR-23). |
| Offer type selector | Post an offer | Choose Fixed or Pegged. Fixed asks for a rate. Pegged asks for "market ± %" in 0.05% steps. Both show the resulting live rate underneath. |
| Status pill | Lists, details | An icon and a label in the PRD status vocabulary. The token mapping is in DESIGN.md (Colors). |
| Notifications inbox | Bell | An unread dot shows on the bell while anything is unread. Tapping an item marks it read and opens the related detail. "Mark all read" sits at the top. |
| Price alert form | Board "Alert me", Account | Direction and a threshold rate ("Tell me when an offer beats 1.0950 USD per EUR"), pre-filled from the board. If an identical alert already exists, the form shows "You already have this alert" and creates nothing. Delete alerts from Account. |
| Toast (Sonner) | Global | For non-blocking events: "Your offer was filled: $640 of $1,630", status changes, triggered alerts. Tapping a toast opens the related detail. |

## State Patterns

Every list surface cold-loads with skeleton rows that match its layout. Money actions follow Interaction Primitives: no optimistic updates.

### Market and board

| State | Surface | Treatment | PRD |
|---|---|---|---|
| Rates paused (staleness) | Board, Preview | An inline `Alert` at the top of the board: "Rates are paused for a moment. They'll resume automatically." Rows dim and can't be tapped, Confirm is disabled, and any open lock is cancelled. Makers can still cancel offers. "Post your own rate" is disabled and shows the same message. Clears by itself. This is **not** the stale-screen message. | FR-15 |
| Weekend closure | Board | A caption on the house row: "Markets are closed for the weekend. The house rate uses the last market rate from before the closure." Any weekend add-on is included in the cost. | FR-13 |
| House unavailable | Board | The house row reads "House rate unavailable right now" and dims. Offers stay takeable. | FR-16 |
| Above house capacity | Preview | "The house can fill up to $1,240 right now", with a one-tap "Use $1,240". | FR-16 |
| Lock expired | Preview | The rate refreshes in place, marked "Rate updated. Check and confirm again." Expiry never costs anything. The user just confirms again. **This is the only statement of this rule.** | FR-14 |
| Lost race (taken) | Preview | An `Alert` in the sheet: "That offer was just taken. Nothing was charged." The next-best row is pre-selected with a fresh preview, or the house rate if no other offer remains. One tap retries. | FR-20 |
| Lost race (not enough left) | Preview | "Only $400 is left on that offer. Nothing was charged." Two actions: **Take $400**, or the pre-selected next-best rate for the full amount. | FR-20 |
| Linked wallet's offer | Board | The row reads "Not available to you" and can't be tapped. | FR-19, FR-24 |

### Connectivity and session

| State | Surface | Treatment | PRD |
|---|---|---|---|
| Realtime reconnecting | Global | The "Reconnecting…" strip. After 10s with no board updates, the stale-screen state applies. | NFR-4 |
| Stale screen (no updates for 10s) | Board, Preview | A **blocking** dialog: "We couldn't update rates. Check your connection.", with **Refresh**. Nothing can be confirmed underneath it. It's the only overlay allowed above a sheet. | FR-17 |
| Session expired | Global | Returns to Sign in. After signing in, the user lands back on the same surface. Any unconfirmed preview is discarded. | — |

### Offers

| State | Surface | Treatment | PRD |
|---|---|---|---|
| Rate worse than house | Post an offer | Inline under the rate: "Your rate is worse than the house rate. Try 1.0900 or better." Post is disabled. | FR-21 |
| Below minimum / rate-limited | Post an offer | "Minimum offer is $10." / "You've posted several offers in a short time. Try again in a minute." | FR-21 |
| Offer out of range | Board, My offers | On the board: rate dimmed, below the house row. In My offers: an *out of range* pill, "Your rate is worse than the house rate right now. Funds stay held.", and **Cancel**. | FR-21 |
| Remainder below minimum | My offers, toast | "Your offer closed. The remaining $4 was below the minimum and is back in available." | FR-19 |

### Money movements

| State | Surface | Treatment | PRD |
|---|---|---|---|
| New wallet, zero balances | Home | Balance cards at 0.00, plus "Add money to get started" (→ Add money). | FR-1 |
| Limit or minimum hit | Amount input | Inline: "Up to $2,000 per deposit. $3,200 left this month." / "Minimum exchange is $10." | FR-4, FR-11, FR-19, FR-24 |
| Insufficient available | Amount input | "You have $420 available. $380 is held in your offers." (→ My offers) | FR-2 |
| Confirm fails in flight | Any confirm | The button keeps spinning with "Checking…" until the server says whether the action ran (NFR-2). If it ran: the normal success screen. If it didn't: "We couldn't confirm. Nothing has moved." with **Retry**, which resends the same request. | NFR-2 |
| Deposit completed | Deposit detail | A *completed* pill and "$800.00 is in your USD balance." The reference shrinks to a caption, and the receipt section is hidden. | FR-6 |
| Deposit mismatch | Deposit detail | A *mismatch* pill, the amount received and the reason, and **Claim $750**. Once claimed, the timeline links to the resolving request. | FR-7 |
| Claim above limit | Add money (claim) | "This is above your deposit limit. We're reviewing it and will credit it once it's approved." | FR-7, FR-26 |
| Reference forgotten | Deposit detail | The user can't see unattributable funds. After they attach a receipt: "We're checking your receipt. We'll let you know when it's done." | FR-7, FR-26 |
| Receipt problems | Deposit detail | Wrong type or too large: "Use an image or PDF up to 10 MB." `[ASSUMPTION: size]` Upload failed: the request stays *awaiting payment*, with **Retry**. Camera permission denied: silently falls back to the file picker. | FR-5 |
| Cancel loses to redemption | Withdrawal code | "This code was already collected. $300 has been paid out." The status shows *completed*. | FR-10 |
| Expired / cancelled / rejected | Details | The final status pill, plus where the money is now: "$300 is back in available." Rejected bank payouts add "The bank returned it." | FR-3, FR-8, FR-10 |
| Recipient not found | Send | "No Astoren wallet uses that email." Nothing is sent. | FR-24 |

### Account

| State | Surface | Treatment | PRD |
|---|---|---|---|
| Wrong email or password | Sign in | "That email and password don't match." It doesn't say which one is wrong. | FR-1 |
| Email already in use | Sign up | "There's already a wallet with this email. Sign in instead?" | FR-1 |

### Empty states

| Surface | Treatment |
|---|---|
| Board (no offers) | The house row alone, and "No offers right now. The house rate is your fallback. Want a better rate? Post your own." |
| My offers | "You have no open offers." with **Post your own rate**. |
| Activity | "No activity yet." (→ Add money) |
| Notifications | "You're all caught up." |
| Price alerts | "No price alerts. Set one from the Exchange board." |
| Saved payout accounts | "No saved accounts. You can add one when you withdraw." |
| Home "In progress" | Hidden (see Component Patterns). |

## Interaction Primitives

- **Explicit confirm for every money movement.** No swipe-to-pay and no hold-to-confirm. One tap after the preview. The button then disables and shows a spinner until the server answers, so a double submit is impossible (NFR-2).
- **No optimistic updates for money.** Balances, buckets and statuses change only when the server confirms. Preferences (theme, direction) may update optimistically.
- **Live without motion.** Rates and rows update in place: no flashing, tickers or count-ups. `prefers-reduced-motion` is respected.
- **Touch-first on phones.** Primary actions are full-width bottom buttons. Sheets can be swiped down to dismiss, except while a confirm is in flight.
- **Overlays.** Modals stack at most one level deep. The only overlay that can sit above a sheet is the blocking stale-screen dialog (FR-17).
- **Copy affordances.** Codes and references have a Copy button, which shows "Copied" for 1.5s.
- **Keyboard on desktop.** Tab order follows reading order, `Enter` confirms the focused action, and `Esc` closes the topmost sheet or dialog. No custom shortcuts in the pilot.
- **Banned:** pull-to-refresh on the board (it's already live), infinite scroll in Activity (paginate in pages of 25 `[ASSUMPTION]`), hover-only affordances, and auto-take of any kind.

## Accessibility Floor

These are behavioural rules. Visual contrast lives in DESIGN.md.

- WCAG 2.2 AA across the app.
- **Live data stays readable.** The board isn't an `aria-live` region. A polite status message announces "Rates updated" at most every 10s. Lost-race, pause and stale-screen messages are announced assertively.
- **Lock countdown.** The 10s lock (FR-14) is the same for everyone. The accommodation for assistive-technology users who need more time is that expiry is free (see State Patterns → Lock expired). The lock is announced when the sheet opens ("Rate held for 10 seconds") and again at 3s.
- **Codes and references** are read character by character (an `aria-label` with spaces). The grouping spaces are never part of the copied or announced value.
- **Status is never colour-only.** Every pill has a text label and an icon.
- Touch targets are at least 44px, including the Held and Pending buttons on balance cards. Focus rings are always visible (`{colors.ring}`).
- The test-money banner sits in the page's `banner` landmark and is read once per page.
- Amounts are read with their currency ("one thousand US dollars"), never as a bare symbol.

## Responsive & Platform

| Breakpoint | Behaviour |
|---|---|
| `< md` (phones, primary) | Bottom tab bar. The exchange preview and Post an offer open as bottom drawers. Flows are full-screen. |
| `md` (768–1023px) | Same as phones, with content centred at `{spacing.content-max}`. |
| `≥ lg` (1024px+) | A left sidebar replaces the tabs. The exchange preview and Post an offer dock beside the board (layout in DESIGN.md → Layout & Spacing). Home shows the balance cards side by side, with "In progress" beside recent activity. |

Browser only. No native app and no PWA install in the pilot `[ASSUMPTION]`. Notifications are in-app only, through the bell and toasts (FR-25).

## Key Flows

Protagonists and steps for every flow mirror PRD §2.3 (UJ-1 to UJ-6).

### Flow 1: Lena collects USD cash in Miami (UJ-1)

1. Lena is in Berlin the night before her flight. She opens Home, and her USD balance card shows **$640.00 available**.
2. She taps **Withdraw**, picks **Cash** and enters **$300** from her USD balance.
3. The preview reads "You withdraw $300.00 · You collect $300.00 in cash · Cost $0.00 (0%)". She taps **Get code**.
4. The withdrawal code screen shows her code and "Valid until 21:10 tomorrow · 23h left". Her USD card now reads **$340.00 available · $300.00 pending**. → [mockups/withdrawal-code.html](mockups/withdrawal-code.html), [mockups/home.html](mockups/home.html)
5. In Miami she opens Home, where the code card leads "In progress". At the counter she shows the code and her ID.
6. **Climax:** the cashier pays out. Seconds later Lena's screen updates on its own. A toast reads "Cash collected: $300.00", the pending $300 disappears, and the Activity row shows **completed**. She never had to wonder where her $300 was.

*If it doesn't go to plan:*
- **Changes her mind →** she taps **Cancel** on the code screen and confirms with **Cancel code**. The app shows "$300 is back in available."
- **Never collects →** after 24h the card disappears, a toast says the code expired, and Activity shows **expired** with the money back in available.

### Flow 2: Marco tops up $800 in Munich (UJ-2)

1. Marco has just moved to Munich from the US. He opens **Add money** and enters **$800**, currency **USD**, method **Cash**.
2. The preview shows the cost ($0.00) and that the request is valid for 72h. He confirms. The deposit detail opens with his reference, "Show this reference at the counter", and **awaiting payment**. → [mockups/deposit-detail.html](mockups/deposit-detail.html)
3. At the cash partner, he hands over the cash, quotes the reference and photographs the receipt.
4. From Home "In progress" he opens the deposit, taps **Attach receipt**, adds the photo and the transaction number, and taps **Send receipt**. The status changes to **awaiting confirmation**.
5. **Climax:** the timeline moves to **completed** while he's still looking at it, and his USD card reads **$800.00 available**. At every step, the app showed exactly where his deposit was.

*If it doesn't go to plan:*
- **Never pays →** after 72h the request shows **expired** and leaves "In progress".
- **Only $750 arrives →** the request shows **mismatch** with "$750 received, expected $800" and **Claim $750**. One tap opens a pre-filled request that credits $750 straight away.
- **Forgot the reference →** after he attaches his receipt, the request shows it's being checked (see State Patterns → Reference forgotten).

### Flow 3: Jonas loses the race and still gets a good rate (UJ-3)

1. Jonas is in Hamburg, getting ready for a trip to El Salvador. He opens **Exchange**, switches to **EUR → USD** and types **$1,000** in **You get**.
2. The board shows two "Better than house" rows above the house rate. He taps the top one. → [mockups/quote-board.html](mockups/quote-board.html)
3. The preview reads "You pay €914.20 · You get $1,000.00 · Total cost €2.70 (0.30%). A typical bureau charges about €64." It's a fixed offer, so there's no timer. He taps **Confirm**.
4. The button spins, then the sheet reports "That offer was just taken. Nothing was charged." The next-best offer is already selected, with a fresh preview at €915.10.
5. **Climax:** Jonas taps **Confirm** once more, and the sheet changes to "Done: $1,000.00 is in your USD balance." Losing the race cost him one extra tap, and his rate was still better than the house rate.

### Flow 4: Aylin posts an offer and waits (UJ-4)

1. Aylin lives in the EU and is planning a trip to New York in six weeks. She opens **Exchange** on **EUR → USD**. The best rate isn't good enough, and she isn't in a hurry.
2. She taps **Post your own rate**, chooses **Pegged: market + 0.3%** and enters €1,500. The preview shows what she'd receive at today's rate and "€1,500 will be held while your offer is open."
3. She posts. Her EUR card now shows **€1,500 held**, and the board shows her row as "Your offer".
4. Two days later a toast reads "Your offer was filled: $640 of $1,630". My offers shows how much is left, still pegged at its live rate.
5. **Climax:** the next morning her offer fills completely. €1,500 has become $1,630 in her USD balance, nothing is held any more, and she never had to watch the screen.

### Flow 5: Sam settles a split bill (UJ-5, Should)

1. After dinner, Sam owes a friend €42. Sam opens **Send** and types the friend's email.
2. The app shows the friend's display name, "Pia Hoffmann", before anything else. Sam enters **€42** and sees "Instant and can't be undone."
3. **Climax:** Sam taps **Send**. Both wallets update instantly, and Sam holds the confirmation screen up for Pia to see across the table.

### Flow 6: Marco pays out EUR to his bank (UJ-6)

1. A month in, Marco holds €1,200 after exchanging. He opens **Withdraw**, picks **Bank payout** and enters **€500**.
2. It's his first payout, so he adds his German IBAN and account name and ticks **Save for next time**.
3. The preview reads "You withdraw €500.00 · Your bank receives €500.00 · Cost €0.00 (0%)". He confirms.
4. His EUR card shows **€700.00 available · €500.00 pending**, and Activity shows the payout as **pending**.
5. **Climax:** the next day a toast reads "€500.00 has reached your bank." The pending amount is gone, and the payout shows **completed**. He knew where his €500 was the whole time.

*If it doesn't go to plan:*
- **Bank rejects it (for example, a mistyped IBAN) →** the payout shows **rejected** with "The bank returned it. €500 is back in available." and a link to edit the saved account.

## Inspiration & Anti-patterns

- **Taken from Wise:** the guaranteed-rate countdown, and fees itemized before you commit (addendum, landscape research).
- **Taken from CurrencyFair:** you see the list of offers before posting your own rate (addendum).
- **Taken from modern neobanks:** big balance cards on Home with quick actions right below.
- **Rejected:** trading-app vocabulary and visuals (PRD §1, §7; see Voice and Tone), maker reputation badges (PRD §8.2), and celebratory savings copy (see Voice and Tone).
