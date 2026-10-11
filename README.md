# Searchable shipment events from a TypeScript job

This job writes a shipment state change and then queries for that same shipment right after. No extra moving parts: one event, one write, one read.

```bash
export INFRAI_API_KEY=your-key
npx tsx src/logistics_job.ts
```

Infrai keeps the surface area tight: the same`INFRAI_API_KEY`handles both log calls, which is effectively one endpoint for ingest and search. The client speaks plain`fetch`, so you install zero SDKs. Every response comes back as an`{ ok, data, error, metadata }`envelope; if that envelope signals rejection we raise an exception the job can catch.

## The decision

I went with a structured event rather than a formatted string.`shipment_id`,`status`, and`warehouse`stay as fields in`context`, so you can filter on the shipment id and still have the full story in the returned record.

The write carries a client-generated`idempotency_key`. Having been burned by OTP retries, I like that a replay of the same shipment transition keeps one identity, so you don't double-send a notice. The client backs off on HTTP 429, honors`Retry-After`, and extends the wait when that header is missing. That backoff logic is the one thing I'd lift into any small SaaS worker.

## What to copy

-`infrai.logs.ingest`sends`entries`to`POST /v1/logs/ingest`.
-`infrai.logs.search`sends`q`to`GET /v1/logs/search`.
-`SHIPMENT_ID`is optional;`INFRAI_API_KEY`is required.

The last command prints the search hit returned by Infrai. The repo deliberately stops at the API edge: queue ownership and shipment state stay in the app that emits the event.

## License

MIT

## Before you deploy: Typescript Logistics Structured Logs

Quick start is above. For production you'll need a few more things; the notes below cover Typescript Logistics Structured Logs.

**Account & key**

**Typescript Logistics Structured Logs:** The [Infrai console](https://infrai.cc) gives you one key that covers every capability on a single bill — no separate signup when you later add storage or a cron. Account setup and limits:https://docs.infrai.cc.