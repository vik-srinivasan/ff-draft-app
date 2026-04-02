'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DraftHeader from '@/components/draft/header';
import Tabs from '@/components/draft/tabs';
import BoardTab from '@/components/draft/board/board-tab';
import AnalysisTab from '@/components/draft/analysis/analysis-tab';
import QATab from '@/components/draft/qa/qa-tab';
import { useDraftStore } from '@/stores/draft-store';
import { useDraftPoller } from '@/hooks/use-draft-poller';

export default function DraftPage() {
  const [activeTab, setActiveTab] = useState('board');
  const { rankings, loadRankings } = useDraftStore();
  const router = useRouter();

  // Start polling if connected to a platform
  useDraftPoller(5000);

  // Restore CSV from localStorage if needed
  useEffect(() => {
    if (!rankings) {
      try {
        const saved = localStorage.getItem('ff_csv');
        if (saved) {
          loadRankings(saved);
        } else {
          router.push('/');
        }
      } catch {
        router.push('/');
      }
    }
  }, [rankings, loadRankings, router]);

  if (!rankings) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-muted">
        Loading rankings...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <DraftHeader />
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'board' && <BoardTab />}
        {activeTab === 'analysis' && <AnalysisTab />}
        {activeTab === 'qa' && <QATab />}
      </main>
    </div>
  );
}
