'use client';

import { useState } from 'react';
import { useDraftStore } from '@/stores/draft-store';
import { useAnalytics } from '@/hooks/use-analytics';
import { askLLM } from '@/lib/llm/client';
import { getConsensusIndicator } from '@/lib/analytics';

const QUICK_QUESTIONS = [
  { label: 'Injury?', q: "What's the injury history and risk?" },
  { label: 'Breakout?', q: 'Is this player a breakout candidate this year?' },
  { label: 'Wait?', q: 'Should I draft this player now or can I wait another round?' },
  { label: 'Ceiling/Floor', q: "What's the realistic ceiling and floor for this player?" },
];

export default function QATab() {
  const { selectedPlayer, draftLog, myPicks, myRoster, currentPick, currentRound } = useDraftStore();
  const analytics = useAnalytics();
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async (q?: string) => {
    const prompt = q || question.trim();
    if (!prompt || !selectedPlayer) return;

    setLoading(true);
    setResponse('Thinking...');
    setQuestion('');

    try {
      // Build next ranked at same position
      const posPlayers = analytics?.bestByPos[selectedPlayer.pos] || [];
      let foundSelected = false;
      const nextRanked = [];
      for (const p of posPlayers) {
        if (p.name === selectedPlayer.name) { foundSelected = true; continue; }
        if (foundSelected && nextRanked.length < 5) nextRanked.push(p);
      }

      const answer = await askLLM({
        prompt,
        playerContext: selectedPlayer,
        nextRanked,
        draftLog,
        myPicks,
        draftContext: { currentPick, round: currentRound, roster: myRoster },
      });
      setResponse(answer);
    } catch (err) {
      setResponse('Error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const consensus = selectedPlayer ? getConsensusIndicator(selectedPlayer) : null;

  return (
    <div className="px-2 pb-4 space-y-3">
      {/* Selected Player */}
      <div className={`p-3 bg-surface rounded-lg text-xs ${selectedPlayer ? 'text-text' : 'text-text-muted'}`}>
        {selectedPlayer ? (
          <>
            <div className="text-sm font-bold text-white">{selectedPlayer.name}</div>
            <div className="text-text-secondary mt-1">
              {selectedPlayer.team} | {selectedPlayer.posLabel} | Tier {selectedPlayer.tier} | Rank #{selectedPlayer.rank}
            </div>
            <div className="text-text-muted mt-1">
              Best: {selectedPlayer.best} | Worst: {selectedPlayer.worst} | Avg: {selectedPlayer.avg} | StdDev: {selectedPlayer.stddev}
            </div>
            {consensus && (
              <span
                className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-1.5 text-white"
                style={{ background: consensus.color }}
              >
                {consensus.label}
              </span>
            )}
          </>
        ) : (
          'Click a player on the Board tab to select them'
        )}
      </div>

      {/* Quick Buttons */}
      <div className="flex flex-wrap gap-1">
        {QUICK_QUESTIONS.map(q => (
          <button
            key={q.label}
            onClick={() => handleAsk(q.q)}
            disabled={!selectedPlayer || loading}
            className="px-2.5 py-1.5 bg-surface border border-border rounded text-xs text-text-secondary hover:border-accent hover:text-text disabled:opacity-50 transition-colors"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-1.5">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder="Ask anything about this player..."
          className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text focus:border-accent outline-none"
        />
        <button
          onClick={() => handleAsk()}
          disabled={!selectedPlayer || loading || !question.trim()}
          className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-xs font-semibold rounded-lg px-4 py-2 transition-colors"
        >
          Ask
        </button>
      </div>

      {/* Response */}
      {response && (
        <div className={`p-3 bg-surface rounded-lg text-xs leading-relaxed ${loading ? 'text-text-muted italic' : 'text-text-secondary'}`}>
          {response}
        </div>
      )}
    </div>
  );
}
