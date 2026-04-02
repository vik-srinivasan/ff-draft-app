'use client';

import type { Player } from '@/lib/types';
import { useDraftStore } from '@/stores/draft-store';

const POS_COLORS: Record<string, string> = {
  QB: 'bg-qb',
  RB: 'bg-rb',
  WR: 'bg-wr',
  TE: 'bg-te',
  K: 'bg-k',
  DST: 'bg-dst',
};

interface PlayerRowProps {
  player: Player;
  compact?: boolean;
  showValue?: boolean;
  showTier?: boolean;
  onClick?: () => void;
  selected?: boolean;
}

export default function PlayerRow({ player, compact, showValue = true, showTier = true, onClick, selected }: PlayerRowProps) {
  const { markDrafted, markMyPick } = useDraftStore();

  const value = Math.round(player.avg - player.rank);
  const valueClass = value > 2 ? 'text-positive' : value < -2 ? 'text-negative' : 'text-text-muted';
  const valueStr = value > 0 ? `+${value}` : `${value}`;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Right-click: mark as drafted (not my pick)
    markDrafted(player.name, '', false);
  };

  const handleDoubleClick = () => {
    // Double-click: mark as my pick
    markMyPick(player);
    markDrafted(player.name, '', true);
  };

  return (
    <div
      className={`grid items-center rounded cursor-pointer transition-colors gap-1.5 ${
        compact ? 'grid-cols-[28px_1fr_42px_44px] py-1.5 px-2' : 'grid-cols-[30px_1fr_42px_36px_44px] py-2 px-2.5'
      } ${selected ? 'bg-hover border-l-2 border-accent' : 'bg-surface hover:bg-hover'}`}
      onClick={onClick}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      title="Click to select | Double-click to mark as your pick | Right-click to mark as drafted"
    >
      <div className="text-xs text-text-muted font-semibold text-center">#{player.rank}</div>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-text truncate">{player.name}</div>
        <div className="text-[10px] text-text-dim mt-0.5">{player.team} | ADP: {player.avg}</div>
      </div>
      <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-center text-white ${POS_COLORS[player.pos] || 'bg-text-dim'}`}>
        {player.posLabel}
      </div>
      {showTier && !compact && (
        <div className="text-[10px] text-text-secondary text-center">T{player.tier}</div>
      )}
      {showValue && (
        <div className={`text-xs font-bold text-right ${valueClass}`}>{valueStr}</div>
      )}
    </div>
  );
}
