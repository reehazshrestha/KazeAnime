import { NextRequest, NextResponse } from 'next/server';

const ANIWATCH = (process.env.NEXT_PUBLIC_ANIWATCH_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const search = req.nextUrl.searchParams.toString();
  const url = `${ANIWATCH}/api/v2/hianime/${path}${search ? `?${search}` : ''}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'aniwatch proxy failed' }, { status: 502 });
  }
}
