# FF Draft Analyst

Next.js web app that connects to live fantasy football drafts on **Sleeper**, **ESPN**, and **Yahoo** with real-time analytics powered by your FantasyPros rankings CSV and AI-driven player Q&A.

## Features

- **Best Available Board** — Your FantasyPros rankings with position filters and ADP value differential
- **Tier Countdown** — Players remaining per tier per position (QB, RB, WR, TE)
- **Scarcity Alerts** — Warns when a position's tier is almost empty
- **Value Picks** — Players falling in the draft relative to expert consensus
- **Risk Radar** — Safe picks (low StdDev) vs boom/bust (high StdDev) from next 20 available
- **Position Run Detection** — Alerts when 3+ of last 5 picks are the same position
- **Live Draft Grade** — Grades your picks based on ADP value
- **AI Player Q&A** — Click any player and ask questions powered by Claude Haiku
- **Player Notes** — Add custom notes per player (injuries, suspensions, etc.) via JSON
- **Live Draft Sync** — Connects to Sleeper, ESPN, and Yahoo drafts with 5-second polling
- **Manual Mode** — Works without a platform connection (right-click to mark picks)

## Platform Support

| Platform | Auth | How to Connect |
|----------|------|----------------|
| **Sleeper** | None (public API) | Paste your draft ID |
| **ESPN** | Cookies for private leagues | Paste league ID + optional `espn_s2` / `SWID` cookies |
| **Yahoo** | OAuth 2.0 | Click "Connect with Yahoo" and log in |

## Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd ff-draft-app
npm install

# 2. Add your API keys
cp .env.local.example .env.local
# Edit .env.local with your Anthropic API key (required) and Yahoo credentials (optional)

# 3. Run
npm run dev
# Open http://localhost:3000
```

## Environment Variables

```bash
# Required — for AI player Q&A
ANTHROPIC_API_KEY=sk-ant-...

# Optional — for Yahoo OAuth (register at https://developer.yahoo.com/apps/)
YAHOO_CLIENT_ID=...
YAHOO_CLIENT_SECRET=...
YAHOO_REDIRECT_URI=http://localhost:3000/api/yahoo/callback
```

## Usage

1. **Upload CSV** — Export rankings from [FantasyPros](https://www.fantasypros.com/nfl/rankings/consensus-cheatsheets.php) and drag-drop on the setup page
2. **Connect to a draft** — Enter your Sleeper draft ID, ESPN league ID, or connect via Yahoo OAuth
3. **Open the dashboard** — Board, Analysis, and Q&A tabs update in real-time as picks come in
4. **Ask AI about players** — Click a player on the Board tab, then use quick buttons or type a custom question

## Player Notes

Edit `data/player-notes.json` to add context that gets fed into AI calls:

```json
{
  "Cam Skattebo": "Tore ACL in 2025. Recovery timeline is a factor.",
  "Rashee Rice": "Suspended first 6 games."
}
```

## CSV Format

Expects FantasyPros draft rankings export with columns:

`RK, TIERS, PLAYER NAME, TEAM, POS, BEST, WORST, AVG., STD.DEV, ECR VS. ADP`

## Architecture

See [WORKFLOW.md](./WORKFLOW.md) for a detailed breakdown of how each platform connection works.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind CSS)
- Zustand for state management
- Anthropic SDK (Claude Haiku) for player Q&A
- Sleeper / ESPN / Yahoo Fantasy APIs
