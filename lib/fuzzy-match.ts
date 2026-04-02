import type { Player } from './types';

let index: Map<string, number> | null = null;

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.'''\-`]/g, '')
    .replace(/\s+(jr|sr|ii|iii|iv|v)\.?$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateVariants(name: string): Set<string> {
  const base = normalize(name);
  const variants = new Set([base]);

  const noSuffix = base.replace(/\s+(jr|sr|ii|iii|iv|v)$/i, '').trim();
  variants.add(noSuffix);

  variants.add(base.replace(/\s+/g, ' '));

  const parts = base.split(' ');
  if (parts.length >= 2) {
    const lastName = parts[parts.length - 1];
    variants.add(parts[0][0] + ' ' + lastName);
    variants.add(lastName);
  }

  return variants;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => {
    const row = new Array(n + 1);
    row[0] = i;
    return row;
  });
  for (let j = 1; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function buildIndex(players: Player[]): void {
  index = new Map();
  players.forEach((player, i) => {
    const variants = generateVariants(player.name);
    variants.forEach(v => {
      if (!index!.has(v)) index!.set(v, i);
    });
  });
}

export function findMatch(name: string): number {
  if (!index) return -1;

  const normalized = normalize(name);

  if (index.has(normalized)) return index.get(normalized)!;

  const noSuffix = normalized.replace(/\s+(jr|sr|ii|iii|iv|v)$/i, '').trim();
  if (index.has(noSuffix)) return index.get(noSuffix)!;

  const parts = normalized.split(' ');
  if (parts.length >= 2 && parts[0].length <= 2) {
    const initial = parts[0][0];
    const lastName = parts[parts.length - 1];
    for (const [variant, idx] of index) {
      const vParts = variant.split(' ');
      if (vParts.length >= 2 &&
          vParts[0][0] === initial &&
          vParts[vParts.length - 1] === lastName) {
        return idx;
      }
    }
  }

  let bestMatch = -1;
  let bestScore = Infinity;
  for (const [variant, idx] of index) {
    if (Math.abs(variant.length - normalized.length) > 4) continue;
    const dist = levenshtein(normalized, variant);
    if (dist < bestScore && dist <= 3) {
      bestScore = dist;
      bestMatch = idx;
    }
  }
  return bestMatch;
}

export function normalizeName(name: string): string {
  return normalize(name);
}
