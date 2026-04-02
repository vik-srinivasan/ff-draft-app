# FF Draft Analyst — How It Works

## Overview

The app has two phases: **Setup** (upload rankings + connect to a draft) and **Draft Dashboard** (live analytics + AI Q&A). Data flows through a layered architecture:

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌─────────────┐
│  Setup Page  │────▶│  Connection  │────▶│  Platform APIs   │────▶│  Polling     │
│  (CSV + IDs) │     │  Store       │     │  (Sleeper/ESPN/  │     │  Hook        │
└─────────────┘     └──────────────┘     │   Yahoo)         │     └──────┬──────┘
                                          └─────────────────┘            │
                                                                         ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌─────────────┐
│  Draft UI    │◀────│  Analytics   │◀────│  Draft Store     │◀────│  Adapter     │
│  (Board/     │     │  Hook        │     │  (rankings,      │     │  (normalize  │
│   Analysis/  │     │  (memoized)  │     │   draftLog,      │     │   picks)     │
│   Q&A)       │     └──────────────┘     │   myPicks)       │     └─────────────┘
└─────────────┘                           └─────────────────┘
```

### Step-by-step

1. **Upload CSV** — FantasyPros rankings parsed into player objects with tiers, ADP, StdDev. Stored in Zustand + localStorage.
2. **Connect to platform** — User provides draft ID (Sleeper), league ID + cookies (ESPN), or logs in via OAuth (Yahoo).
3. **Polling starts** — Every 5 seconds, the polling hook calls the platform adapter, which fetches new picks via our API route proxy.
4. **Adapter normalizes** — Platform-specific pick data → standard `PlatformDraftPick` format. Player names are stripped of punctuation.
5. **Fuzzy match** — Normalized names matched against FantasyPros CSV using exact match, variant match, or Levenshtein fallback.
6. **Draft store updates** — Players marked as drafted. User's picks tracked separately in roster.
7. **Analytics recompute** — `useAnalytics` hook derives best available, value picks, scarcity alerts, risk radar, tier countdown, draft grade.
8. **UI renders** — Board, Analysis, and Q&A tabs show live-updated data.

---

## Setup Page (`/`)

The landing page has two steps:

**Step 1: Upload Rankings CSV**
- Drag-drop or file picker for FantasyPros export
- CSV parsed client-side via `lib/csv-parser.ts`
- Builds player index for fuzzy matching
- Persisted to localStorage for page refreshes

**Step 2: Connect to a Live Draft** (optional)
- Three platform cards: Sleeper, ESPN, Yahoo
- Can connect to multiple but only one is active for polling
- If no connection: "Manual Mode" — right-click players to mark as drafted, double-click for your picks

---

## Sleeper

**Auth:** None. Sleeper's API is completely public and free.

**User provides:** Draft ID (from the Sleeper app URL, e.g. `1130615382056697856`) and optionally their draft slot number.

**Flow:**

```
User enters Draft ID
  → SleeperConnect validates via GET /api/sleeper/draft/{draftId}
  → Our API route proxies to:
      - https://api.sleeper.app/v1/draft/{draftId}       (draft metadata)
      - https://api.sleeper.app/v1/draft/{draftId}/picks  (all picks)
  → Connection store: status = 'active', pollingEnabled = true

Every 5 seconds:
  → Polling hook calls createSleeperAdapter().fetchDraftState()
  → Adapter fetches /api/sleeper/draft/{draftId}
  → Adapter loads player DB from /api/sleeper/players (cached 24h server-side)
      - Sleeper player DB is 5MB; we slim it to {full_name, team, position}
  → Maps player_id → full_name via player DB
  → Normalizes names: "Ja'Marr Chase" → "JaMarr Chase"
  → Identifies user's picks by matching draft_slot to user's slot
  → Returns PlatformDraftState with normalized picks

  → Polling hook processes only NEW picks (tracks lastPickCount)
  → Calls markDrafted(playerName, "round.pick", isMyPick) for each
  → FuzzyMatch resolves name against CSV rankings
  → Draft store updated → UI re-renders
```

**Key endpoints:**
| Endpoint | Purpose |
|---|---|
| `GET /v1/draft/{id}` | Draft settings (teams, rounds, status, draft_order) |
| `GET /v1/draft/{id}/picks` | Array of picks with player_id, round, draft_slot, picked_by |
| `GET /v1/players/nfl` | Full player database (5MB, cached 24h) |

**Limitations:**
- No way to identify which user "you" are without knowing your draft slot
- Read-only API — can't make picks through it
- No WebSocket — must poll

---

## ESPN

**Auth:** None for public leagues. Private leagues require `espn_s2` and `SWID` cookies from the browser.

**User provides:** League ID, season year, and optionally cookies + team ID.

**Flow:**

```
User enters League ID (+ optional cookies for private leagues)
  → EspnConnect validates via GET /api/espn/draft?leagueId=...&seasonId=...
  → Our API route proxies to:
      https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/
        seasons/{season}/segments/0/leagues/{leagueId}
        ?view=mDraftDetail&view=mTeam
  → If private league: forwards espn_s2 and SWID as Cookie header
  → Connection store: status = 'active', pollingEnabled = true

Every 5 seconds:
  → Polling hook calls createEspnAdapter().fetchDraftState()
  → Adapter fetches /api/espn/draft with credentials as query params
  → Extracts player names from response's data.players array
      - Maps playerId → fullName (or firstName + lastName)
  → Normalizes picks from data.draftDetail.picks:
      - overallPickNumber, roundId, roundPickNumber, playerId, teamId
  → Identifies user's picks by matching teamId to user's team ID
  → Returns PlatformDraftState

  → Same polling → markDrafted → FuzzyMatch → UI flow as Sleeper
