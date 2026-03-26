import WebSocket from "ws";

export const runtime = "nodejs";
export const maxDuration = 15;

async function testConnection(
  apiKey: string,
  label: string,
  opts: ConstructorParameters<typeof WebSocket>[1] = {}
): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    const result: Record<string, unknown> = { label };

    const ws = new WebSocket("wss://stream.aisstream.io/v0/stream", opts);

    const timeout = setTimeout(() => {
      result.outcome = "timeout";
      ws.terminate();
      resolve(result);
    }, 8000);

    ws.on("open", () => {
      result.opened = true;
      ws.send(
        JSON.stringify({
          APIKey: apiKey,
          BoundingBoxes: [[[-90, -180], [90, 180]]], // global bbox — simpler test
          FilterMessageTypes: ["PositionReport"],
        })
      );
    });

    ws.on("message", (data: Buffer) => {
      clearTimeout(timeout);
      result.outcome = "success";
      result.preview = data.toString().slice(0, 200);
      ws.close();
      resolve(result);
    });

    ws.on("error", (err: Error) => {
      result.error = err.message;
      result.errorCode = (err as NodeJS.ErrnoException).code;
    });

    ws.on("close", (code: number, reason: Buffer) => {
      clearTimeout(timeout);
      if (!result.outcome) {
        result.outcome = "closed_no_message";
        result.closeCode = code;
        result.closeReason = reason.toString() || "(none)";
      }
      resolve(result);
    });
  });
}

export async function GET() {
  const apiKey =
    process.env.NEXT_PUBLIC_AISSTREAM_API_KEY ??
    process.env.AISSTREAM_API_KEY ??
    "(missing)";

  // Run 3 variations in sequence to find what works
  const [plain, withOrigin, withBrowserHeaders] = await Promise.all([
    // Test 1: plain connection (no extra headers)
    testConnection(apiKey, "plain"),

    // Test 2: with Origin header (some servers require it)
    testConnection(apiKey, "with_origin_header", {
      headers: { Origin: "https://aisstream.io" },
    }),

    // Test 3: with browser-like headers
    testConnection(apiKey, "with_browser_headers", {
      headers: {
        Origin: "https://aisstream.io",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    }),
  ]);

  return Response.json({
    apiKeyPresent: apiKey !== "(missing)",
    apiKeyPrefix: apiKey.slice(0, 8) + "...",
    timestamp: new Date().toISOString(),
    tests: [plain, withOrigin, withBrowserHeaders],
  });
}
