// Node.js 22+ has a built-in WebSocket global — no external package needed.
// AISStream blocks browser connections, so we proxy server-side via SSE.

export const runtime = "nodejs";
export const maxDuration = 300;

const BBOX = [[[16.5, -62.5], [17.85, -61.2]]];

export async function GET(request: Request) {
  const apiKey =
    process.env.NEXT_PUBLIC_AISSTREAM_API_KEY ??
    process.env.AISSTREAM_API_KEY ??
    "";

  if (!apiKey) {
    return new Response("data: {\"error\":\"Missing API key\"}\n\n", {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Use native Node.js 22+ WebSocket (no import needed)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ws = new (globalThis as any).WebSocket(
        "wss://stream.aisstream.io/v0/stream"
      );

      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch { /* stream already closed */ }
      };

      // Keep-alive ping every 20s to prevent proxy/CDN timeouts
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(keepAlive);
        }
      }, 20000);

      ws.onopen = () => {
        ws.send(JSON.stringify({
          APIKey: apiKey,
          BoundingBoxes: BBOX,
          FilterMessageTypes: ["PositionReport", "ShipStaticData", "StandardClassBPositionReport"],
        }));
        send("status", { connected: true });
      };

      ws.onmessage = (event: MessageEvent) => {
        const str = typeof event.data === "string" ? event.data : String(event.data);
        // Surface AISStream application errors
        if (str.includes('"error"')) {
          try {
            const parsed = JSON.parse(str) as { error?: string };
            if (parsed.error) {
              send("error", { message: parsed.error });
              clearInterval(keepAlive);
              ws.close();
              return;
            }
          } catch { /* not a plain error object, forward normally */ }
        }
        try {
          controller.enqueue(encoder.encode(`data: ${str}\n\n`));
        } catch { /* stream closed */ }
      };

      ws.onerror = (event: Event) => {
        send("error", { message: String(event) });
        clearInterval(keepAlive);
        try { controller.close(); } catch { /* already closed */ }
      };

      ws.onclose = (event: CloseEvent) => {
        clearInterval(keepAlive);
        send("status", { connected: false, code: event.code, reason: event.reason });
        try { controller.close(); } catch { /* already closed */ }
      };

      request.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
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
      "X-Accel-Buffering": "no",
    },
  });
}
