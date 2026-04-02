'use client';

import { useState } from 'react';
import { useConnectionStore } from '@/stores/connection-store';

export default function SleeperConnect() {
  const { sleeperDraftId, sleeperStatus, sleeperError, sleeperDraftSlot, connectSleeper, disconnectSleeper, setSleeperStatus } = useConnectionStore();
  const [draftId, setDraftId] = useState('');
  const [draftSlot, setDraftSlot] = useState('');
  const [draftInfo, setDraftInfo] = useState<{ teams: number; rounds: number; status: string } | null>(null);

  const handleConnect = async () => {
    const id = draftId.trim();
    if (!id) return;

    connectSleeper(id, draftSlot ? parseInt(draftSlot) : undefined);

    try {
      const res = await fetch(`/api/sleeper/draft/${id}`);
      if (!res.ok) throw new Error('Draft not found');
      const data = await res.json();
      setDraftInfo({
        teams: data.draft.settings?.teams ?? 12,
        rounds: data.draft.settings?.rounds ?? 15,
        status: data.draft.status,
      });
      setSleeperStatus('active');
    } catch (err) {
      setSleeperStatus('error', (err as Error).message);
    }
  };

  const isConnected = sleeperStatus === 'active';

  return (
    <div className="rounded-lg bg-surface border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-accent">
          Sleeper
        </h3>
        <StatusBadge status={sleeperStatus} />
      </div>

      {isConnected ? (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">
            Draft ID: <span className="font-mono">{sleeperDraftId}</span>
          </p>
          {draftInfo && (
            <p className="text-xs text-text-muted">
              {draftInfo.teams} teams, {draftInfo.rounds} rounds — {draftInfo.status}
            </p>
          )}
          {sleeperDraftSlot && (
            <p className="text-xs text-text-muted">Your slot: #{sleeperDraftSlot}</p>
          )}
          <button
            onClick={disconnectSleeper}
            className="text-xs text-text-muted hover:text-negative transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-text-muted mb-1">Draft ID</label>
            <input
              type="text"
              value={draftId}
              onChange={(e) => setDraftId(e.target.value)}
              placeholder="e.g. 1130615382056697856"
              className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text focus:border-accent outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Your Draft Slot (optional)</label>
            <input
              type="number"
              value={draftSlot}
              onChange={(e) => setDraftSlot(e.target.value)}
              placeholder="e.g. 3"
              min="1"
              max="16"
              className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text focus:border-accent outline-none"
            />
          </div>
          <button
            onClick={handleConnect}
            disabled={!draftId.trim() || sleeperStatus === 'connecting'}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-semibold rounded py-2 transition-colors"
          >
            {sleeperStatus === 'connecting' ? 'Connecting...' : 'Connect'}
          </button>
          {sleeperError && (
            <p className="text-xs text-negative">{sleeperError}</p>
          )}
          <p className="text-xs text-text-dim">
            No auth needed. Find your draft ID in the Sleeper app URL.
          </p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    disconnected: 'bg-text-dim',
    connecting: 'bg-warning',
    active: 'bg-positive',
    error: 'bg-negative',
  };
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${colors[status] || 'bg-text-dim'}`} />
      <span className="text-xs text-text-muted capitalize">{status}</span>
    </div>
  );
}
