'use client';

import type { Player } from '@/lib/types';

const POS_COLORS: Record<string, string> = {
  QB: 'bg-qb',
  RB: 'bg-rb',
  WR: 'bg-wr',
  TE: 'bg-te',
  K: 'bg-k',
  DST: 'bg-dst',
};

export default function MyPicks({ picks }: { picks: Player[] }) {
  if (!picks || picks.length === 0) {
    return (
      <div className="text-text-dim text-xs py-2">
        Double-click a player to mark as your pick, or right-click to mark as drafted by someone else
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {picks.map((p, i) => (
        <div key={p.name} className="grid grid-cols-[28px_1fr_42px] items-center py-1.5 px-2 bg-surface rounded text-xs gap-1.5">
          <div className="text-text-muted font-semibold text-center">R{i + 1}</div>
          <div className="min-w-0">
            <div className="font-semibold text-text truncate">{p.name}</div>
            <div className="text-[10px] text-text-dim">{p.team} | Rank #{p.rank}</div>
          </div>
          <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-center text-white ${POS_COLORS[p.pos] || 'bg-text-dim'}`}>
            {p.posLabel}
          </div>
        </div>
      ))}
    </div>
  );
}
