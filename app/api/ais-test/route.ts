import WebSocket from "ws";
import { IncomingMessage } from "http";

export const runtime = "nodejs";
export const maxDuration = 20;

function probe(
  label: string,
  sendFn?: (ws: InstanceType<typeof WebSocket>) => void,
  headers?: Record<string, string>
): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    const r: Record<string, unknown> = { label };
    const ws = new WebSocket("wss://stream.aisstream.io/v0/stream", { headers });
    const t0 = Date.now();

    const done = (outcome: string) => {
      clearTimeout(timer);
      r.ms = Date.now() - t0;
      r.outcome = outcome;
      resolve(r);
    };

    const timer = setTimeout(() => {
      ws.terminate();
      done("timeout_8s");
    }, 8000);

    ws.on("unexpected-response", (_: unknown, res: IncomingMessage) => {
      r.httpStatus = res.statusCode;
      r.httpHeaders = res.headers;
      done("http_rejection");
    });

    ws.on("open", () => {
      r.opened = true;
      r.openedAt = Date.now() - t0 + "ms";
      if (sendFn) sendFn(ws);
    });

    ws.on("message", (d: Buffer) => {
      r.firstMsg = d.toString().slice(0, 300);
      ws.close();
      done("success");
    });

    ws.on("error", (e: Error) => {
      r.error = e.message;
      r.code = (e as NodeJS.ErrnoException).code;
    });

    ws.on("close", (code: number, reason: Buffer) => {
      if (r.outcome) return;
      r.closeCode = code;
      r.closeReason = reason.toString() || "(empty)";
      done("closed");
    });
  });
}

export async function GET() {
  const key =
    process.env.NEXT_PUBLIC_AISSTREAM_API_KEY ??
    process.env.AISSTREAM_API_KEY ??
    "(missing)";

  const sub = JSON.stringify({
    APIKey: key,
    BoundingBoxes: [[[-90, -180], [90, 180]]],
    FilterMessageTypes: ["PositionReport"],
  });

  const [noSend, withSub, wrongJson, withOrigin] = await Promise.all([
    // 1. Open but never send — does server wait or drop immediately?
    probe("open_no_send"),

    // 2. Open + send valid subscription
    probe("open_with_sub", (ws) => ws.send(sub)),

    // 3. Open + send garbage JSON — what error does server return?
    probe("open_bad_json", (ws) => ws.send("not json")),

    // 4. Open + sub + Origin header
    probe("open_with_origin", (ws) => ws.send(sub), {
      Origin: "https://aisstream.io",
    }),
  ]);

  return Response.json({
    keyPrefix: key.slice(0, 8) + "...",
    keyPresent: key !== "(missing)",
    nodeVersion: process.version,
    tests: [noSend, withSub, wrongJson, withOrigin],
  });
}
