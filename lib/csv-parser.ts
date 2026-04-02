import type { Player, Rankings } from './types';

function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  result.push(current.trim());
  return result;
}

function buildIndexes(players: Player[]): Rankings {
  const tiers: Record<number, Record<string, number[]>> = {};
  const byPosition: Record<string, number[]> = {};
  const nameIndex: Record<string, number> = {};

  players.forEach((player, idx) => {
    if (!tiers[player.tier]) tiers[player.tier] = {};
    if (!tiers[player.tier][player.pos]) tiers[player.tier][player.pos] = [];
    tiers[player.tier][player.pos].push(idx);

    if (!byPosition[player.pos]) byPosition[player.pos] = [];
    byPosition[player.pos].push(idx);

    nameIndex[player.name.toLowerCase()] = idx;
  });

  return { players, tiers, byPosition, nameIndex };
}

export function parseCSV(csvText: string): Rankings {
  const lines = csvText.split(/\r?\n/);
  const players: Player[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseLine(line);
    if (!fields || fields.length < 10) continue;

    const rank = parseInt(fields[0]);
    if (isNaN(rank)) continue;

    const posMatch = fields[4].match(/^([A-Z]+)(\d+)$/);
    if (!posMatch) continue;

    players.push({
      rank,
      tier: parseInt(fields[1]),
      name: fields[2].replace(/[.'''\-]/g, '').replace(/\s+/g, ' ').trim(),
      team: fields[3],
      pos: posMatch[1] as Player['pos'],
      posRank: parseInt(posMatch[2]),
      posLabel: fields[4],
      best: parseInt(fields[5]),
      worst: parseInt(fields[6]),
      avg: parseFloat(fields[7]),
      stddev: parseFloat(fields[8]),
      ecrVsAdp: fields[9] === '-' ? null : parseFloat(fields[9]),
      drafted: false,
      draftedBy: null,
      draftPick: null,
    });
  }

  return buildIndexes(players);
}
