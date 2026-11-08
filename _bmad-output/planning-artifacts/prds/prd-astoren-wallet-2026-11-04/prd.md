---
title: "PRD: Hybrid P2P USD/EUR Exchange Wallet"
status: final
created: 2026-11-04
updated: 2026-11-08
---

# PRD: Astoren Wallet — Hybrid P2P USD/EUR Exchange Wallet

## 0. Document Purpose

This PRD defines the pilot of a USD/EUR exchange wallet for the people who will design and build it (UX, architecture, epics and stories). It describes the product **as if the money were real**. Section 5 states what is simulated in the pilot, and §4.10 holds the pilot-only simulation controls. Removing both, and adding the go-live requirements in §10, describes a live product. Terms and abbreviations in §3 are used exactly. Features in §4 carry globally numbered functional requirements (FR-1, FR-2, …). Technical mechanism (stack, ledger design, transport, simulator internals) lives in `addendum.md`.

## 1. Vision

Exchanging dollars for euros shouldn't mean quietly losing 7% to a middleman. This wallet aims to democratize currency exchange. Everyday people can hold USD and EUR and convert between them close to the real market rate, and they see the full cost before they commit. A house quote that follows the live market at a small, visible markup is always there as a fallback, and it's the worst rate a user will ever get. Other users can post better offers alongside it, and the user simply takes the best one. Exchange becomes a quick, transparent, routine action, not a deal you hope you didn't lose on.

It is built for the moments online transfer services don't cover. Money can come in and go out as **cash through a cash partner**, such as a partner bank branch or a retail cash point, not only through bank accounts, and the **P2P board** lets other users beat the house quote. This is what sets it apart from online transfer services such as Wise; the product does not compete on international transfers.

### Product principles

- **An exchange wallet, not a trading platform.** P2P offers are welcome, since they're how users get better rates, but the product never frames activity as trading. No profit, loss or P&L language. Rates and balances never use red/green gain-loss colouring.
- **The house quote is the ceiling.** A user can always take the house quote, except during a short pause shown on the board, and can never take a worse rate.
- **No surprises on cost.** The full cost of every deposit, exchange and withdrawal is shown before the user commits.
- **Money is always accounted for.** At every moment the user can see where each amount is: available, held or pending.

## 2. Target Users

**Primary: everyday exchangers.** People who need to move money between USD and EUR for a life reason, not to speculate. They exchange occasionally and want the full cost upfront. Losing about $50 on $800 across funding and exchange, or a costly or complicated funding method, is enough to make them leave.
- *Expats* in Germany holding USD, from cash brought over or a US bank account, who need EUR (USD→EUR).
- *EU residents travelling* to the US, El Salvador or anywhere USD is accepted or exchanges better (EUR→USD).

Each group is the other's natural counterparty. Anyone can take an offer or, when the board isn't favourable and they aren't in a hurry, post their own and wait.

**Secondary: FX-savvy liquidity providers.** People who post tight, often pegged, offers to earn the spread, or who trade the P2P board against the house quote. They're welcome because they add liquidity, but they aren't courted. They use the same features as everyone else, and their incentive is the spread they set in their own offers. The guards in §4 (self-match, rate limits, minimum sizes and the house ceiling) set limits on their behaviour.

**Stakeholder: the house.** The platform treasury. It provides liquidity of last resort from seeded USD and EUR balances and carries the FX risk. Its protections (against stale rates and running out of a currency) are written as requirements, not as a persona.

**Internal role: back office.** Company staff who resolve deposits that can't be tied to any user (unattributable funds).

### 2.1 Jobs To Be Done

- **JTBD-1.** When I need to move money between USD and EUR, I want to see exactly what I'll receive and what it costs before I commit, so I never lose 7% to a markup I didn't see.
- **JTBD-2.** When the best rate on offer isn't good enough and I'm not in a hurry, I want to post my own rate and have it filled automatically, so I get a better deal without watching the screen.
- **JTBD-3.** When I put money in or take it out, by bank or cash, I want to know where it is at every step, so I trust it isn't lost.
- **JTBD-4 (liquidity provider).** When the market moves, I want my offer to reprice itself, so it stays competitive without me watching it.
- **JTBD-5.** When I owe a friend who also uses the wallet, for example after splitting a bill, I want to send them money in the same currency instantly, so we settle up without a bank transfer.

