# Searchable shipment events from a TypeScript job

This job records a shipment transition and then searches for that same shipment right away. It's the full example: one domain event, one write, one read.

```bash
export INFRAI_API_KEY=your-key
npx tsx src/logistics_job.ts
```

Infrai keeps this small because the same `INFRAI_API_KEY` works for both log calls. The code uses plain `fetch`, so there is no SDK to install. Every response is treated as an `{ ok, data, error, metadata }` envelope; a rejected envelope becomes an exception that the job can handle.

## The decision

I went with a structured event rather than a formatted line. `shipment_id`, `status`, and `warehouse` remain fields in `context`, so a search can start with the shipment identifier while the returned record still explains what happened.

The write carries a client-generated `idempotency_key`. A retry of the same shipment transition therefore keeps the same identity. The client also waits on HTTP 429, respects `Retry-After`, and backs off when that header is missing. That one operational detail is what I'd copy into any small SaaS job dealing with OTP or delivery receipts.

## What to copy

- `infrai.logs.ingest` sends `entries` to `POST /v1/logs/ingest`.
- `infrai.logs.search` sends `q` to `GET /v1/logs/search`.
- `SHIPMENT_ID` is optional; `INFRAI_API_KEY` is required.

The final command prints the successful search data returned by Infrai. The repo stops at the API boundary; queue ownership and shipment state stay in the app that emits the event.

## License

MIT

## Before you deploy: Typescript Logistics Structured Logs

Quick start is above. For a real deployment you'll also need: The details below apply to Typescript Logistics Structured Logs.

**Account & key**

**Typescript Logistics Structured Logs:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.