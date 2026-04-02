'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useDraftStore } from '@/stores/draft-store';
import { useConnectionStore } from '@/stores/connection-store';
import { createSleeperAdapter } from '@/lib/platforms/sleeper';
import { createEspnAdapter } from '@/lib/platforms/espn';
import type { PlatformAdapter } from '@/lib/platforms/adapter';

export function useDraftPoller(intervalMs: number = 5000) {
  const { markDrafted, setCurrentPick, setTotalTeams } = useDraftStore();
  const {
    activePlatform, pollingEnabled,
    sleeperDraftId, sleeperDraftSlot, sleeperStatus, setSleeperStatus,
    espnLeagueId, espnSeasonId, espnS2Cookie, espnSwidCookie, espnTeamId, espnStatus, setEspnStatus,
  } = useConnectionStore();

  const lastPickCount = useRef(0);
  const adapterRef = useRef<PlatformAdapter | null>(null);

  // Build adapter when platform changes
  useEffect(() => {
    if (activePlatform === 'sleeper' && sleeperDraftId) {
      adapterRef.current = createSleeperAdapter(sleeperDraftId, sleeperDraftSlot);
    } else if (activePlatform === 'espn' && espnLeagueId) {
      adapterRef.current = createEspnAdapter(espnLeagueId, espnSeasonId, espnS2Cookie, espnSwidCookie, espnTeamId);
    } else {
      adapterRef.current = null;
    }
    lastPickCount.current = 0;
  }, [activePlatform, sleeperDraftId, sleeperDraftSlot, espnLeagueId, espnSeasonId, espnS2Cookie, espnSwidCookie, espnTeamId]);

  const poll = useCallback(async () => {
    const adapter = adapterRef.current;
    if (!adapter) return;

    try {
      const state = await adapter.fetchDraftState();
      setCurrentPick(state.currentPick, state.currentRound);
      setTotalTeams(state.totalTeams);

      // Process only new picks
      const newPicks = state.picks.slice(lastPickCount.current);
      for (const pick of newPicks) {
        markDrafted(
          pick.playerName,
          `${pick.round}.${String(pick.roundPick).padStart(2, '0')}`,
          pick.isMyPick,
        );
      }
      lastPickCount.current = state.picks.length;

      // Update status to active on success
      if (activePlatform === 'sleeper' && sleeperStatus !== 'active') {
        setSleeperStatus('active');
      } else if (activePlatform === 'espn' && espnStatus !== 'active') {
        setEspnStatus('active');
      }
    } catch (err) {
      console.warn('[Draft Poller] Error:', (err as Error).message);
    }
  }, [activePlatform, markDrafted, setCurrentPick, setTotalTeams, sleeperStatus, espnStatus, setSleeperStatus, setEspnStatus]);

  useEffect(() => {
    if (!pollingEnabled || !adapterRef.current) return;

    poll(); // Initial fetch
    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [pollingEnabled, poll, intervalMs]);
}