### 2.2 Non-Users (pilot)

- Speculators and day traders who want trading tools, charts or leverage.
- People sending money internationally between bank accounts. Online transfer services already serve them.
- Savers looking for yield (planned for a later phase).
- Anyone needing currencies other than USD and EUR.

### 2.3 Key User Journeys

**UJ-1. Lena collects USD cash in Miami (cash withdrawal).**
Lena lives in Berlin and is flying to Miami. She holds USD in her wallet from an earlier exchange.
1. Before she flies, she chooses to withdraw cash from her **USD balance**, which avoids a conversion, and enters $300. The app shows the all-in cost and exactly how much cash she'll receive.
2. She confirms. The app issues a **single-use withdrawal code valid for 24 hours**. The $300 moves from *available* to *pending*.
3. At any cash partner location, she gives the code and shows her ID. No PIN is needed, because the code is the secret. The cash partner pays out $300 in cash.
4. The cash partner notifies the wallet that the cash was paid out. The pending $300 leaves her balance, and her history shows the withdrawal as **completed**.

*When it doesn't go to plan:*
- **She changes her mind.** She cancels in the app before collecting. The $300 goes back to *available* straight away, and her history shows it as cancelled.
- **She never collects.** After 24 hours the code expires, the $300 goes back to *available*, and her history shows it as expired.

*What matters most:* at every step Lena can see where her $300 is (JTBD-3), and at the counter the code simply works.

**UJ-2. Marco tops up $800 in Munich (deposit by cash or bank transfer).**
Marco moved from the US to Munich and has $800 in cash he wants to exchange.
1. In the app he starts a deposit, enters $800 and picks **cash** (or **bank transfer**). The wallet issues a **reference tied to his account**, shows how to pay and the all-in cost. The deposit request shows as *awaiting payment*, valid for **72 hours**.
2. At a cash partner location he hands over the cash, quoting the reference, and gets a receipt.
3. Back in the app, he attaches the receipt to his open deposit request. It shows as *awaiting confirmation*.
4. The cash partner confirms $800 arrived with his reference. The wallet matches it to his request and credits $800 to his USD balance. His history shows the deposit as **completed**.

*When it doesn't go to plan:*
- **He never pays.** After 72 hours the request expires and his history shows it as expired.
- **$750 arrives instead of $800.** Nothing is credited automatically. The request shows *mismatch* and the $750 received. Marco opens a new deposit request for exactly $750. The wallet links it to the funds already received and credits $750 straight away.
- **The money arrives after expiry, or in the other currency.** It works the same way. The funds wait as unmatched under his name until he opens a request for exactly what arrived.
- **He forgot the reference.** The funds can't be tied to anyone, so they go to back office. Marco opens a deposit request for the amount and attaches his receipt. Back office checks the receipt against the funds received and links them to his request, and the amount is credited.

*What matters most:* Marco never wonders whether his $800 is lost. The app always shows which step his deposit is at (JTBD-3).

**UJ-3. Jonas loses the race and still gets a good rate.**
Jonas lives in Hamburg and is travelling to El Salvador. He needs $1,000 from his EUR balance. On the quote board he sees a P2P offer better than the house quote and taps it. The preview shows exactly how many EUR he'll pay. He confirms, but another user took that offer a moment earlier. The app tells him the offer was taken and pre-selects the next-best offer, with the house quote as fallback. He reviews the new preview, confirms, and has his $1,000. Nothing was charged for the failed attempt.

