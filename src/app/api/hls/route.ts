import { NextRequest, NextResponse } from 'next/server';

// Proxy HLS streams server-side so the browser doesn't hit CORS/Referer blocks
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  const referer = req.nextUrl.searchParams.get('referer') ?? 'https://megacloud.blog/';

  if (!url) return new NextResponse('Missing url', { status: 400 });

  try {
    const res = await fetch(url, {
      headers: {
        Referer: referer,
        Origin: new URL(referer).origin,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      cache: 'no-store',
    });

    if (!res.ok) return new NextResponse(null, { status: res.status });

    const contentType = res.headers.get('content-type') ?? '';
    const isM3U8 = contentType.includes('mpegurl') || url.includes('.m3u8');
    const isVTT = contentType.includes('vtt') || url.includes('.vtt');

    if (isVTT) {
      const text = await res.text();
      return new NextResponse(text, {
        headers: {
          'Content-Type': 'text/vtt',
          'Cache-Control': 'max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (isM3U8) {
      const text = await res.text();
      const base = new URL(url);
      // Rewrite all non-comment lines (segment URLs) to go through this proxy
      const rewritten = text
        .split('\n')
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return line;
          const absUrl = trimmed.startsWith('http') ? trimmed : new URL(trimmed, base).href;
          return `/api/hls?url=${encodeURIComponent(absUrl)}&referer=${encodeURIComponent(referer)}`;
        })
        .join('\n');

      return new NextResponse(rewritten, {
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // For TS segments — stream the buffer through
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      headers: {
        'Content-Type': contentType || 'video/MP2T',
        'Cache-Control': 'max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new NextResponse('Proxy error', { status: 502 });
  }
}
