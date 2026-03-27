import { WebSocket } from "undici";

export const runtime = "nodejs";
export const maxDuration = 30;

// Opens WS, sends subscription, collects first few messages or times out.
// Hit /api/ais-debug to see exactly what AISStream sends back.
export async function GET() {
  const apiKey =
    process.env.NEXT_PUBLIC_AISSTREAM_API_KEY ??
    process.env.AISSTREAM_API_KEY ??
    "";

  const log: string[] = [];
  const messages: unknown[] = [];

  if (!apiKey) {
    return Response.json({ error: "No API key" });
  }

  log.push(`key_prefix: ${apiKey.slice(0, 8)}...`);

  return new Promise<Response>((resolve) => {
    let done = false;
    const finish = (reason: string) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { ws.close(); } catch { /* ok */ }
      resolve(Response.json({ reason, log, messages, messageCount: messages.length }));
    };

    // Timeout after 15s
    const timer = setTimeout(() => finish("timeout_15s"), 15000);

    let ws: InstanceType<typeof WebSocket>;
    try {
      ws = new WebSocket("wss://stream.aisstream.io/v0/stream");
      log.push("ws_created");
    } catch (e) {
      resolve(Response.json({ error: `WebSocket init failed: ${String(e)}` }));
      return;
    }

    ws.addEventListener("open", () => {
      log.push("ws_open");
      const sub = {
        APIKey: apiKey,
        BoundingBoxes: [[[49, -3], [53, 2]]],
        FilterMessageTypes: ["PositionReport"],
      };
      ws.send(JSON.stringify(sub));
      log.push(`sub_sent: ${JSON.stringify(sub)}`);
    });

    ws.addEventListener("message", (event) => {
      const str = String(event.data);
      log.push(`msg_${messages.length}: ${str.slice(0, 200)}`);
      try {
        messages.push(JSON.parse(str));
      } catch {
        messages.push({ raw: str.slice(0, 500) });
      }
      if (messages.length >= 3) finish("got_3_messages");
    });

    ws.addEventListener("error", (event) => {
      log.push(`ws_error: ${String(event)}`);
      finish("ws_error");
    });

    ws.addEventListener("close", (event: CloseEvent) => {
      log.push(`ws_close: code=${event.code} reason=${event.reason}`);
      finish(`ws_closed_${event.code}`);
    });
  });
}
