'use client';

import type { Player } from '@/lib/types';

type Breakdown = Record<string, Record<number, { remaining: number; players: Player[] }>>;

export default function TierCountdown({ breakdown }: { breakdown: Breakdown }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="grid grid-cols-[36px_36px_40px_1fr] gap-2 px-2 py-1 text-[10px] text-text-muted font-semibold">
        <span>Pos</span><span>Tier</span><span>Left</span><span>Players</span>
      </div>
      {(['QB', 'RB', 'WR', 'TE'] as const).map(pos => {
        const tiers = breakdown[pos] || {};
        const activeTiers = Object.keys(tiers).map(Number).sort((a, b) => a - b);

        return activeTiers.slice(0, 2).map(tier => {
          const info = tiers[tier];
          const leftClass = info.remaining <= 1 ? 'text-negative' : info.remaining <= 3 ? 'text-warning' : 'text-positive';
          const names = info.players.map(p => p.name.split(' ').pop()).join(', ');

          return (
            <div key={`${pos}-${tier}`} className="grid grid-cols-[36px_36px_40px_1fr] gap-2 px-2 py-1.5 bg-surface rounded text-xs items-center">
              <span className="font-bold">{pos}</span>
              <span className="text-text-secondary">T{tier}</span>
              <span className={`font-semibold ${leftClass}`}>{info.remaining}</span>
              <span className="text-[10px] text-text-dim truncate" title={names}>{names}</span>
            </div>
          );
        });
      })}
    </div>
  );
}