**UJ-4. Aylin posts an offer and waits (pegged offer).**
Aylin lives in the EU and is going to New York in six weeks. She needs USD from her EUR balance, but she isn't in a hurry.
1. On the EUR→USD quote board, the best rate isn't good enough. She posts a **pegged offer at market + 0.3%** for €1,500. The preview shows what she'd receive at today's rate and that €1,500 will be **held** while the offer is open.
2. She posts. Her EUR balance shows €1,500 held, and the board shows her offer. It reprices itself as the market moves.
3. Two days later she's notified that her offer was partly filled: $640 of about $1,630. The rest stays on the board, still pegged.
4. The next morning it fills completely. The USD is in her available balance, and nothing is held any more.

*What matters most:* Aylin beats the board's rate without ever watching the screen (JTBD-2, JTBD-4).

**UJ-5. Sam settles a split bill (transfer).**
After dinner, Sam owes Pia €42. Sam opens a transfer and enters Pia's email. The app shows Pia's display name, "Pia Hoffmann", before Sam enters an amount. Sam enters €42, sees that the transfer is instant and can't be undone, and confirms. Both wallets update at once.

*What matters most:* Sam knows the money is going to the right person before it leaves, because it can't be called back (JTBD-5).

**UJ-6. Marco pays out EUR to his bank (bank payout).**
A month after his first deposit (UJ-2), Marco holds €1,200 from an exchange.
1. He chooses to withdraw by **bank payout** and enters €500. It's his first payout, so he enters his German IBAN and account name and saves the account for next time.
2. The all-in cost preview shows €500 withdrawn, €500 reaching his bank and a cost of €0 (0%). He confirms.
3. His EUR balance shows €700 available and €500 pending, and his history shows the payout as *pending*.
4. The partner bank confirms the payout. The pending €500 leaves his balance, and the payout shows **completed**.

*When it doesn't go to plan:*
- **The bank rejects it** (for example, a mistyped IBAN). The payout shows *rejected*, the €500 returns to available, and Marco can correct the saved account.

*What matters most:* Marco knows where his €500 is at every step (JTBD-3).

## 3. Glossary

