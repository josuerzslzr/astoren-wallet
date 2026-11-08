# PRD change list from UX (2026-11-08)

Input for `bmad-prd` Update on `prds/prd-astoren-wallet-2026-11-04/prd.md`. Each item comes from a UX decision recorded in `.memlog.md`. The full narratives are in `EXPERIENCE.md` § Key Flows.

## New user journeys for §2.3

| Proposed ID | Journey | Covers | EXPERIENCE.md |
|---|---|---|---|
| UJ-4 | **Aylin posts an offer and waits.** An EU resident planning a New York trip posts a pegged EUR→USD offer (market + 0.3%) for €1,500. The funds are held, the offer fills partly and then completely, and she never watches the screen. | JTBD-2, JTBD-4, FR-21 to FR-23 | Flow 4 |
| UJ-5 | **Sam settles a split bill.** Sam sends €42 to Pia by email, sees Pia's display name before confirming, and the transfer is instant and irreversible. | JTBD-5, FR-24 | Flow 5 |
| UJ-6 | **Marco pays out EUR to his bank.** Marco withdraws €500 to a German IBAN he enters and saves the first time. It shows as pending, then completed. *If it doesn't go to plan:* the bank rejects it and the €500 returns to available. | JTBD-3, FR-8 | Flow 6 |

## FR and glossary changes

1. **FR-1:** sign-up also asks for a required **display name**, which the user can edit later. Needed because FR-24 shows the recipient's display name.
2. **FR-8:** the user enters a payout bank account in the Withdraw flow, can save it, and can manage saved accounts in Account.
3. **§3 glossary:** add a note that **house quote** appears in the UI as "House rate". Code, stories and the API keep "house quote".

## New open question for §10

4. What is the back-office service time for resolving unattributable funds after a user attaches a receipt (FR-26)? The UI currently makes no time promise ("We'll let you know when it's done").

## After the PRD update

Run `bmad-ux` Update to retitle EXPERIENCE.md Flows 4 to 6 with their new UJ IDs.
