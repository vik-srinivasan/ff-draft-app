export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST';

export interface Player {
  rank: number;
  tier: number;
  name: string;
  team: string;
  pos: Position;
  posRank: number;
  posLabel: string;
  best: number;
  worst: number;
  avg: number;
  stddev: number;
  ecrVsAdp: number | null;
  drafted: boolean;
  draftedBy: string | null;
  draftPick: string | null;
}

export interface Rankings {
  players: Player[];
  tiers: Record<number, Record<string, number[]>>;
  byPosition: Record<string, number[]>;
  nameIndex: Record<string, number>;
}

export interface DraftLogEntry {
  name: string;
  pos: string | null;
  tier: number | null;
  rank: number | null;
}

export type Roster = Record<Position, Player[]>;

export interface ValuePlayer extends Player {
  value: number;
}

export interface ScarcityAlert {
  position: string;
  tier: number;
  remaining: number;
  severity: 'critical' | 'warning';
  message: string;
  nextTierInfo: string;
}

export interface RiskAnalysis {
  safePicks: Player[];
  boomBust: Player[];
  avgStdDev: number;
}

export interface PositionRun {
  position: string;
  count: number;
  message: string;
}

export interface RosterNeed {
  have: number;
  target: number;
  priority: number;
  recommendation: string;
}

export interface DraftGrade {
  grade: string;
  score: number;
  desc: string;
}

export interface ConsensusIndicator {
  label: string;
  color: string;
}

export interface Availability {
  picksLeft: number;
  roundsLeft: number;
  urgency: 'NOW' | 'SOON' | 'WAIT';
}
