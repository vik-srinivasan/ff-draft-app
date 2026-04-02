'use client';

import { useAnalytics } from '@/hooks/use-analytics';
import { useDraftStore } from '@/stores/draft-store';
import ScarcityAlerts from './scarcity-alerts';
import TierCountdown from './tier-countdown';
import ValuePicks from './value-picks';
import RiskRadar from './risk-radar';
import RosterAdvice from './roster-advice';
import DraftGradeDisplay from './draft-grade';
import PositionRunAlert from './position-run';
import MyPicks from './my-picks';

export default function AnalysisTab() {
  const analytics = useAnalytics();
  const { myPicks } = useDraftStore();

  if (!analytics) {
    return <div className="p-4 text-text-muted text-sm">Upload a CSV to get started</div>;
  }

  return (
    <div className="px-2 pb-4 space-y-1">
      <ScarcityAlerts alerts={analytics.scarcityAlerts} />
      <PositionRunAlert run={analytics.positionRun} />

      <SectionTitle>Tier Countdown</SectionTitle>
      <TierCountdown breakdown={analytics.tierBreakdown} />

      <SectionTitle>Value Picks (Falling Players)</SectionTitle>
      <ValuePicks picks={analytics.valuePicks} />

      <SectionTitle>Risk Radar</SectionTitle>
      <RiskRadar analysis={analytics.riskAnalysis} />

      <SectionTitle>Roster Needs</SectionTitle>
      <RosterAdvice advice={analytics.rosterAdvice} />

      <SectionTitle>Draft Grade</SectionTitle>
      <DraftGradeDisplay grade={analytics.draftGrade} />

      <SectionTitle>My Picks</SectionTitle>
      <MyPicks picks={myPicks} />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-wider text-accent mt-4 mb-1.5 pb-1 border-b border-border">
      {children}
    </h3>
  );
}
