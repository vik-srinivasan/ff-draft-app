'use client';

import { useConnectionStore } from '@/stores/connection-store';

export default function YahooConnect() {
  const { yahooStatus, yahooError, yahooLeagueKey, disconnectYahoo } = useConnectionStore();

  const isConnected = yahooStatus === 'active';

  const handleConnect = () => {
    // Redirect to Yahoo OAuth
    window.location.href = '/api/yahoo/auth';
  };

  return (
    <div className="rounded-lg bg-surface border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-accent">Yahoo</h3>
        <StatusBadge status={yahooStatus} />
      </div>

      {isConnected ? (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">
            League: <span className="font-mono">{yahooLeagueKey}</span>
          </p>
          <button
            onClick={disconnectYahoo}
            className="text-xs text-text-muted hover:text-negative transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={handleConnect}
            disabled={yahooStatus === 'connecting'}
            className="w-full bg-[#6001D2] hover:bg-[#5001B2] disabled:opacity-50 text-white text-sm font-semibold rounded py-2 transition-colors"
          >
            {yahooStatus === 'connecting' ? 'Connecting...' : 'Connect with Yahoo'}
          </button>
          {yahooError && <p className="text-xs text-negative">{yahooError}</p>}
          <p className="text-xs text-text-dim">
            Requires Yahoo Developer app credentials in .env.local. OAuth 2.0 flow.
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
