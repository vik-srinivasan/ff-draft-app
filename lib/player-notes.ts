import notes from '@/data/player-notes.json';

const playerNotes: Record<string, string> = { ...notes };
delete playerNotes['EXAMPLE_PLAYER'];

export function getPlayerNote(name: string): string | undefined {
  return playerNotes[name];
}

export { playerNotes };
