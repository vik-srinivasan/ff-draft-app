import type {
  Player, Rankings, DraftLogEntry, Roster, ValuePlayer,
  ScarcityAlert, RiskAnalysis, PositionRun, RosterNeed,
  DraftGrade, ConsensusIndicator, Availability,
} from './types';

export function getBestAvailable(rankings: Rankings, position?: string): Player[] {
  let available = rankings.players.filter(p => !p.drafted);
  if (position) available = available.filter(p => p.pos === position);
  return available.sort((a, b) => a.rank - b.rank);
}

export function getValuePicks(rankings: Rankings, currentPick: number): ValuePlayer[] {
  return rankings.players
    .filter(p => !p.drafted && p.avg <= currentPick + 24)
    .map(p => ({ ...p, value: Math.round(p.avg - p.rank) }))
    .filter(p => p.value > 2)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

export function getTierBreakdown(rankings: Rankings): Record<string, Record<number, { remaining: number; players: Player[] }>> {
  const breakdown: Record<string, Record<number, { remaining: number; players: Player[] }>> = {};
  const positions = ['QB', 'RB', 'WR', 'TE', 'DST', 'K'];

  for (const pos of positions) {
    breakdown[pos] = {};
    const posPlayers = rankings.players.filter(p => p.pos === pos && !p.drafted);

    posPlayers.forEach(p => {
      if (!breakdown[pos][p.tier]) {
        breakdown[pos][p.tier] = { remaining: 0, players: [] };
      }
      breakdown[pos][p.tier].remaining++;
      breakdown[pos][p.tier].players.push(p);
    });
  }
  return breakdown;
}

export function getScarcityAlerts(rankings: Rankings): ScarcityAlert[] {
  const alerts: ScarcityAlert[] = [];
  const tiers = getTierBreakdown(rankings);

  for (const pos of ['QB', 'RB', 'WR', 'TE']) {
    const posTiers = tiers[pos];
    const activeTiers = Object.keys(posTiers).map(Number).sort((a, b) => a - b);
    if (activeTiers.length === 0) continue;

    const bestTier = activeTiers[0];
    const remaining = posTiers[bestTier].remaining;
    const nextTier = activeTiers.length > 1 ? activeTiers[1] : null;

    if (remaining <= 2) {
      alerts.push({
        position: pos,
        tier: bestTier,
        remaining,
        severity: remaining === 1 ? 'critical' : 'warning',
        message: remaining === 1
          ? `LAST Tier-${bestTier} ${pos}!`
          : `Only ${remaining} Tier-${bestTier} ${pos}s left`,
        nextTierInfo: nextTier
          ? `Next: Tier ${nextTier} (${posTiers[nextTier].remaining})`
          : 'No more tiers!',
      });
    }
  }
  return alerts.sort((a, b) => a.remaining - b.remaining);
}

export function getRiskAnalysis(rankings: Rankings): RiskAnalysis {
  const allAvail = getBestAvailable(rankings);
  const posLimits: Record<string, number> = { QB: 1, RB: 2, WR: 2, TE: 1, DST: 0, K: 0 };
  const posCounts: Record<string, number> = { QB: 0, RB: 0, WR: 0, TE: 0, DST: 0, K: 0 };
  const pool: Player[] = [];

  for (const p of allAvail) {
    const limit = posLimits[p.pos];
    if (limit === undefined || limit === 0) continue;
    if (posCounts[p.pos] >= limit) continue;
    posCounts[p.pos]++;
    pool.push(p);
    if (pool.length >= 20) break;
  }

  if (pool.length === 0) return { safePicks: [], boomBust: [], avgStdDev: 0 };

  const avgStdDev = pool.reduce((sum, p) => sum + p.stddev, 0) / pool.length;

  return {
    safePicks: pool
      .filter(p => p.stddev < avgStdDev * 0.6)
      .sort((a, b) => a.stddev - b.stddev)
      .slice(0, 5),
    boomBust: pool
      .filter(p => p.stddev > avgStdDev * 1.5)
      .sort((a, b) => b.stddev - a.stddev)
      .slice(0, 5),
    avgStdDev,
  };
}

export function getConsensusIndicator(player: Player): ConsensusIndicator {
  const spread = player.worst - player.best;
  if (spread <= 5) return { label: 'LOCKED IN', color: '#2ecc71' };
  if (spread <= 15) return { label: 'CONSENSUS', color: '#3498db' };
  if (spread <= 30) return { label: 'DIVISIVE', color: '#f39c12' };
  return { label: 'WILD CARD', color: '#e74c3c' };
}

export function estimateAvailability(player: Player, currentPick: number, totalTeams: number = 12): Availability {
  const picksLeft = Math.max(0, Math.round(player.avg - currentPick));
  const roundsLeft = Math.max(0, Math.floor(picksLeft / totalTeams));
  let urgency: Availability['urgency'] = 'WAIT';
  if (picksLeft <= totalTeams) urgency = 'NOW';
  else if (picksLeft <= totalTeams * 2) urgency = 'SOON';
  return { picksLeft, roundsLeft, urgency };
}

export function detectPositionRun(draftLog: DraftLogEntry[]): PositionRun | null {
  if (draftLog.length < 3) return null;

  const lastN = draftLog.slice(-5);
  const posCounts: Record<string, number> = {};

  lastN.forEach(entry => {
    if (entry.pos) {
      posCounts[entry.pos] = (posCounts[entry.pos] || 0) + 1;
    }
  });

  for (const [pos, count] of Object.entries(posCounts)) {
    if (count >= 3) {
      return {
        position: pos,
        count,
        message: `RUN ON ${pos}! ${count} of last ${lastN.length} picks. Consider grabbing yours now.`,
      };
    }
  }
  return null;
}

export function getRosterAdvice(
  roster: Roster,
  rankings: Rankings,
  currentRound: number,
  totalRounds: number = 15
): Record<string, RosterNeed> {
  const needs: Record<string, RosterNeed> = {
    QB: { have: roster.QB?.length || 0, target: 1, priority: 0, recommendation: '' },
    RB: { have: roster.RB?.length || 0, target: 2, priority: 0, recommendation: '' },
    WR: { have: roster.WR?.length || 0, target: 2, priority: 0, recommendation: '' },
    TE: { have: roster.TE?.length || 0, target: 1, priority: 0, recommendation: '' },
    DST: { have: roster.DST?.length || 0, target: 1, priority: 0, recommendation: '' },
    K: { have: roster.K?.length || 0, target: 1, priority: 0, recommendation: '' },
  };

  const remainingPicks = totalRounds - currentRound + 1;

  for (const pos of Object.keys(needs)) {
    const n = needs[pos];
    const deficit = n.target - n.have;

    if (deficit <= 0) {
      n.priority = 0;
      n.recommendation = 'FILLED';
    } else {
      n.priority = deficit / Math.max(remainingPicks, 1);
      const bestAvail = getBestAvailable(rankings, pos);
      const bestTier = bestAvail.length > 0 ? bestAvail[0].tier : 99;

      if (n.have === 0 && currentRound > 6) {
        n.recommendation = `URGENT: No ${pos}, best is Tier ${bestTier}`;
      } else if (remainingPicks <= deficit + 2) {
        n.recommendation = `FILL NOW: ${deficit} ${pos} needed, ${remainingPicks} picks left`;
      } else {
        n.recommendation = `Need ${deficit} more`;
      }
    }
  }
  return needs;
}

export function calculateDraftGrade(myPicks: Player[]): DraftGrade {
  if (!myPicks || myPicks.length === 0) return { grade: '--', score: 0, desc: 'No picks yet' };

  let totalValue = 0;
  myPicks.forEach(player => {
    totalValue += (player.avg - player.rank);
  });

  const avgValue = totalValue / myPicks.length;

  if (avgValue >= 15) return { grade: 'A+', score: avgValue, desc: 'Stealing the draft' };
  if (avgValue >= 8) return { grade: 'A', score: avgValue, desc: 'Excellent value' };
  if (avgValue >= 4) return { grade: 'B+', score: avgValue, desc: 'Above average' };
  if (avgValue >= 0) return { grade: 'B', score: avgValue, desc: 'Solid picks' };
  if (avgValue >= -4) return { grade: 'C+', score: avgValue, desc: 'Slight reaches' };
  if (avgValue >= -8) return { grade: 'C', score: avgValue, desc: 'Reaching' };
  return { grade: 'D', score: avgValue, desc: 'Significant overdrafts' };
}
