import type { PlatformAdapter, PlatformDraftState, PlatformDraftPick } from './adapter';

function normalizePlayerName(rawName: string): string {
  return rawName
    .replace(/[.'''\-`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface YahooDraftResult {
  pick: number;
  round: number;
  team_key: string;
  player_key: string;
}

interface YahooPlayerInfo {
  name: { full: string };
  player_id: string;
}

export function createYahooAdapter(
  leagueKey: string,
  accessToken: string,
  myTeamKey: string | null
): PlatformAdapter {
  return {
    async fetchDraftState(): Promise<PlatformDraftState> {
      const params = new URLSearchParams({ leagueKey, accessToken });
      const res = await fetch(`/api/yahoo/draft?${params}`);
      if (!res.ok) throw new Error('Failed to fetch Yahoo draft');
      const data = await res.json();

      const league = data?.fantasy_content?.league;
      const draftResults = league?.[1]?.draft_results;

      const picks: PlatformDraftPick[] = [];
      const totalTeams = 12; // Yahoo doesn't always include this in draft results

      if (draftResults) {
        const results = Array.isArray(draftResults)
          ? draftResults
          : Object.values(draftResults).filter((v): v is { draft_result: YahooDraftResult } =>
              typeof v === 'object' && v !== null && 'draft_result' in v
            );

        for (const entry of results) {
          const dr = 'draft_result' in entry ? (entry as { draft_result: YahooDraftResult }).draft_result : null;
          if (!dr) continue;

          // Yahoo provides player_key like "423.p.33394"
          // We'd need a separate call to resolve player names
          // For now, use the player key as a placeholder
          picks.push({
            pickNumber: dr.pick,
            round: dr.round,
            roundPick: ((dr.pick - 1) % totalTeams) + 1,
            playerName: dr.player_key, // Will be resolved via player lookup
            platformPlayerId: dr.player_key,
            teamId: dr.team_key,
            isMyPick: myTeamKey ? dr.team_key === myTeamKey : false,
          });
        }
      }

      const lastPick = picks.length > 0 ? picks[picks.length - 1] : null;
      const currentPick = lastPick ? lastPick.pickNumber + 1 : 1;
      const currentRound = Math.ceil(currentPick / totalTeams);

      return {
        status: picks.length > 0 ? 'drafting' : 'pre_draft',
        currentPick,
        currentRound,
        totalPicks: totalTeams * 15,
        totalTeams,
        picks,
        myTeamId: myTeamKey,
      };
    },

    normalizePlayerName,
  };
}
