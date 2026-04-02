import type { PlatformAdapter, PlatformDraftState, PlatformDraftPick } from './adapter';

function normalizePlayerName(rawName: string): string {
  return rawName
    .replace(/[.'''\-`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface ESPNPick {
  overallPickNumber: number;
  roundId: number;
  roundPickNumber: number;
  playerId: number;
  teamId: number;
  id?: number;
  nominatingTeamId?: number;
}

interface ESPNPlayer {
  id: number;
  fullName?: string;
  firstName?: string;
  lastName?: string;
}

export function createEspnAdapter(
  leagueId: string,
  seasonId: number,
  espnS2: string | null,
  swidCookie: string | null,
  myTeamId: number | null
): PlatformAdapter {
  return {
    async fetchDraftState(): Promise<PlatformDraftState> {
      const params = new URLSearchParams({
        leagueId,
        seasonId: String(seasonId),
      });
      if (espnS2) params.set('espn_s2', espnS2);
      if (swidCookie) params.set('swid', swidCookie);

      const res = await fetch(`/api/espn/draft?${params}`);
      if (!res.ok) throw new Error('Failed to fetch ESPN draft');
      const data = await res.json();

      // Build player name lookup from members/players data
      const playerNames: Record<number, string> = {};
      if (data.players) {
        for (const entry of data.players) {
          const p = entry.player as ESPNPlayer | undefined;
          if (p) {
            const name = p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim();
            if (name) playerNames[p.id] = name;
          }
        }
      }

      const draftDetail = data.draftDetail || {};
      const rawPicks: ESPNPick[] = draftDetail.picks || [];
      const totalTeams = data.teams?.length || 12;

      const picks: PlatformDraftPick[] = rawPicks
        .filter((pick) => pick.playerId > 0)
        .map((pick) => {
          const playerName = playerNames[pick.playerId] || `Player ${pick.playerId}`;
          return {
            pickNumber: pick.overallPickNumber,
            round: pick.roundId,
            roundPick: pick.roundPickNumber,
            playerName: normalizePlayerName(playerName),
            platformPlayerId: String(pick.playerId),
            teamId: String(pick.teamId),
            isMyPick: myTeamId ? pick.teamId === myTeamId : false,
          };
        });

      const lastPick = picks.length > 0 ? picks[picks.length - 1] : null;
      const currentPick = lastPick ? lastPick.pickNumber + 1 : 1;
      const currentRound = Math.ceil(currentPick / totalTeams);

      const drafted = draftDetail.drafted !== false;
      let status: PlatformDraftState['status'] = 'pre_draft';
      if (drafted && picks.length > 0) {
        status = draftDetail.completeDate ? 'complete' : 'drafting';
      }

      return {
        status,
        currentPick,
        currentRound,
        totalPicks: totalTeams * 15,
        totalTeams,
        picks,
        myTeamId: myTeamId ? String(myTeamId) : null,
      };
    },

    normalizePlayerName,
  };
}
