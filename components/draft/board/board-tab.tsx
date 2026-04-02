'use client';

import { useState } from 'react';
import { useAnalytics } from '@/hooks/use-analytics';
import { useDraftStore } from '@/stores/draft-store';
import PlayerRow from './player-row';

const POSITIONS = ['ALL', 'QB', 'RB', 'WR', 'TE', 'DST', 'K'];

export default function BoardTab() {
  const [activePosition, setActivePosition] = useState('ALL');
  const analytics = useAnalytics();
  const { selectedPlayer, setSelectedPlayer } = useDraftStore();

  if (!analytics) {
    return <div className="p-4 text-text-muted text-sm">Upload a CSV to get started</div>;
  }

  const players = activePosition === 'ALL'
    ? analytics.bestAvailable.slice(0, 100)
    : (analytics.bestByPos[activePosition] || []);

  return (
    <div>
      {/* Position Filters */}
      <div className="flex gap-1 py-2 px-1 sticky top-[92px] bg-bg z-5">
        {POSITIONS.map(pos => (
          <button
            key={pos}
            onClick={() => setActivePosition(pos)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors ${
              activePosition === pos
                ? 'bg-accent text-white border-accent'
                : 'bg-surface border border-border text-text-muted hover:border-accent hover:text-text-secondary'
            }`}
          >
            {pos}
          </button>
        ))}
      </div>

      {/* Player List */}
      <div className="flex flex-col gap-0.5 px-1">
        {players.map(p => (
          <PlayerRow
            key={p.name}
            player={p}
            selected={selectedPlayer?.name === p.name}
            onClick={() => setSelectedPlayer(p)}
          />
        ))}
        {players.length === 0 && (
          <div className="text-center text-text-dim text-sm py-4">No players available</div>
        )}
      </div>
    </div>
  );
}
