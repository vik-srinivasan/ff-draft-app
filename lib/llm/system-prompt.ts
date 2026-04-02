import type { Player, DraftLogEntry, Roster } from '@/lib/types';
import { getPlayerNote } from '@/lib/player-notes';

export const SYSTEM_PROMPT = [
  'You are a fantasy football draft analyst for the current NFL season.',
  'The user is mid-draft and needs fast, actionable advice.',
  'Be concise: 2-3 sentences max.',
  '',
  'CRITICAL RULES:',
  '- Only reference facts you are confident about. If you are unsure about a player detail (injury, team, depth chart), say so rather than guessing.',
  '- Do NOT fabricate stats, injuries, trades, or roster moves. If you do not know, say "I\'m not sure about the latest on that."',
  '- Use the ranking data provided below as your primary source of truth for draft value analysis.',
  '- The ranking data is from FantasyPros expert consensus rankings (ECR) for the current season.',
  '- ADP = Average Draft Position across leagues. FP Rank = FantasyPros expert consensus rank.',
  '- Value = ADP minus Rank. Positive value means experts rank the player higher than where they typically get drafted (a steal). Negative means they are being drafted higher than experts suggest (a reach).',
  '- StdDev measures how much experts disagree. Low = consensus, High = divisive/boom-bust.',
  '- Best/Worst = the range of where experts rank this player.',
  '- You are given the full draft log and the next-ranked available players at this position. Use them to give contextual advice.',
  '- If a USER NOTE is provided for the player, treat it as a verified fact from the user and incorporate it into your answer.',
].join('\n');

export interface LLMContext {
  playerContext: Player | null;
  draftContext: { currentPick: number; round: number; roster: Roster } | null;
  nextRanked: Player[];
  draftLog: DraftLogEntry[];
  myPicks: Player[];
}

export function buildContextString(ctx: LLMContext): string {
  let contextStr = '';

  if (ctx.playerContext) {
    const p = ctx.playerContext;
    const value = Math.round(p.avg - p.rank);
    const valueLabel = value > 0
      ? `UNDERVALUED by ${value} spots`
      : value < 0 ? `OVERDRAFTED by ${Math.abs(value)} spots` : 'FAIR VALUE';

    contextStr += `Player: ${p.name} (${p.team}, ${p.posLabel})\n`;
    contextStr += `FP Expert Rank: #${p.rank} | Tier: ${p.tier}\n`;
    contextStr += `ADP: ${p.avg} | Value: ${valueLabel}\n`;
    contextStr += `Expert Range: Best #${p.best} / Worst #${p.worst} | StdDev: ${p.stddev}\n`;

    const note = getPlayerNote(p.name);
    if (note) {
      contextStr += `USER NOTE: ${note}\n`;
    }
  }

  if (ctx.nextRanked && ctx.nextRanked.length > 0) {
    contextStr += `\nNext available at ${ctx.playerContext ? ctx.playerContext.pos : 'this position'}:\n`;
    ctx.nextRanked.forEach(p => {
      contextStr += `  #${p.rank} ${p.name} (${p.team}, ${p.posLabel}) Tier ${p.tier} | ADP: ${p.avg} | StdDev: ${p.stddev}\n`;
    });
  }

  if (ctx.draftLog && ctx.draftLog.length > 0) {
    contextStr += '\nDraft log (picks made so far):\n';
    ctx.draftLog.forEach(p => {
      if (p.pos) {
        contextStr += `  ${p.name} (${p.pos}, Rank #${p.rank})\n`;
      } else {
        contextStr += `  ${p.name} (unranked)\n`;
      }
    });
  }

  if (ctx.myPicks && ctx.myPicks.length > 0) {
    contextStr += '\nMy drafted players:\n';
    ctx.myPicks.forEach(p => {
      contextStr += `  ${p.name} (${p.posLabel})\n`;
    });
  }

  if (ctx.draftContext) {
    contextStr += `\nCurrent Overall Pick: ${ctx.draftContext.currentPick} | Round: ${ctx.draftContext.round}\n`;
    if (ctx.draftContext.roster) {
      const rosterSummary: string[] = [];
      for (const [pos, players] of Object.entries(ctx.draftContext.roster)) {
        if (players && players.length > 0) {
          rosterSummary.push(`${pos}: ${players.map((p: Player) => p.name).join(', ')}`);
        }
      }
      if (rosterSummary.length > 0) {
        contextStr += `My Roster: ${rosterSummary.join(' | ')}\n`;
      }
    }
  }

  return contextStr;
}
