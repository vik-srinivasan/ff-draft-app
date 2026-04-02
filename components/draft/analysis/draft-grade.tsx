'use client';

import type { DraftGrade } from '@/lib/types';

export default function DraftGradeDisplay({ grade }: { grade: DraftGrade }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-4 bg-surface rounded-lg">
      <span className="text-3xl font-extrabold text-accent">{grade.grade}</span>
      <span className="text-xs text-text-secondary">{grade.desc}</span>
    </div>
  );
}