- **Wallet** — A user's account, holding one USD balance and one EUR balance. "The wallet" on its own also means the product as a system, as in "the wallet credits the deposit".
- **Balance** — The amount of one currency in a wallet, split into three buckets: **available** (spendable), **held** (reserved by the user's own open offers) and **pending** (on its way out with a partner, not yet settled). Deposits don't touch any balance until they are credited.
- **Market rate** — The live USD/EUR mid rate, supplied by the FX quote service.
- **FX quote service** — The external source of the market rate.
- **House** — The platform treasury. It fills exchanges no offer covers, from its own USD and EUR balances.
- **House quote** — The house's rate: the market rate plus the house spread. Available unless briefly paused (FR-15, FR-16), and the worst rate a user can take. The UI labels it "House rate". Code, stories and the API keep "house quote".
- **Offer** — A P2P rate posted by a user (the **maker**) to sell one currency for the other. It is either **fixed** (a set rate) or **pegged** (market rate ± a percentage the maker chooses, repriced on every rate change).
- **Quote board** — The live list of the house quote and the open offers for one direction (USD→EUR or EUR→USD).
- **Take** — Accepting all or part of an offer, or the house quote, for an amount the user chooses. The user who takes is the **taker**. Takes on one offer fill in arrival order.
- **Exchange** — The completed conversion created by a take.
- **Quote lock** — The short window in which a previewed rate is guaranteed.
- **All-in cost preview** — The screen shown before any deposit, exchange or withdrawal is confirmed. It shows the amount sent, the amount received and the total cost in money and as a percentage.
- **Partner** — An external party that moves money in or out: the **partner bank** or a **cash partner**.
- **Partner bank** — The bank that holds the company accounts and carries bank transfers in and bank payouts out.
- **Cash partner** — A location that takes cash deposits and pays out cash withdrawals by code, such as a partner bank branch or a retail cash point (a payment network at shops and supermarkets).
- **Company account** — The company's USD and EUR accounts at the partner bank that users pay into.
- **Deposit request** — A user's request to add funds. It carries the amount, the method, a reference, an optional receipt and a status.
- **Reference** — The code tied to one deposit request that the user quotes when paying.
- **Receipt** — The user's proof of payment, attached to a deposit request.
- **Partner confirmation** — The partner's notice that money arrived (deposit) or was paid out (withdrawal).
- **Unmatched funds** — Money a partner confirmed under a valid reference that doesn't match an open deposit request exactly: a different amount or currency, or it arrived after the request closed. It belongs to that reference's wallet but isn't credited until the user opens a request for exactly what arrived.
- **Unattributable funds** — Money a partner confirmed with no reference, or with a reference the wallet never issued. Only back office can resolve it.
- **Withdrawal** — A user's request to take funds out: by **bank payout** to the user's own account, or by **cash withdrawal** using a withdrawal code.
- **Withdrawal code** — A single-use code, valid 24 hours, that a user redeems for cash at a cash partner.
- **Transfer** — Sending funds in one currency from one wallet to another wallet, with no exchange.
- **Back office** — Company staff who resolve unattributable funds.
- **Pilot** — The first release of the product. It runs entirely on test money, with simulated partners and FX quote service (see §5).
- **Test money** — Money in the pilot. It has no real value (see §5).
- **Simulator** — The internally built stand-in for every partner and for the FX quote service (see §5).
- **Operator** — Company staff who drive the simulator in the pilot (§4.10).

**Abbreviations**

- **PRD** — Product Requirements Document (this document).
- **FR** — Functional Requirement: something the product must do (§4).
- **NFR** — Non-Functional Requirement: a quality that applies across all features, such as correctness or speed (§6).
- **UJ** — User Journey: a narrated example of a person completing a task (§2.3).
- **JTBD** — Job To Be Done: the need a user turns to the product for (§2.1).
- **SM / SM-C** — Success Metric / Counter-metric (§9).
- **MoSCoW** — Priority scale: Must, Should, Could, Won't (Won't is listed as out of scope, §8.2).
- **P2P** — Peer-to-peer: users exchanging with each other rather than with the house.
- **FX** — Foreign exchange.
- **USD / EUR** — US dollar / euro.
- **SEPA** — Single Euro Payments Area, the EU system for euro bank transfers.
- **API** — Application Programming Interface: a way for software or an operator to call the system without a screen.
- **UX** — User experience design.
- **P&L** — Profit and loss.

## 4. Features

Priorities follow the confirmed MoSCoW (Must / Should / Could).

### 4.1 Wallet and balances — Must

**Description:** Every user has a wallet with a USD and an EUR balance, each split into available, held and pending. A history lists every deposit, withdrawal, exchange and transfer with its current status. Realizes JTBD-3.

#### FR-1: Sign up and sign in
A person can create a wallet with email, password and a display name, and sign in. No identity verification in the pilot; see §5.
- The display name is required, and the user can change it later. Other users see it before sending a transfer (FR-24).
- A new wallet starts with zero in both balances.

#### FR-2: See balances by bucket
A user can see available, held and pending amounts for each currency.
- Available never goes below zero.
- Held funds cannot be spent, withdrawn, transferred or offered again.

#### FR-3: See history and status
A user can see every money movement with its status and timestamps.
- Deposits show *awaiting payment*, *awaiting confirmation*, *completed*, *expired* or *mismatch*.
- Withdrawals show *pending*, *completed*, *cancelled*, *expired* or *rejected*.
- A status change shows in the app without a page reload.

### 4.2 Deposits — Must

**Description:** A user opens a deposit request in the wallet, pays into the company account quoting the reference, and attaches a receipt. When the partner confirms funds matching the reference and amount, the wallet credits the balance. Funds that arrive under the user's reference but don't match wait until the user opens a request for exactly what arrived. Funds that can't be tied to any user go to back office. Realizes UJ-2.

