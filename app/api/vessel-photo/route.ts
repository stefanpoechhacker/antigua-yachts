import { NextRequest, NextResponse } from "next/server";

// Proxy MarineTraffic vessel thumbnails server-side to avoid CORS
export async function GET(request: NextRequest) {
  const mmsi = request.nextUrl.searchParams.get("mmsi");
  if (!mmsi || !/^\d{7,9}$/.test(mmsi)) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://photos.marinetraffic.com/ais/showphoto.aspx?mmsi=${mmsi}&size=thumb`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://www.marinetraffic.com/",
        },
        redirect: "follow",
      }
    );

    if (!res.ok) return new NextResponse(null, { status: 404 });

    const contentType = res.headers.get("content-type") ?? "";
    // Only return actual images, not HTML error pages
    if (!contentType.startsWith("image/")) {
      return new NextResponse(null, { status: 404 });
    }

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
