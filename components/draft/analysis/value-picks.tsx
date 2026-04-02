'use client';

import type { ValuePlayer } from '@/lib/types';
import { useDraftStore } from '@/stores/draft-store';
import PlayerRow from '../board/player-row';

export default function ValuePicks({ picks }: { picks: ValuePlayer[] }) {
  const { setSelectedPlayer } = useDraftStore();

  if (picks.length === 0) {
    return <div className="text-text-dim text-xs py-2">No significant value picks right now</div>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {picks.map(p => (
        <PlayerRow
          key={p.name}
          player={p}
          compact
          showTier={false}
          onClick={() => setSelectedPlayer(p)}
        />
      ))}
    </div>
  );
}