```

**Getting cookies for private leagues:**
1. Sign into ESPN in your browser
2. Open DevTools → Application → Cookies → espn.com
3. Copy `espn_s2` value (long string)
4. Copy `SWID` value (looks like `{XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}`)
5. Paste into the ESPN connection form

**Key differences from Sleeper:**
- Player names come embedded in the API response — no separate player DB needed
- Undocumented API — endpoints may change without notice
- Cookie auth is session-based and expires

---

## Yahoo

**Auth:** OAuth 2.0. Requires Yahoo Developer app credentials (`YAHOO_CLIENT_ID` and `YAHOO_CLIENT_SECRET` in `.env.local`).

**User provides:** Nothing — they click "Connect with Yahoo" and log in.

**Flow:**

```
User clicks "Connect with Yahoo"
  → Browser redirects to /api/yahoo/auth
  → Server reads YAHOO_CLIENT_ID from env
  → Redirects to Yahoo OAuth:
      https://api.login.yahoo.com/oauth2/request_auth
        ?client_id=...&redirect_uri=.../api/yahoo/callback
        &response_type=code&scope=fspt-r
  → User logs into Yahoo and grants access

Yahoo redirects back to /api/yahoo/callback?code=...
  → Server exchanges code for access token:
      POST https://api.login.yahoo.com/oauth2/get_token
      Authorization: Basic base64(clientId:clientSecret)
      Body: grant_type=authorization_code&code=...
  → Redirects to /?yahoo_token={accessToken}
  → Frontend stores token + calls connectYahoo()
  → Connection store: status = 'active', pollingEnabled = true

Every 5 seconds:
  → Polling hook calls createYahooAdapter().fetchDraftState()
  → Adapter fetches /api/yahoo/draft?leagueKey=...&accessToken=...
  → Our API route proxies to:
      https://fantasysports.yahooapis.com/fantasy/v2/
        league/{leagueKey}/draftresults?format=json
      Authorization: Bearer {accessToken}
  → Extracts picks from nested response structure
  → Returns PlatformDraftState

  → Same polling → markDrafted → FuzzyMatch → UI flow
```

**Setup requirements:**
1. Register a Yahoo Developer app at https://developer.yahoo.com/apps/
2. Set redirect URI to `http://localhost:3000/api/yahoo/callback` (or your deployed URL)
3. Add to `.env.local`:
   ```
   YAHOO_CLIENT_ID=your-client-id
   YAHOO_CLIENT_SECRET=your-client-secret
   YAHOO_REDIRECT_URI=http://localhost:3000/api/yahoo/callback
   ```

**Key differences:**
- Only platform with proper OAuth — automatically identifies the user's team
- Access tokens expire (~1 hour) — would need refresh token logic for long drafts
- Player names come as player_keys (e.g. `423.p.33394`) — needs additional lookup to resolve to human names

---

## Draft Dashboard (`/draft`)

Once connected (or in manual mode), the dashboard has three tabs:

### Board Tab
- Best available players from your FantasyPros rankings
- Position filters: ALL / QB / RB / WR / TE / DST / K
- Each row shows: rank, name, team, ADP, position badge, tier, value differential
- Value = ADP - FP Rank (positive = undervalued steal, negative = overdraft)
- **Click** a player to select for Q&A
- **Double-click** to mark as your pick
- **Right-click** to mark as drafted by someone else

### Analysis Tab
- **Scarcity Alerts** — Warns when ≤2 players left in a position's best active tier
- **Position Run Detection** — Alerts when 3+ of last 5 picks are the same position
- **Tier Countdown** — Per-position table: which tiers are active, how many players remain
- **Value Picks** — Players whose ADP is within 2 rounds of current pick but ranked much higher by experts
- **Risk Radar** — Next 20 available (capped: 1 QB, 2 RB, 2 WR, 1 TE) split into safe (low StdDev) and boom/bust (high StdDev)
- **Roster Needs** — Position-by-position targets (1 QB, 2 RB, 2 WR, 1 TE, 1 DST, 1 K) with urgency
- **Draft Grade** — A+ to D based on average value of your picks
- **My Picks** — Your roster so far

### Q&A Tab
- Shows selected player's full profile (rank, tier, ADP, StdDev, consensus indicator)
- Quick-ask buttons: Injury? / Breakout? / Wait? / Ceiling/Floor
- Free-text input for custom questions
- Sends to Claude Haiku via `/api/llm` with full context: player stats, next 5 at position, complete draft log, your roster
- Responses are grounded in ranking data with strict anti-hallucination rules

---

## LLM Integration

The Q&A tab calls `/api/llm` which uses the Anthropic SDK server-side:

```
Frontend: askLLM({ prompt, playerContext, nextRanked, draftLog, myPicks, draftContext })
  → POST /api/llm
  → Server builds context string with:
      - Player stats (rank, tier, ADP, value, StdDev, best/worst range)
      - Player notes from data/player-notes.json (if any)
      - Next 5 available at same position
      - Full draft log
      - User's drafted players
      - Current pick/round and roster
  → Calls Claude Haiku (claude-haiku-4-5-20251001, 300 max tokens)
  → Returns concise 2-3 sentence answer
```

The system prompt enforces grounding: no fabricated stats, use ranking data as truth, acknowledge uncertainty.

---

## Manual Mode

If no platform is connected, everything still works — you just track the draft yourself:
- **Right-click** a player on the Board → marks them as drafted (removes from best available)
- **Double-click** a player → marks as your pick (adds to My Picks and roster)
- All analytics update in real-time based on which players you've marked
