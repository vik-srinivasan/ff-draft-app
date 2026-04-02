'use client';

import Link from 'next/link';
import { useDraftStore } from '@/stores/draft-store';
import { useConnectionStore } from '@/stores/connection-store';

export default function DraftHeader() {
  const { rankings, currentPick, currentRound, draftLog } = useDraftStore();
  const { activePlatform, sleeperStatus, espnStatus, yahooStatus } = useConnectionStore();

  const totalPlayers = rankings?.players.length ?? 0;
  const totalDrafted = draftLog.length;

  return (
    <header className="bg-surface border-b-2 border-accent px-4 py-3 sticky top-0 z-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-extrabold text-accent tracking-wider hover:text-accent-hover transition-colors">
            FF DRAFT ANALYST
          </Link>
          <div className="flex items-center gap-2">
            {sleeperStatus === 'active' && (
              <PlatformBadge name="Sleeper" active={activePlatform === 'sleeper'} />
            )}
            {espnStatus === 'active' && (
              <PlatformBadge name="ESPN" active={activePlatform === 'espn'} />
            )}
            {yahooStatus === 'active' && (
              <PlatformBadge name="Yahoo" active={activePlatform === 'yahoo'} />
            )}
            {!activePlatform && (
              <span className="text-xs text-text-dim px-2 py-0.5 rounded bg-border/50">Manual Mode</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-text-muted">Pick </span>
            <span className="font-bold text-text">{currentRound}.{String(((currentPick - 1) % 12) + 1).padStart(2, '0')}</span>
            <span className="text-text-muted ml-1">(#{currentPick})</span>
          </div>
          <div className="text-text-muted">
            {totalDrafted}/{totalPlayers} drafted
          </div>
        </div>
      </div>
    </header>
  );
}

function PlatformBadge({ name, active }: { name: string; active: boolean }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
      active ? 'bg-accent text-white' : 'bg-border text-text-muted'
    }`}>
      {name}
    </span>
  );
}
