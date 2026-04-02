'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import CSVUpload from '@/components/setup/csv-upload';
import SleeperConnect from '@/components/setup/sleeper-connect';
import EspnConnect from '@/components/setup/espn-connect';
import YahooConnect from '@/components/setup/yahoo-connect';
import { useDraftStore } from '@/stores/draft-store';
import { useConnectionStore } from '@/stores/connection-store';

export default function SetupPage() {
  const { rankings, loadRankings } = useDraftStore();
  const { sleeperStatus, espnStatus, yahooStatus } = useConnectionStore();

  // Restore CSV from localStorage on mount
  useEffect(() => {
    if (!rankings) {
      try {
        const saved = localStorage.getItem('ff_csv');
        if (saved) loadRankings(saved);
      } catch { /* ignore */ }
    }
  }, [rankings, loadRankings]);

  const hasRankings = rankings && rankings.players.length > 0;
  const hasConnection = sleeperStatus === 'active' || espnStatus === 'active' || yahooStatus === 'active';
  const canStart = hasRankings;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-surface border-b-2 border-accent px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-accent tracking-wider">
              FF DRAFT ANALYST
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              FantasyPros-powered live draft assistant
            </p>
          </div>
          {canStart && (
            <Link
              href="/draft"
              className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors"
            >
              {hasConnection ? 'Open Draft Dashboard' : 'Open Dashboard (Manual Mode)'}
            </Link>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Step 1: Rankings */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-accent text-white text-sm font-bold">1</span>
              <h2 className="text-base font-bold text-text">Upload Your Rankings</h2>
            </div>
            <CSVUpload />
          </section>

          {/* Step 2: Connect */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                hasRankings ? 'bg-accent text-white' : 'bg-border text-text-muted'
              }`}>2</span>
              <h2 className={`text-base font-bold ${hasRankings ? 'text-text' : 'text-text-muted'}`}>
                Connect to a Live Draft
              </h2>
              <span className="text-xs text-text-dim">(optional — you can track manually)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SleeperConnect />
              <EspnConnect />
              <YahooConnect />
            </div>
          </section>

          {/* Start */}
          {canStart && (
            <section className="text-center pt-4">
              <Link
                href="/draft"
                className="inline-block bg-accent hover:bg-accent-hover text-white text-base font-bold rounded-lg px-8 py-3 transition-colors"
              >
                {hasConnection ? 'Start Draft Dashboard' : 'Start in Manual Mode'}
              </Link>
              {!hasConnection && (
                <p className="text-xs text-text-dim mt-2">
                  In manual mode, right-click players to mark them as drafted
                </p>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
