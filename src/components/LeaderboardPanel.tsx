import { useEffect, useRef, useState } from 'react';
import { fetchLeaderboard, getLeaderboardName, setLeaderboardName, shouldSubmitScore, submitLeaderboardScore } from '../game/leaderboard';

interface LeaderboardEntry {
  name: string;
  score: number;
}

export function LeaderboardPanel() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    fetchLeaderboard().then(data => {
      if (!mounted.current) return;
      if (data === null) {
        setError(true);
        setEntries([]);
      } else {
        setEntries(data);
        setError(false);
      }
      setLoading(false);
    });
    return () => { mounted.current = false; };
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-400 font-mono">
        Loading leaderboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-amber-400 font-mono">
        Leaderboard unavailable
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 font-mono">
        No scores yet. Be the first!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-amber-400 font-bold text-lg mb-4 font-mono tracking-wider">TOP 10 SURVIVORS</h3>
      {entries.map((e, i) => (
        <div
          key={i}
          className={`flex items-center justify-between px-4 py-3 rounded-lg font-mono ${
            i === 0
              ? 'bg-amber-900/40 border border-amber-600'
              : i < 3
              ? 'bg-gray-800/60 border border-gray-600'
              : 'bg-gray-900/60 border border-gray-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className={`w-8 text-center font-bold ${i === 0 ? 'text-amber-400' : i < 3 ? 'text-gray-300' : 'text-gray-500'}`}>
              {i + 1}
            </span>
            <span className="text-gray-200">{e.name}</span>
          </div>
          <span className="text-cyan-400 font-bold">{formatScore(e.score)}</span>
        </div>
      ))}
    </div>
  );
}

export function formatScore(score: number): string {
  const minutes = Math.floor(score / 60);
  const seconds = Math.floor(score % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export async function maybeSubmitScore(score: number): Promise<void> {
  if (!shouldSubmitScore(score)) return;
  let name = getLeaderboardName();
  if (!name) {
    // Will be handled by UI prompt
    return;
  }
  await submitLeaderboardScore(name, score);
}

export { getLeaderboardName, setLeaderboardName };
