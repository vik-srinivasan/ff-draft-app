import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, buildContextString } from '@/lib/llm/system-prompt';

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, playerContext, nextRanked, draftLog, myPicks, draftContext } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'prompt required' }, { status: 400 });
    }

    const contextStr = buildContextString({
      playerContext,
      draftContext,
      nextRanked: nextRanked || [],
      draftLog: draftLog || [],
      myPicks: myPicks || [],
    });

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: contextStr + '\nQuestion: ' + prompt,
      }],
    });

    const answer = message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({ answer });
  } catch (err) {
    const message = (err as Error).message || 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
