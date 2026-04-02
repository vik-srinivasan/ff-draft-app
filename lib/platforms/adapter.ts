export interface PlatformDraftPick {
  pickNumber: number;
  round: number;
  roundPick: number;
  playerName: string;
  platformPlayerId: string;
  teamId: string;
  isMyPick: boolean;
}

export interface PlatformDraftState {
  status: 'pre_draft' | 'drafting' | 'paused' | 'complete';
  currentPick: number;
  currentRound: number;
  totalPicks: number;
  totalTeams: number;
  picks: PlatformDraftPick[];
  myTeamId: string | null;
}

export interface PlatformAdapter {
  fetchDraftState(): Promise<PlatformDraftState>;
  normalizePlayerName(rawName: string): string;
}
