'use client';

import { useCallback, useState } from 'react';
import { useDraftStore } from '@/stores/draft-store';

export default function CSVUpload() {
  const { rankings, loadRankings } = useDraftStore();
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        loadRankings(text);
      } catch (err) {
        setError('Failed to parse CSV: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
  }, [loadRankings]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const playerCount = rankings?.players.length ?? 0;
  const isLoaded = playerCount > 0;

  return (
    <div className="rounded-lg bg-surface border border-border p-5">
      <h3 className="text-sm font-bold uppercase tracking-wide text-accent mb-3">
        Rankings CSV
      </h3>

      {isLoaded ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-positive" />
            <span className="text-sm text-text-secondary">
              {playerCount} players loaded
            </span>
          </div>
          <label className="block text-xs text-text-muted cursor-pointer hover:text-text-secondary transition-colors">
            Upload new CSV to replace
            <input
              type="file"
              accept=".csv"
              onChange={handleChange}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-accent bg-accent/10' : 'border-border hover:border-text-muted'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('csv-input')?.click()}
        >
          <p className="text-sm text-text-muted mb-1">
            Drop FantasyPros CSV here or click to browse
          </p>
          <p className="text-xs text-text-dim">
            Export from fantasypros.com/nfl/rankings/consensus-cheatsheets.php
          </p>
          <input
            id="csv-input"
            type="file"
            accept=".csv"
            onChange={handleChange}
            className="hidden"
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-negative mt-2">{error}</p>
      )}
    </div>
  );
}
