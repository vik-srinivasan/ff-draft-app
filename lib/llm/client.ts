import type { Player, DraftLogEntry, Roster } from '@/lib/types';

interface AskLLMParams {
  prompt: string;
  playerContext: Player | null;
  nextRanked: Player[];
  draftLog: DraftLogEntry[];
  myPicks: Player[];
  draftContext: { currentPick: number; round: number; roster: Roster } | null;
}

export async function askLLM(params: AskLLMParams): Promise<string> {
  const res = await fetch('/api/llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.answer;
}