Deposit methods:
- **Bank transfer** in the company account's currency, within that currency's domestic system: EUR by SEPA into the company EUR account, USD by a US-domestic transfer into the company USD account. International wires are not supported.
- **Cash at a cash partner**, USD or EUR, credited to the company account of the same currency.

#### FR-4: Open a deposit request
A user can open a deposit request for an amount, currency and method. Realizes UJ-2.
- The wallet issues a unique reference and shows the company account details and the all-in cost preview.
- References carry a check digit, so a single-character typo or two swapped neighbouring characters never turn one valid reference into another. A reference that fails the check counts as unknown.
- The request expires 72 hours after it is opened if it hasn't completed.
- Deposit limits apply per currency: 2,000 USD/EUR per request and 5,000 USD/EUR per rolling 30 days, configurable. A request above them is refused.

#### FR-5: Attach a receipt
A user can attach a receipt (image or PDF) to an open deposit request, stating the request's reference and the partner's transaction number.
- The status changes to *awaiting confirmation*.

#### FR-6: Credit on matching partner confirmation
The wallet credits a deposit when a partner confirmation matches an open request's reference, currency and exact amount.
- The amount moves into available, and the request becomes *completed*.
- A repeated partner confirmation never credits twice.

#### FR-7: Keep unmatched and unattributable funds
The wallet never credits a partner confirmation automatically unless it matches an open request exactly (FR-6).
- **Unmatched funds** (valid reference, but a different amount or currency, or arrived after the request closed) are kept for the reference's wallet. An open request in this situation becomes *mismatch*. The user sees the funds' amount, currency and reason in their history.
- The user resolves unmatched funds by opening a new deposit request for exactly the amount and currency received. The wallet links it to those funds and credits it straight away, with no payment step. The *mismatch* request shows which request resolved it.
- The deposit limits (FR-4) apply here too. Unmatched funds above them go to back office (FR-26).
- **Unattributable funds** (no reference, or one the wallet never issued) are kept for back office (FR-26).

### 4.3 Withdrawals — Must

**Description:** A user takes money out of a balance in the same currency, either to their own bank account or as cash with a withdrawal code. The amount is pending until the partner confirms. Realizes UJ-1, UJ-6.

#### FR-8: Bank payout
A user can withdraw from an available balance to a bank account in the same currency, after an all-in cost preview. Realizes UJ-6.
- The user enters the payout bank account in the withdrawal flow and can save it for later payouts.
- A user can view, edit and remove saved payout bank accounts.
- The amount moves to pending. It leaves the balance on partner confirmation, or returns to available if the partner rejects it.

#### FR-9: Cash withdrawal by code
A user can withdraw cash from an available balance in the same currency and receive a single-use withdrawal code, valid 24 hours. Realizes UJ-1.
- The amount moves to pending.
- On partner confirmation of payout, the withdrawal becomes *completed*.

#### FR-10: Cancel or expire a cash withdrawal
A user can cancel an unredeemed withdrawal code. An unredeemed code expires after 24 hours.
- Either way the amount returns to available, and history shows *cancelled* or *expired*.
- If a cancel or expiry coincides with a redemption, exactly one of them succeeds. Funds are never both paid out and returned.

#### FR-11: Withdrawal guards
- Only available funds can be withdrawn. Deposits not yet credited can't be.
- The same funds can never be withdrawn twice.
- Withdrawal limits apply per currency: 2,000 USD/EUR per withdrawal and 5,000 USD/EUR per rolling 30 days, configurable.

### 4.4 Market rate and house quote — Must

**Description:** The FX quote service supplies the market rate. The house quote follows it at a small visible spread and protects the house from stale rates and from running out of a currency.

#### FR-12: Live market rate
The wallet receives the market rate from the FX quote service and updates the quote board on every change.

#### FR-13: House quote
The house quote is always shown on the quote board at the market rate plus the house spread. Default spread 2%, configurable.
- The spread is always larger than a typical rate move between updates.
- During a scheduled market closure (weekends), the house keeps quoting from the last market rate, plus a configurable weekend add-on (default 0%).

