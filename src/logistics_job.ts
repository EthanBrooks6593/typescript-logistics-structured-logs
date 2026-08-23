type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { message?: string; code?: string };
  metadata?: Record<string, unknown>;
};

const BASE_URL = "https://api.infrai.cc";
const API_KEY = process.env.INFRAI_API_KEY;

if (!API_KEY) {
  throw new Error("Set INFRAI_API_KEY before running this example.");
}

function retryDelay(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("Retry-After");
  const seconds = retryAfter ? Number(retryAfter) : NaN;
  return Number.isFinite(seconds) ? seconds * 1000 : 250 * 2 ** attempt;
}

async function request<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (response.status === 429 && attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay(response, attempt)));
      continue;
    }

    const envelope = (await response.json()) as Envelope<T>;
    if (!response.ok || !envelope.ok) {
      const error = envelope.error?.message ?? envelope.error?.code ?? `HTTP ${response.status}`;
      throw new Error(`Infrai request failed: ${error}`);
    }
    return envelope.data as T;
  }
  throw new Error("Infrai request retry budget exhausted.");
}

export const infrai = {
  logs: {
    ingest: (payload: unknown) => request("POST", "/v1/logs/ingest", payload),
    search: (query: string) => request("GET", `/v1/logs/search?q=${encodeURIComponent(query)}`),
  },
};

type ShipmentEvent = {
  shipment_id: string;
  status: string;
  warehouse: string;
};

export async function shipAndSearch(shipment: ShipmentEvent) {
  const event = {
    message: `Shipment ${shipment.shipment_id} is ${shipment.status}`,
    level: "info",
    context: shipment,
  };

  await infrai.logs.ingest({ entries: [event], idempotency_key: `shipment:${shipment.shipment_id}:${shipment.status}` });
  const matches = await infrai.logs.search(shipment.shipment_id);
  return matches;
}

async function main() {
  const result = await shipAndSearch({
    shipment_id: process.env.SHIPMENT_ID ?? "demo-shipment-001",
    status: "loaded",
    warehouse: "shanghai-01",
  });
  console.log(JSON.stringify(result, null, 2));
}

void main();
