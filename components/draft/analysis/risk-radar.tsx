'use client';

import type { RiskAnalysis } from '@/lib/types';

export default function RiskRadar({ analysis }: { analysis: RiskAnalysis }) {
  if (!analysis.safePicks.length && !analysis.boomBust.length) {
    return <div className="text-text-dim text-xs py-2">Not enough data yet</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      {analysis.safePicks.length > 0 && (
        <div className="bg-surface rounded p-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-positive mb-1">
            Safe Picks (Low Variance)
          </div>
          {analysis.safePicks.map(p => (
            <div key={p.name} className="text-xs text-text py-0.5">
              {p.name}
              <span className="text-text-muted text-[10px] ml-1">{p.pos} | StdDev: {p.stddev}</span>
            </div>
          ))}
        </div>
      )}
      {analysis.boomBust.length > 0 && (
        <div className="bg-surface rounded p-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-negative mb-1">
            Boom/Bust (High Variance)
          </div>
          {analysis.boomBust.map(p => (
            <div key={p.name} className="text-xs text-text py-0.5">
              {p.name}
              <span className="text-text-muted text-[10px] ml-1">{p.pos} | StdDev: {p.stddev}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
