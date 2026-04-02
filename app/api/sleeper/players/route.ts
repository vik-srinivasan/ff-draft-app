import { NextResponse } from 'next/server';

// In-memory cache for the 5MB Sleeper player DB
let cachedPlayers: Record<string, { full_name: string; team: string | null; position: string | null }> | null = null;
let cacheTime = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
  const now = Date.now();

  if (cachedPlayers && now - cacheTime < CACHE_TTL) {
    return NextResponse.json(cachedPlayers, {
      headers: { 'Cache-Control': 'public, max-age=86400' },
    });
  }

  try {
    const res = await fetch('https://api.sleeper.app/v1/players/nfl');
    if (!res.ok) throw new Error('Failed to fetch Sleeper player DB');

    const full = await res.json();

    // Extract only the fields we need to reduce payload
    const slim: Record<string, { full_name: string; team: string | null; position: string | null }> = {};
    for (const [id, player] of Object.entries(full)) {
      const p = player as Record<string, unknown>;
      if (p.full_name) {
        slim[id] = {
          full_name: p.full_name as string,
          team: (p.team as string) || null,
          position: (p.position as string) || null,
        };
      }
    }

    cachedPlayers = slim;
    cacheTime = now;

    return NextResponse.json(slim, {
      headers: { 'Cache-Control': 'public, max-age=86400' },
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
