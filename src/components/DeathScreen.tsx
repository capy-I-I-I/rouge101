import { useState } from 'react';
import type { GameState } from '../game/engine/stats';
import { getLeaderboardName, setLeaderboardName, shouldSubmitScore, submitLeaderboardScore } from '../game/leaderboard';

interface DeathScreenProps {
  state: GameState;
  isNewBest: boolean;
  killerName: string;
  onRetry: () => void;
  onReturnToHub: () => void;
}

export function DeathScreen({ state, isNewBest, killerName, onRetry, onReturnToHub }: DeathScreenProps) {
  const [namePrompted, setNamePrompted] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const minutes = Math.floor(state.survivalTime / 60);
  const seconds = Math.floor(state.survivalTime % 60);

  const score = Math.floor(state.survivalTime);
  const qualifies = shouldSubmitScore(score);

  function handleNameSubmit() {
    if (nameInput.trim().length === 0) return;
    setLeaderboardName(nameInput.trim());
    submitLeaderboardScore(nameInput.trim(), score).then(() => setSubmitted(true));
    setNamePrompted(true);
  }

  return (
    <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 font-mono">
      <div className="bg-gray-900 rounded-xl border-2 border-red-800 p-8 max-w-md w-full mx-4 text-center">
        <h2 className="text-4xl font-bold text-red-500 mb-2">YOU DIED</h2>
        {isNewBest && (
          <div className="bg-amber-900/40 border border-amber-600 rounded-lg px-4 py-2 mb-4">
            <span className="text-amber-400 font-bold text-lg">NEW BEST!</span>
          </div>
        )}

        <div className="space-y-2 mb-4 text-left">
          <div className="flex justify-between bg-gray-800/60 rounded px-3 py-2">
            <span className="text-gray-500 text-sm">Survival Time</span>
            <span className="text-cyan-400 font-bold">{minutes}:{seconds.toString().padStart(2, '0')}</span>
          </div>
          <div className="flex justify-between bg-gray-800/60 rounded px-3 py-2">
            <span className="text-gray-500 text-sm">Kills</span>
            <span className="text-red-400 font-bold">{state.kills}</span>
          </div>
          <div className="flex justify-between bg-gray-800/60 rounded px-3 py-2">
            <span className="text-gray-500 text-sm">Damage Dealt</span>
            <span className="text-amber-400 font-bold">{Math.floor(state.damageDealt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between bg-gray-800/60 rounded px-3 py-2">
            <span className="text-gray-500 text-sm">Gold Earned</span>
            <span className="text-amber-400 font-bold">{state.gold}</span>
          </div>
          <div className="flex justify-between bg-gray-800/60 rounded px-3 py-2">
            <span className="text-gray-500 text-sm">Level Reached</span>
            <span className="text-green-400 font-bold">{state.level}</span>
          </div>
          <div className="flex justify-between bg-gray-800/60 rounded px-3 py-2">
            <span className="text-gray-500 text-sm">Danger Level</span>
            <span className="text-amber-400 font-bold">{state.dangerLevel}</span>
          </div>
          <div className="flex justify-between bg-red-900/40 border border-red-700 rounded px-3 py-2">
            <span className="text-gray-400 text-sm">What killed you</span>
            <span className="text-red-400 font-bold text-sm">{killerName} (DL {state.dangerLevel})</span>
          </div>
        </div>

        {qualifies && !namePrompted && !getLeaderboardName() && !submitted && (
          <div className="mb-4 bg-blue-900/30 border border-blue-700 rounded-lg p-3">
            <p className="text-blue-300 text-sm mb-2">Your score qualifies for the leaderboard!</p>
            <input
              type="text"
              maxLength={12}
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              placeholder="Enter display name (max 12)"
              className="w-full bg-gray-800 text-gray-200 px-3 py-2 rounded border border-gray-600 text-sm mb-2"
            />
            <button onClick={handleNameSubmit} className="w-full py-2 bg-blue-700 text-white rounded text-sm font-bold hover:bg-blue-600">
              SUBMIT SCORE
            </button>
          </div>
        )}

        {qualifies && (getLeaderboardName() || submitted) && !namePrompted && (
          <div className="mb-4">
            <button
              onClick={() => {
                const name = getLeaderboardName() ?? '';
                if (name) submitLeaderboardScore(name, score).then(() => setSubmitted(true));
                setNamePrompted(true);
              }}
              className="w-full py-2 bg-blue-700 text-white rounded text-sm font-bold hover:bg-blue-600"
            >
              SUBMIT TO LEADERBOARD
            </button>
          </div>
        )}

        {submitted && (
          <div className="mb-4 text-green-400 text-sm">Score submitted to leaderboard!</div>
        )}

        <div className="flex gap-3">
          <button onClick={onRetry} className="flex-1 py-3 bg-amber-700 text-white rounded-lg font-bold hover:bg-amber-600">
            RETRY
          </button>
          <button onClick={onReturnToHub} className="flex-1 py-3 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-600">
            RETURN TO HUB
          </button>
        </div>
      </div>
    </div>
  );
}
