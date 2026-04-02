'use client';

import { useState } from 'react';
import { useConnectionStore } from '@/stores/connection-store';

export default function EspnConnect() {
  const { espnStatus, espnError, espnLeagueId, connectEspn, disconnectEspn, setEspnStatus } = useConnectionStore();
  const [leagueId, setLeagueId] = useState('');
  const [seasonId, setSeasonId] = useState(String(new Date().getFullYear()));
  const [s2Cookie, setS2Cookie] = useState('');
  const [swidCookie, setSwidCookie] = useState('');
  const [teamId, setTeamId] = useState('');
  const [showCookies, setShowCookies] = useState(false);

  const handleConnect = async () => {
    const lid = leagueId.trim();
    if (!lid) return;

    connectEspn(
      lid,
      parseInt(seasonId),
      s2Cookie.trim() || undefined,
      swidCookie.trim() || undefined,
      teamId ? parseInt(teamId) : undefined,
    );

    try {
      const params = new URLSearchParams({ leagueId: lid, seasonId });
      if (s2Cookie.trim()) params.set('espn_s2', s2Cookie.trim());
      if (swidCookie.trim()) params.set('swid', swidCookie.trim());

      const res = await fetch(`/api/espn/draft?${params}`);
      if (!res.ok) throw new Error('Could not fetch ESPN draft data');
      setEspnStatus('active');
    } catch (err) {
      setEspnStatus('error', (err as Error).message);
    }
  };

  const isConnected = espnStatus === 'active';

  return (
    <div className="rounded-lg bg-surface border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-accent">ESPN</h3>
        <StatusBadge status={espnStatus} />
      </div>

      {isConnected ? (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">
            League: <span className="font-mono">{espnLeagueId}</span>
          </p>
          <button
            onClick={disconnectEspn}
            className="text-xs text-text-muted hover:text-negative transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-text-muted mb-1">League ID</label>
            <input
              type="text"
              value={leagueId}
              onChange={(e) => setLeagueId(e.target.value)}
              placeholder="e.g. 12345678"
              className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text focus:border-accent outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Season</label>
              <input
                type="text"
                value={seasonId}
                onChange={(e) => setSeasonId(e.target.value)}
                className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text focus:border-accent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Your Team ID</label>
              <input
                type="number"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                placeholder="optional"
                className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text focus:border-accent outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCookies(!showCookies)}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            {showCookies ? 'Hide' : 'Show'} private league cookies
          </button>

          {showCookies && (
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-text-muted mb-1">espn_s2 cookie</label>
                <input
                  type="text"
                  value={s2Cookie}
                  onChange={(e) => setS2Cookie(e.target.value)}
                  placeholder="For private leagues only"
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-xs text-text focus:border-accent outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">SWID cookie</label>
                <input
                  type="text"
                  value={swidCookie}
                  onChange={(e) => setSwidCookie(e.target.value)}
                  placeholder="For private leagues only"
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-xs text-text focus:border-accent outline-none font-mono"
                />
              </div>
              <p className="text-xs text-text-dim">
                Find these in DevTools → Application → Cookies → espn.com
              </p>
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={!leagueId.trim() || espnStatus === 'connecting'}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-semibold rounded py-2 transition-colors"
          >
            {espnStatus === 'connecting' ? 'Connecting...' : 'Connect'}
          </button>
          {espnError && <p className="text-xs text-negative">{espnError}</p>}
          <p className="text-xs text-text-dim">
            Public leagues need no cookies. Private leagues require espn_s2 + SWID.
          </p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    disconnected: 'bg-text-dim',
    connecting: 'bg-warning',
    active: 'bg-positive',
    error: 'bg-negative',
  };
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${colors[status] || 'bg-text-dim'}`} />
      <span className="text-xs text-text-muted capitalize">{status}</span>
    </div>
  );
}
