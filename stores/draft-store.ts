import { create } from 'zustand';
import type { Player, Rankings, DraftLogEntry, Roster, Position } from '@/lib/types';
import { parseCSV } from '@/lib/csv-parser';
import { buildIndex, findMatch } from '@/lib/fuzzy-match';

interface DraftState {
  rankings: Rankings | null;
  draftLog: DraftLogEntry[];
  myPicks: Player[];
  myRoster: Roster;
  currentPick: number;
  currentRound: number;
  totalTeams: number;
  selectedPlayer: Player | null;

  loadRankings: (csvText: string) => void;
  markDrafted: (playerName: string, pickSlot: string, isMyPick?: boolean) => void;
  markMyPick: (player: Player) => void;
  setCurrentPick: (pick: number, round: number) => void;
  setSelectedPlayer: (player: Player | null) => void;
  setTotalTeams: (teams: number) => void;
  reset: () => void;
}

const emptyRoster: Roster = { QB: [], RB: [], WR: [], TE: [], K: [], DST: [] };

export const useDraftStore = create<DraftState>((set, get) => ({
  rankings: null,
  draftLog: [],
  myPicks: [],
  myRoster: { ...emptyRoster, QB: [], RB: [], WR: [], TE: [], K: [], DST: [] },
  currentPick: 1,
  currentRound: 1,
  totalTeams: 12,
  selectedPlayer: null,

  loadRankings: (csvText: string) => {
    const rankings = parseCSV(csvText);
    buildIndex(rankings.players);

    // Persist to localStorage
    try {
      localStorage.setItem('ff_csv', csvText);
    } catch { /* ignore */ }

    set({ rankings, draftLog: [], myPicks: [], myRoster: { ...emptyRoster, QB: [], RB: [], WR: [], TE: [], K: [], DST: [] }, currentPick: 1, currentRound: 1 });
  },

  markDrafted: (playerName: string, pickSlot: string, isMyPick?: boolean) => {
    const { rankings, draftLog, myPicks, myRoster } = get();
    if (!rankings) return;

    const idx = findMatch(playerName);
    if (idx === -1) {
      // Unranked player
      set({
        draftLog: [...draftLog, { name: playerName, pos: null, tier: null, rank: null }],
      });
      return;
    }

    const player = rankings.players[idx];
    if (player.drafted) return;

    player.drafted = true;
    player.draftPick = pickSlot;

    const newDraftLog = [...draftLog, { name: player.name, pos: player.pos, tier: player.tier, rank: player.rank }];

    if (isMyPick) {
      const newMyPicks = [...myPicks, player];
      const newRoster = { ...myRoster };
      const pos = player.pos as Position;
      newRoster[pos] = [...(newRoster[pos] || []), player];
      set({ draftLog: newDraftLog, myPicks: newMyPicks, myRoster: newRoster });
    } else {
      set({ draftLog: newDraftLog });
    }
  },

  markMyPick: (player: Player) => {
    const { myPicks, myRoster } = get();
    if (myPicks.some(p => p.name === player.name)) return;

    const newMyPicks = [...myPicks, player];
    const newRoster = { ...myRoster };
    const pos = player.pos as Position;
    newRoster[pos] = [...(newRoster[pos] || []), player];
    set({ myPicks: newMyPicks, myRoster: newRoster });
  },

  setCurrentPick: (pick: number, round: number) => {
    set({ currentPick: pick, currentRound: round });
  },

  setSelectedPlayer: (player: Player | null) => {
    set({ selectedPlayer: player });
  },

  setTotalTeams: (teams: number) => {
    set({ totalTeams: teams });
  },

  reset: () => {
    set({
      rankings: null,
      draftLog: [],
      myPicks: [],
      myRoster: { ...emptyRoster, QB: [], RB: [], WR: [], TE: [], K: [], DST: [] },
      currentPick: 1,
      currentRound: 1,
      selectedPlayer: null,
    });
  },
}));