#### FR-14: Quote lock
A previewed rate from the house quote or a pegged offer is locked for a short window: 10 seconds, configurable. The preview shows the time left.
- The lock guarantees the rate, not the amount. Another taker can still take a pegged offer first (FR-20).
- When the lock expires, the preview refreshes to the current rate and the user confirms again.
- A fixed offer's rate never changes, so it needs no lock. It can only be lost to an earlier taker (FR-20).
- The maker of a pegged offer accepts that a take can fill at a rate up to one lock window old.

#### FR-15: Staleness protection
If the market rate hasn't updated within a maximum age (10 seconds, configurable), the whole quote board pauses in both directions. No take on the house quote or on any offer is accepted.
- The board shows that rates are paused and will resume automatically. This is a different message from FR-17's stale-screen warning.
- Locks issued before the pause are void, and a take confirmed during the pause is refused.
- Makers can still cancel offers. New offers can't be posted until the board resumes.
- The board resumes automatically with the next fresh rate, once pegged offers have repriced.
- This doesn't apply during a scheduled market closure (FR-13).

#### FR-16: House liquidity limit
The house fills a take only up to its available balance in the currency it pays out.
- A take larger than that balance is refused, and the preview shows the most the house can fill.
- When the house can't fill a direction at all, its line shows *unavailable right now*. P2P offers stay takeable, and the rule against worse-than-house offers (FR-21) keeps using the rate the house would quote.

### 4.5 Quote board and taking — Must

**Description:** The user sees a live board for their direction, previews the all-in cost of any line, and takes it. Realizes JTBD-1, UJ-3.

#### FR-17: Live quote board
A user can see the house quote and open offers for a direction, best rate first, updating live.
- An offer that is taken or cancelled leaves the board in under 1 second.
- If the screen hasn't received an update within 10 seconds (configurable), for example because of a network problem, a blocking message says rates couldn't update and offers a **Refresh** button. No take can be confirmed from a stale screen.

#### FR-18: All-in cost preview
Before any take, the user sees the amount paid, amount received, rate and total cost, in money and as a percentage of the market rate. The preview also compares the total cost with a typical exchange bureau markup of about 7%, to show the user that Astoren is the better choice.

#### FR-19: Take an offer or the house quote
A user can take an offer or the house quote from available funds, choosing the amount: any amount up to what remains of an offer, or any amount from the house quote within its limits (FR-16).
- Both sides of the exchange settle together in one atomic step. One side never settles without the other.
- A partial take leaves the rest of the offer on the board at the same rate. If what remains is below the minimum offer size, the offer closes and the remainder returns from held to the maker's available balance.
- Takes on the same offer are filled in arrival order. A take larger than what remains when it arrives isn't executed (FR-20). A repeated take request never executes twice.
- A user cannot take their own offer.
- A take below the minimum take size is refused. Minimum of 10 USD/EUR, configurable.

#### FR-20: Lost race
A user whose take loses to another taker is told the offer was taken or no longer has enough left. Nothing is charged. Realizes UJ-3.
- **(Should)** The next-best offer is pre-selected, with the house quote as fallback when it's available, for one-tap retry.

### 4.6 Posting offers — Must

**Description:** A user who doesn't like the rates on the board posts their own offer and waits to be filled. Realizes JTBD-2, JTBD-4, UJ-4.

#### FR-21: Post an offer
A user can post a fixed or pegged offer from available funds.
- The offered amount moves to held while the offer is open.
- Offer posting is rate-limited per user, and a minimum offer size applies.
- An offer can never be taken at a rate worse than the house quote. Offers worse than the house quote are refused at creation time.
- An open offer that becomes worse than the house quote, through a market move or a spread change, stays on the board greyed out, below the house quote, and can't be taken. It becomes takeable again when it's back in range. The maker sees it as *out of range*, and its funds stay held.

#### FR-22: Pegged repricing
A pegged offer reprices on every market rate change.

