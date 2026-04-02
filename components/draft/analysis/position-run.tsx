'use client';

import type { PositionRun } from '@/lib/types';

export default function PositionRunAlert({ run }: { run: PositionRun | null }) {
  if (!run) return null;

  return (
    <div className="py-2 px-3 rounded text-xs font-semibold bg-info/15 border-l-3 border-info text-info">
      {run.message}
    </div>
  );
}
