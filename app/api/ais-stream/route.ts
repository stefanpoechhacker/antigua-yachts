import { WebSocket } from "undici";

export const runtime = "nodejs";
export const maxDuration = 300;

// English Channel — busiest shipping lane, guaranteed terrestrial AIS coverage
// Switch back to Antigua once confirmed working
const BBOX = [[[49, -3], [53, 2]]];

export async function GET(request: Request) {
  const apiKey =
    process.env.NEXT_PUBLIC_AISSTREAM_API_KEY ??
    process.env.AISSTREAM_API_KEY ??
    "";

  const encoder = new TextEncoder();
  let wsMessageCount = 0;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch { /* stream closed */ }
      };

      if (!apiKey) { send("error", { message: "Missing API key" }); controller.close(); return; }

      let ws: InstanceType<typeof WebSocket>;
      try {
        ws = new WebSocket("wss://stream.aisstream.io/v0/stream");
      } catch (e) {
        send("error", { message: `WebSocket init failed: ${String(e)}` });
        controller.close();
        return;
      }

      // Heartbeat: report WS message count every 5s so we can see if server is receiving data
      const heartbeat = setInterval(() => {
        send("heartbeat", { wsMessageCount });
      }, 5000);

      // Keep-alive ping every 20s
      const keepAlive = setInterval(() => {
        try { controller.enqueue(encoder.encode(": ping\n\n")); } catch { /* closed */ }
      }, 20000);

      const cleanup = () => {
        clearInterval(heartbeat);
        clearInterval(keepAlive);
        try { controller.close(); } catch { /* already closed */ }
      };

      // Use addEventListener (more reliable with undici than property assignment)
      ws.addEventListener("open", () => {
        ws.send(JSON.stringify({
          APIKey: apiKey,
          BoundingBoxes: BBOX,
          FilterMessageTypes: ["PositionReport", "ShipStaticData", "StandardClassBPositionReport"],
        }));
        send("status", { connected: true });
      });

      ws.addEventListener("message", (event) => {
        wsMessageCount++;
        const str = String(event.data);
        if (str.includes('"error"')) {
          try {
            const parsed = JSON.parse(str) as { error?: string };
            if (parsed.error) { send("error", { message: parsed.error }); ws.close(); return; }
          } catch { /* not plain error */ }
        }
        try { controller.enqueue(encoder.encode(`data: ${str}\n\n`)); } catch { /* closed */ }
      });

      ws.addEventListener("error", (event) => {
        send("error", { message: String(event) });
        cleanup();
      });

      ws.addEventListener("close", (event: CloseEvent) => {
        send("status", { connected: false, code: event.code, reason: event.reason, wsMessageCount });
        cleanup();
      });

      request.signal.addEventListener("abort", () => { ws.close(); cleanup(); });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
