export const DREAMLO_PUBLIC_CODE = 'PLACEHOLDER_PUBLIC_CODE';
export const DREAMLO_PRIVATE_CODE = 'PLACEHOLDER_PRIVATE_CODE';

const LB_CACHE_KEY = 'rogue_lb_cache';
const LB_NAME_KEY = 'rogue_lb_name';

interface LeaderboardEntry {
  name: string;
  score: number;
}

export function getLeaderboardName(): string | null {
  return localStorage.getItem(LB_NAME_KEY);
}

export function setLeaderboardName(name: string): void {
  localStorage.setItem(LB_NAME_KEY, name.slice(0, 12));
}

export function getCachedTopScore(): number {
  const raw = localStorage.getItem(LB_CACHE_KEY);
  if (!raw) return 0;
  try {
    const data = JSON.parse(raw) as LeaderboardEntry[];
    return data.length > 0 ? Math.max(...data.map(e => e.score)) : 0;
  } catch {
    return 0;
  }
}

function setCachedLeaderboard(entries: LeaderboardEntry[]): void {
  localStorage.setItem(LB_CACHE_KEY, JSON.stringify(entries));
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[] | null> {
  try {
    const res = await fetch(`https://dreamlo.com/lb/${DREAMLO_PUBLIC_CODE}/json`);
    if (!res.ok) return null;
    const data = await res.json();
    let entries: LeaderboardEntry[] = [];
    if (data && data.dreamlo && data.dreamlo.leaderboard && data.dreamlo.leaderboard.entry) {
      const raw = data.dreamlo.leaderboard.entry;
      entries = (Array.isArray(raw) ? raw : [raw]).map((e: { name: string; score: number }) => ({
        name: String(e.name),
        score: Number(e.score) || 0,
      }));
    }
    entries.sort((a, b) => b.score - a.score);
    setCachedLeaderboard(entries);
    return entries.slice(0, 10);
  } catch {
    return null;
  }
}

export async function submitLeaderboardScore(name: string, score: number): Promise<boolean> {
  try {
    const url = `https://dreamlo.com/lb/${DREAMLO_PRIVATE_CODE}/add/${encodeURIComponent(name)}/${Math.floor(score)}`;
    const res = await fetch(url);
    if (!res.ok) return false;
    await fetchLeaderboard();
    return true;
  } catch {
    return false;
  }
}

export function shouldSubmitScore(score: number): boolean {
  const cached = getCachedTopScore();
  if (cached === 0) return true;
  return score >= cached;
}
