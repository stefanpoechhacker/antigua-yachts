import WebSocket from "ws";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function GET() {
  const apiKey =
    process.env.NEXT_PUBLIC_AISSTREAM_API_KEY ??
    process.env.AISSTREAM_API_KEY ??
    "(missing)";

  return new Promise<Response>((resolve) => {
    const result: Record<string, unknown> = {
      apiKeyPresent: apiKey !== "(missing)",
      apiKeyPrefix: apiKey.slice(0, 8) + "...",
      timestamp: new Date().toISOString(),
    };

    const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");
    const timeout = setTimeout(() => {
      result.outcome = "timeout_no_open";
      ws.terminate();
      resolve(Response.json(result));
    }, 10000);

    ws.on("open", () => {
      result.opened = true;
      ws.send(JSON.stringify({
        APIKey: apiKey,
        BoundingBoxes: [[[16.5, -62.5], [17.85, -61.2]]],
        FilterMessageTypes: ["PositionReport"],
      }));
      result.subscriptionSent = true;
    });

    ws.on("message", (data: Buffer) => {
      clearTimeout(timeout);
      result.outcome = "success";
      result.firstMessagePreview = data.toString().slice(0, 200);
      ws.close();
      resolve(Response.json(result));
    });

    ws.on("error", (err: Error) => {
      result.error = err.message;
      result.errorCode = (err as NodeJS.ErrnoException).code;
    });

    ws.on("close", (code: number, reason: Buffer) => {
      clearTimeout(timeout);
      if (!result.outcome) {
        result.outcome = "closed_without_message";
        result.closeCode = code;
        result.closeReason = reason.toString();
      }
      resolve(Response.json(result));
    });
  });
}
