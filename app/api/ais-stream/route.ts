// undici is built into Node.js 18+ — no package install needed.
// AISStream blocks browser WebSocket; we proxy server-side via SSE.
import { WebSocket } from "undici";

export const runtime = "nodejs";
export const maxDuration = 300;

// Temporarily global to test coverage — will narrow back to Antigua once confirmed working
const BBOX = [[[-90, -180], [90, 180]]];

export async function GET(request: Request) {
  const apiKey =
    process.env.NEXT_PUBLIC_AISSTREAM_API_KEY ??
    process.env.AISSTREAM_API_KEY ??
    "";

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const enqueue = (event: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch { /* stream already closed */ }
      };

      if (!apiKey) {
        enqueue("error", { message: "Missing API key" });
        controller.close();
        return;
      }

      let ws: InstanceType<typeof WebSocket>;
      try {
        ws = new WebSocket("wss://stream.aisstream.io/v0/stream");
      } catch (e) {
        enqueue("error", { message: `WebSocket init failed: ${String(e)}` });
        controller.close();
        return;
      }

      // Keep-alive ping every 20s to prevent proxy/CDN timeouts
      const keepAlive = setInterval(() => {
        try { controller.enqueue(encoder.encode(": ping\n\n")); }
        catch { clearInterval(keepAlive); }
      }, 20000);

      const cleanup = () => {
        clearInterval(keepAlive);
        try { controller.close(); } catch { /* already closed */ }
      };

      ws.onopen = () => {
        ws.send(JSON.stringify({
          APIKey: apiKey,
          BoundingBoxes: BBOX,
          FilterMessageTypes: ["PositionReport", "ShipStaticData", "StandardClassBPositionReport"],
        }));
        enqueue("status", { connected: true });
      };

      ws.onmessage = (event) => {
        const str = String(event.data);
        if (str.includes('"error"')) {
          try {
            const parsed = JSON.parse(str) as { error?: string };
            if (parsed.error) {
              enqueue("error", { message: parsed.error });
              ws.close();
              return;
            }
          } catch { /* not a plain error object */ }
        }
        try { controller.enqueue(encoder.encode(`data: ${str}\n\n`)); }
        catch { /* stream closed */ }
      };

      ws.onerror = (event) => {
        enqueue("error", { message: String(event) });
        cleanup();
      };

      ws.onclose = (event) => {
        enqueue("status", { connected: false, code: event.code, reason: event.reason });
        cleanup();
      };

      request.signal.addEventListener("abort", () => {
        ws.close();
        cleanup();
      });
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
