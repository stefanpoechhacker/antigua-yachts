// AISStream explicitly blocks browser WebSocket connections.
// This route proxies the WebSocket server-side and streams data to the
// browser via Server-Sent Events (SSE) — a normal HTTP connection.
import WebSocket from "ws";

export const runtime = "nodejs";
export const maxDuration = 300; // Vercel Pro: up to 5 min per connection

const ANTIGUA_BBOX = [[[16.5, -62.5], [17.85, -61.2]]];

export async function GET(request: Request) {
  const apiKey =
    process.env.NEXT_PUBLIC_AISSTREAM_API_KEY ??
    process.env.AISSTREAM_API_KEY ??
    "";

  if (!apiKey) {
    return new Response("Missing AISSTREAM_API_KEY", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

      const send = (event: string, data: unknown) =>
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );

      ws.on("open", () => {
        ws.send(
          JSON.stringify({
            APIKey: apiKey,
            BoundingBoxes: ANTIGUA_BBOX,
            FilterMessageTypes: [
              "PositionReport",
              "ShipStaticData",
              "StandardClassBPositionReport",
            ],
          })
        );
        send("status", { connected: true });
      });

      ws.on("message", (raw: Buffer) => {
        // Forward raw AIS JSON directly to client
        controller.enqueue(encoder.encode(`data: ${raw.toString()}\n\n`));
      });

      ws.on("error", (err: Error) => {
        send("error", { message: err.message });
        try { controller.close(); } catch { /* already closed */ }
      });

      ws.on("close", (code: number, reason: Buffer) => {
        send("status", { connected: false, code, reason: reason.toString() });
        try { controller.close(); } catch { /* already closed */ }
      });

      // Clean up when client disconnects
      request.signal.addEventListener("abort", () => {
        ws.close();
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable Nginx buffering on Vercel
    },
  });
}
