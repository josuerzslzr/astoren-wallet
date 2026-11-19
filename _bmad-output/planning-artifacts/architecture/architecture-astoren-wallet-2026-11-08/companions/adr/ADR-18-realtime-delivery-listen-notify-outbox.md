# ADR-18: Real-time delivery via Postgres LISTEN/NOTIFY and the outbox (Redis deferred)

- **Status:** Accepted, 2026-11-19
- **Spine rules:** [AD-18](../../ARCHITECTURE-SPINE.md#ad-18--market-rate-ingestion-and-real-time-delivery-adopted) and [AD-33](../../ARCHITECTURE-SPINE.md#ad-33--outbox-delivery-adopted); related AD-19, AD-22, AD-32
- **Binds:** wallet-worker, wallet-api WS gateway, exchange, platform, every outbox consumer, web client; FR-12, FR-15, FR-17, FR-22, FR-25, NFR-4

## Context

The board must feel live: NFR-4 asks for real-time updates under one second (the spine budgets p95 < 500 ms from commit to screen). Rates arrive from the FX feed, offers change when users post, cancel or take, and balances change on every money move. Meanwhile:

- `wallet-api` runs as **N instances**; a user's socket is connected to only one of them, but the change may happen on another instance or in the worker.
- Events must never be published for work that rolled back, and must not be lost if a process crashes right after commit.
- All instances must agree on whether the board is paused because the rate is stale (FR-15).

Terms: **LISTEN/NOTIFY** is PostgreSQL's built-in signal; **outbox** is a table of events written in the same transaction as the change; **fan-out** is getting one event to every instance that has interested sockets.

## Options considered

| Option | Pros | Cons |
| --- | --- | --- |
| Browser queries FX per request | Simple | Latency, quotas, and FR-15 pauses become impossible to coordinate. **Rejected**: only the backend reads the feed |
| Every api instance subscribes to the FX feed | No extra hop | N feed connections; instances can disagree on pause. **Rejected** |
| api instances poll the market rate row | Simple | Adds latency and DB load. **Rejected** |
| **Worker ingests feed, upserts one row, NOTIFY; outbox + NOTIFY for events; each instance LISTENs** (chosen, user "option C") | No new infrastructure; DB stays the truth; all instances read the same row | NOTIFY is not durable, so instances must re-read on reconnect; one dedicated connection per instance |
| Redis (Socket.IO Redis adapter) as fan-out bus | Purpose-built fan-out; could host the worker leader lock | Another stateful system to run and pay for. **Deferred** |
| Outbox relay with a high-water cursor | Simple | Skips rows that commit late with a lower sequence. **Rejected**: `FOR UPDATE SKIP LOCKED` on unpublished rows |
| Event payloads inside `NOTIFY` | One less read | Size limits; NOTIFY is not durable. **Rejected**: NOTIFY carries ids only |

## Decision

**Market rate (AD-18).** Only `wallet-worker` subscribes to the FX feed; it upserts the pair's market rate row and `NOTIFY`s. Every `wallet-api` instance `LISTEN`s on **one dedicated direct connection** (never through a transaction-mode pooler), keeps the latest state in memory **for pushes and previews only, never for decisions**, and re-reads it after any reconnect.

**WebSocket.** socket.io, websocket transport only. Rooms: `board:<pair>:<direction>` and one per authenticated user; clients never name a user room. The gateway pushes a full board snapshot (from `computeBoard`) per direction on every tick and offer event, with per-socket takeable flags, and a `board.state` frame (`live | paused | closed`, server time) at least every 3 s. On every (re)connect the server sends a session snapshot (balances, board state, unread count) and the client invalidates its cached queries. Ingress idle timeout exceeds twice the socket.io ping interval.

**Outbox (AD-33).** Rows carry `id`, `seq`, `type`, `payload`, `correlation_id`, `published_at`. The producing transaction issues `pg_notify('outbox_wake', '')` so the relay wakes at commit (polling is a fallback). The worker relay selects unpublished rows `ORDER BY seq FOR UPDATE SKIP LOCKED`, dispatches to consumers registered in `platform`, issues outbound partner commands, then sets `published_at`. Delivery is **at-least-once**; a consumer that writes runs under `CommandExecutor` with dedupe identity `(consumer_name, outbox_id)`, so a redelivery is a no-op. User, board and cache-refresh events reach instances via `NOTIFY wallet_events, '<outbox id>'`; each instance fetches the row by id and emits it. **Payloads never travel in `NOTIFY`.**

## Consequences

**Positive**
- No extra infrastructure in the pilot; Postgres is both the truth and the doorbell.
- Events exist only for committed work and survive crashes (outbox).
- All instances judge staleness from the same DB row, so pause is global.

**Negative**
- One long-lived Postgres connection per api instance, outside any pooler.
- A missed NOTIFY is possible (not durable); correctness relies on re-reading state and the session snapshot on reconnect, and on event `version` checks in the client (AD-22).
- Consumers must be idempotent; at-least-once means duplicates happen.
- The worker is a single instance; if it stops, ticks stop and the board pauses (fail-safe, AD-19).

**Follow-ups and revisit triggers**
- **Redis as fan-out bus / lock host** (Deferred): revisit when NOTIFY throughput or connection limits bite, or when worker HA is designed.
- **Worker high availability** via advisory-lock leader election (Deferred): revisit when downtime becomes unacceptable.
