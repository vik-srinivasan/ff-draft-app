'use client';

import { useMemo } from 'react';
import { useDraftStore } from '@/stores/draft-store';
import {
  getBestAvailable, getValuePicks, getTierBreakdown,
  getScarcityAlerts, getRiskAnalysis, detectPositionRun,
  getRosterAdvice, calculateDraftGrade,
} from '@/lib/analytics';
import type { Player, ValuePlayer, ScarcityAlert, RiskAnalysis, PositionRun, RosterNeed, DraftGrade } from '@/lib/types';

interface AnalyticsData {
  bestAvailable: Player[];
  bestByPos: Record<string, Player[]>;
  valuePicks: ValuePlayer[];
  tierBreakdown: ReturnType<typeof getTierBreakdown>;
  scarcityAlerts: ScarcityAlert[];
  riskAnalysis: RiskAnalysis;
  positionRun: PositionRun | null;
  rosterAdvice: Record<string, RosterNeed>;
  draftGrade: DraftGrade;
}

export function useAnalytics(): AnalyticsData | null {
  const { rankings, currentPick, currentRound, draftLog, myPicks, myRoster } = useDraftStore();

  return useMemo(() => {
    if (!rankings) return null;

    return {
      bestAvailable: getBestAvailable(rankings),
      bestByPos: {
        QB: getBestAvailable(rankings, 'QB').slice(0, 20),
        RB: getBestAvailable(rankings, 'RB').slice(0, 20),
        WR: getBestAvailable(rankings, 'WR').slice(0, 20),
        TE: getBestAvailable(rankings, 'TE').slice(0, 20),
        DST: getBestAvailable(rankings, 'DST').slice(0, 10),
        K: getBestAvailable(rankings, 'K').slice(0, 10),
      },
      valuePicks: getValuePicks(rankings, currentPick),
      tierBreakdown: getTierBreakdown(rankings),
      scarcityAlerts: getScarcityAlerts(rankings),
      riskAnalysis: getRiskAnalysis(rankings),
      positionRun: detectPositionRun(draftLog),
      rosterAdvice: getRosterAdvice(myRoster, rankings, currentRound),
      draftGrade: calculateDraftGrade(myPicks),
    };
  }, [rankings, currentPick, currentRound, draftLog, myPicks, myRoster]);
}
