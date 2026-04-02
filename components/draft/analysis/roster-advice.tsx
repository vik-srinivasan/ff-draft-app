'use client';

import type { RosterNeed } from '@/lib/types';

export default function RosterAdvice({ advice }: { advice: Record<string, RosterNeed> }) {
  if (!advice) return null;

  return (
    <div className="flex flex-col gap-0.5">
      {Object.entries(advice).map(([pos, info]) => {
        let statusClass = 'text-text-muted';
        if (info.recommendation === 'FILLED') statusClass = 'text-positive';
        else if (info.priority > 0.3) statusClass = 'text-negative font-semibold';

        return (
          <div key={pos} className="flex justify-between items-center py-1.5 px-2 bg-surface rounded text-xs">
            <span className="font-bold w-8">{pos}</span>
            <span>{info.have}/{info.target}</span>
            <span className={statusClass}>{info.recommendation}</span>
          </div>
        );
      })}
    </div>
  );
}
