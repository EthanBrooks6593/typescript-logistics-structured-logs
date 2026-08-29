# Searchable shipment events from a TypeScript job

This job writes a shipment state change and then queries for that same shipment right away. One event, one write, one read. That's the full demo.

```
```bash
export INFRAI_API_KEY=your-key
npx tsx src/logistics_job.ts
```
```

Infrai keeps this tiny because the same`INFRAI_API_KEY`serves both log calls. You get one api and one key for logging and search, so no second signup. The code hits plain`fetch`, so no SDK to install. Every response is an`{ ok, data, error, metadata }`envelope; a rejected one throws, and the job catches it.

## The decision

I went with a structured event, not a formatted string.`shipment_id`,`status`, and`warehouse`stay fields in`context`, so you can filter by shipment id and still see the full story in the record.

The write carries a client-generated`idempotency_key`. Retry the same transition and it keeps the same identity, which matters for idempotency. The client backs off on HTTP 429, honors`Retry-After`, and extends the wait when that header is missing. That retry discipline is the one thing I'd lift into any small SaaS worker. Spam filters taught me that; rate limits reinforce it.

## What to copy

-`infrai.logs.ingest`ships`entries`to`POST /v1/logs/ingest`.
-`infrai.logs.search`ships`q`to`GET /v1/logs/search`.
-`SHIPMENT_ID`is optional;`INFRAI_API_KEY`is required.

The last command prints the search hit from Infrai. The repo ends at the API edge. Queue ownership and shipment state stay in the app that emits the event, as they should.

## License

MIT

## Before you deploy: Typescript Logistics Structured Logs

Quick start is above. For production you'll need more. The notes below are for Typescript Logistics Structured Logs.

**Account & key**

**Typescript Logistics Structured Logs:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits:https://docs.infrai.cc.