'use client';

import type { ScarcityAlert } from '@/lib/types';

export default function ScarcityAlerts({ alerts }: { alerts: ScarcityAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      {alerts.map((a, i) => (
        <div
          key={i}
          className={`py-2 px-3 rounded text-xs font-semibold border-l-3 ${
            a.severity === 'critical'
              ? 'bg-negative/15 border-negative text-negative'
              : 'bg-warning/15 border-warning text-warning'
          }`}
        >
          {a.message}
          <div className="text-[10px] text-text-muted font-normal mt-0.5">{a.nextTierInfo}</div>
        </div>
      ))}
    </div>
  );
}
