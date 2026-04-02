import { create } from 'zustand';

type ConnectionStatus = 'disconnected' | 'connecting' | 'active' | 'error';

interface ConnectionState {
  // Sleeper
  sleeperDraftId: string | null;
  sleeperStatus: ConnectionStatus;
  sleeperError: string | null;
  sleeperDraftSlot: number | null;

  // Yahoo
  yahooLeagueKey: string | null;
  yahooAccessToken: string | null;
  yahooStatus: ConnectionStatus;
  yahooError: string | null;

  // ESPN
  espnLeagueId: string | null;
  espnSeasonId: number;
  espnS2Cookie: string | null;
  espnSwidCookie: string | null;
  espnStatus: ConnectionStatus;
  espnError: string | null;
  espnTeamId: number | null;

  // Active platform
  activePlatform: 'sleeper' | 'yahoo' | 'espn' | null;
  pollingEnabled: boolean;

  // Actions
  connectSleeper: (draftId: string, draftSlot?: number) => void;
  disconnectSleeper: () => void;
  setSleeperStatus: (status: ConnectionStatus, error?: string) => void;

  connectEspn: (leagueId: string, seasonId: number, s2Cookie?: string, swidCookie?: string, teamId?: number) => void;
  disconnectEspn: () => void;
  setEspnStatus: (status: ConnectionStatus, error?: string) => void;

  connectYahoo: (leagueKey: string, accessToken: string) => void;
  disconnectYahoo: () => void;
  setYahooStatus: (status: ConnectionStatus, error?: string) => void;

  setActivePlatform: (platform: 'sleeper' | 'yahoo' | 'espn' | null) => void;
  setPollingEnabled: (enabled: boolean) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  sleeperDraftId: null,
  sleeperStatus: 'disconnected',
  sleeperError: null,
  sleeperDraftSlot: null,

  yahooLeagueKey: null,
  yahooAccessToken: null,
  yahooStatus: 'disconnected',
  yahooError: null,

  espnLeagueId: null,
  espnSeasonId: new Date().getFullYear(),
  espnS2Cookie: null,
  espnSwidCookie: null,
  espnStatus: 'disconnected',
  espnError: null,
  espnTeamId: null,

  activePlatform: null,
  pollingEnabled: false,

  connectSleeper: (draftId, draftSlot) => set({
    sleeperDraftId: draftId,
    sleeperDraftSlot: draftSlot ?? null,
    sleeperStatus: 'connecting',
    sleeperError: null,
    activePlatform: 'sleeper',
    pollingEnabled: true,
  }),
  disconnectSleeper: () => set({
    sleeperDraftId: null,
    sleeperStatus: 'disconnected',
    sleeperError: null,
    sleeperDraftSlot: null,
  }),
  setSleeperStatus: (status, error) => set({
    sleeperStatus: status,
    sleeperError: error ?? null,
  }),

  connectEspn: (leagueId, seasonId, s2Cookie, swidCookie, teamId) => set({
    espnLeagueId: leagueId,
    espnSeasonId: seasonId,
    espnS2Cookie: s2Cookie ?? null,
    espnSwidCookie: swidCookie ?? null,
    espnTeamId: teamId ?? null,
    espnStatus: 'connecting',
    espnError: null,
    activePlatform: 'espn',
    pollingEnabled: true,
  }),
  disconnectEspn: () => set({
    espnLeagueId: null,
    espnStatus: 'disconnected',
    espnError: null,
    espnS2Cookie: null,
    espnSwidCookie: null,
    espnTeamId: null,
  }),
  setEspnStatus: (status, error) => set({
    espnStatus: status,
    espnError: error ?? null,
  }),

  connectYahoo: (leagueKey, accessToken) => set({
    yahooLeagueKey: leagueKey,
    yahooAccessToken: accessToken,
    yahooStatus: 'connecting',
    yahooError: null,
    activePlatform: 'yahoo',
    pollingEnabled: true,
  }),
  disconnectYahoo: () => set({
    yahooLeagueKey: null,
    yahooAccessToken: null,
    yahooStatus: 'disconnected',
    yahooError: null,
  }),
  setYahooStatus: (status, error) => set({
    yahooStatus: status,
    yahooError: error ?? null,
  }),

  setActivePlatform: (platform) => set({ activePlatform: platform }),
  setPollingEnabled: (enabled) => set({ pollingEnabled: enabled }),
}));
