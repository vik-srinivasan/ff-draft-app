import type { PlatformAdapter, PlatformDraftState, PlatformDraftPick } from './adapter';

type SleeperPlayerDB = Record<string, { full_name: string; team: string | null; position: string | null }>;

let playerDB: SleeperPlayerDB | null = null;

async function ensurePlayerDB(): Promise<SleeperPlayerDB> {
  if (playerDB) return playerDB;
  const res = await fetch('/api/sleeper/players');
  if (!res.ok) throw new Error('Failed to load Sleeper player database');
  playerDB = await res.json();
  return playerDB!;
}

function normalizePlayerName(rawName: string): string {
  return rawName
    .replace(/[.'''\-`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function createSleeperAdapter(draftId: string, myDraftSlot: number | null): PlatformAdapter {
  return {
    async fetchDraftState(): Promise<PlatformDraftState> {
      const db = await ensurePlayerDB();

      const res = await fetch(`/api/sleeper/draft/${draftId}`);
      if (!res.ok) throw new Error('Failed to fetch Sleeper draft');
      const { draft, picks: rawPicks } = await res.json();

      const totalTeams = draft.settings?.teams ?? 12;
      const totalRounds = draft.settings?.rounds ?? 15;

      const picks: PlatformDraftPick[] = (rawPicks || []).map((pick: Record<string, unknown>) => {
        const playerId = String(pick.player_id || '');
        const playerInfo = db[playerId];
        const playerName = playerInfo?.full_name || playerId;

        const round = (pick.round as number) || 1;
        const draftSlot = (pick.draft_slot as number) || 1;
        const pickNo = (pick.pick_no as number) || 0;

        return {
          pickNumber: pickNo,
          round,
          roundPick: draftSlot,
          playerName: normalizePlayerName(playerName),
          platformPlayerId: playerId,
          teamId: String(pick.picked_by || ''),
          isMyPick: myDraftSlot ? draftSlot === myDraftSlot : false,
        };
      });

      const lastPick = picks.length > 0 ? picks[picks.length - 1] : null;
      const currentPick = lastPick ? lastPick.pickNumber + 1 : 1;
      const currentRound = Math.ceil(currentPick / totalTeams);

      let status: PlatformDraftState['status'] = 'pre_draft';
      if (draft.status === 'drafting') status = 'drafting';
      else if (draft.status === 'complete') status = 'complete';
      else if (draft.status === 'paused') status = 'paused';

      return {
        status,
        currentPick,
        currentRound,
        totalPicks: totalTeams * totalRounds,
        totalTeams,
        picks,
        myTeamId: myDraftSlot ? String(myDraftSlot) : null,
      };
    },

    normalizePlayerName,
  };
}
