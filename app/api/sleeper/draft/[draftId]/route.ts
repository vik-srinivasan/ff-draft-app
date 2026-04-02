import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;

  try {
    const [draftRes, picksRes] = await Promise.all([
      fetch(`https://api.sleeper.app/v1/draft/${draftId}`),
      fetch(`https://api.sleeper.app/v1/draft/${draftId}/picks`),
    ]);

    if (!draftRes.ok) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const draft = await draftRes.json();
    const picks = picksRes.ok ? await picksRes.json() : [];

    return NextResponse.json({ draft, picks });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