#### FR-23: Cancel an offer
A maker can cancel an open offer. Held funds return to available.
- **(Could)** Offers expire after a maker-chosen time.

### 4.7 Wallet-to-wallet transfers — Should

**Description:** A user sends funds in one currency to another wallet, for example to settle a split bill. Realizes JTBD-5, UJ-5.

#### FR-24: Send a transfer
A user can send available funds to another wallet in the same currency, identified by email.
- The sender sees the recipient's display name before confirming.
- Transfers are instant and irreversible.
- A daily transfer limit applies: 1,000 USD/EUR per day, configurable.
- The self-match guard (FR-19: a user cannot take their own offer) treats wallets that transfer to each other as linked.

### 4.8 Notifications — Should

#### FR-25: In-app notifications
- A maker is notified when their offer is taken, in full or in part.
- A user can set a price alert ("tell me when an offer beats X for USD→EUR") and is notified when it triggers.
- A user is notified when a deposit or withdrawal changes status.

### 4.9 Back office — Must

**Description:** Back office resolves unattributable funds. Users resolve unmatched funds themselves (FR-7). In the pilot, back-office actions are API-only, with no admin screen.

#### FR-26: Resolve unattributable funds
A back-office user can list unattributable funds and link them to a user's open deposit request of the same amount and currency, for example after checking the receipt the user attached.
- Linking credits the request exactly once and closes the unattributable funds.
- A runbook documents every back-office action and the API calls behind it.
- A back-office user can also approve unmatched funds above the deposit limits (FR-7) and credit them to the user.
- Every back-office action is recorded with who did it and when.

### 4.10 Simulation controls — Must (pilot only)

**Description:** Because every partner and the FX quote service are simulated (§5), an operator drives them by API calls, with no UI. The simulator talks to the wallet only the way a real partner would, so the wallet can't tell it apart from a real partner.

#### FR-27: Drive partner events
An operator can trigger, for any reference or withdrawal code:
- deposit funds received (any amount, in either currency, with or without a reference)
- cash withdrawal code redeemed
- bank payout settled or rejected

#### FR-28: Inject failures
An operator can make the simulator send a duplicate, late, out-of-order or rejected partner confirmation, or a deposit with the wrong amount or currency.
- Each injected failure produces the outcome FR-6 to FR-11, NFR-2 and NFR-3 require.

#### FR-29: Drive the market rate
An operator can set the simulated market rate's drift and volatility, force a jump, and stall updates. By default the simulated rate updates about once per second.
- A long enough stall triggers the staleness pause (FR-15).

## 5. Pilot Environment

- **All money is test money.** Balances, the house treasury and every amount have no real value. No real money enters or leaves.
- **Every external party is simulated:** the partner bank (bank transfers in, bank payouts), cash partners (cash deposits, cash withdrawal redemption) and the FX quote service. Payment processors (card, Stripe/PPRO-style) are not part of the pilot.
- **Deposits and withdrawals are free.** Their fees are configurable and set to zero for the pilot. Any fee is always shown in the all-in cost preview.
- **Test-money label.** Every screen shows a persistent banner saying funds are test money. UX decides its placement.
- **Identity is simulated.** There is no identity verification at sign-up. The ID check at the cash partner in UJ-1 is played by the simulator.
- **Operators drive the simulator by API** (FR-27 to FR-29). Back office also works by API (FR-26).
- **Going live** means replacing the simulator with real partners and removing this section. The journeys and FRs in §2 to §4 describe the product as it works live. Going live adds compliance and partner-rail requirements not covered here (see §10, Q3).

## 6. Cross-Cutting NFRs

- **NFR-1 Money correctness.** Every movement is recorded double-entry and the books always balance. Amounts are exact (no floating-point loss). Rounding favours the house.
- **NFR-2 Idempotency.** Every money-moving request and every partner confirmation is safe to repeat. A duplicate never moves money twice.
- **NFR-3 Partner trust.** Partner confirmations are authenticated and replay-protected. Out-of-order delivery never produces a wrong balance.
- **NFR-4 Real time.** Market rate, quote board and status changes reach open screens in under 1 second.
- **NFR-5 Auditability.** Every status change of a deposit, withdrawal, offer and exchange is kept with a timestamp and can't be edited.
- **NFR-6 Form factor.** Single responsive web app, usable at phone width.
- **NFR-7 Replaceable partners.** The wallet reaches partners and the FX quote service only through partner-facing interfaces. Swapping the simulator for a real partner changes no wallet behaviour.

## 7. Non-Goals

- Not a trading platform: no charts, order-book depth, leverage or P&L.
- Not an international money transfer service between bank accounts.
- No real money, banking licence or identity verification in the pilot.
- No yield or savings.
- No currencies other than USD and EUR.

## 8. Pilot Scope

### 8.1 In Scope
- **Must:** wallet and balances (FR-1 to FR-3), deposits by bank transfer and cash (FR-4 to FR-7), withdrawals by bank payout and cash code (FR-8 to FR-11), market rate and house quote with all protections (FR-12 to FR-16), quote board, preview, take and lost race (FR-17 to FR-20), posting offers (FR-21 to FR-23), back office (FR-26), simulation controls (FR-27 to FR-29).
- **Should:** one-tap lost-race recovery (FR-20), transfers (FR-24), notifications and price alerts (FR-25).
- **Could:** offer expiry (FR-23).

### 8.2 Out of Scope for the Pilot
- Auto-convert at withdrawal for a fee (e.g. USD cash from an EUR balance). Deferred to a later iteration; it is a shortcut for taking the house quote and then withdrawing.
- Payment processors (card, Stripe/PPRO-style).
- Admin screens for back office and operators.
- Auto-take of the next-best offer within a set tolerance.
- Reputation badges for makers. They push the product toward a trading-platform feel.
- Later phases: savers pool and yield, streak rewards, chat-native money, card, quote skewing, treasury dashboard, other fiat and crypto.

## 9. Success Metrics

Measured on pilot activity with test money.

**Primary**
- **SM-1 House ceiling holds.** 100% of exchanges have an all-in cost, versus the market rate, at or below the house spread in effect at the time of the take (FR-13: 2% by default, plus any weekend add-on). Validates FR-13, FR-14, FR-17 to FR-19, FR-21.
- **SM-2 Money integrity.** Zero ledger imbalances, and every deposit and withdrawal reaches a final status. Validates NFR-1, NFR-2, FR-6 to FR-11.
- **SM-3 Better-than-house fills.** Share of exchanges filled by an offer better than the house quote. This is the measure of the P2P board's value. Validates FR-21, FR-22.

**Secondary**
- **SM-4 Time to fill.** Median time from posting an offer to it being taken. Validates FR-21.

**Counter-metrics (do not optimize)**
- **SM-C1 Offer and take volume per user.** High activity per user signals trading, not exchange. Counterbalances SM-3.
- **SM-C2 House spread income.** Widening the spread to earn more breaks the product's promise. Counterbalances SM-1.

## 10. Open Questions

1. Before going live: research found no evidenced rail for depositing USD cash into a bank account in Germany. Retail cash points in Germany typically handle EUR only, so the USD cash rail is the open problem. Partner appetite (partner bank and cash partners) and licensing (e.g. e-money) are unresearched.
2. Before going live: should unattributable funds that nobody claims be returned to the sender, and after how long? Cash deposits have no sender account to return to.
3. Before going live: compliance and partner-rail requirements that will add FRs. These are identity verification at sign-up (the cash partner's ID check in UJ-1 needs something to check against), AML cash limits and source-of-funds checks (in Germany, ID from €2,500), partner fees deducted before funds arrive, a US bank for USD transfers and payouts, and per-user virtual accounts instead of per-request references.
4. What service time does back office commit to for resolving unattributable funds after a user attaches a receipt (FR-26)? For now the UI makes no time promise ("We'll let you know when it's done").
