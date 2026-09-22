import type { GameState } from '../game/engine/stats';
import { getWeapon } from '../game/config/weapons';

interface HUDProps {
  state: GameState;
  onSkipWave: () => void;
  onTogglePause: () => void;
  autoSkip: boolean;
  onToggleAutoSkip: () => void;
  skipCd: number;
}

export function HUD({ state, onSkipWave, onTogglePause, autoSkip, onToggleAutoSkip, skipCd }: HUDProps) {
  const hpPct = (state.stats.currentHp / state.stats.maxHp) * 100;
  const xpPct = (state.xp / state.xpToNext) * 100;
  const minutes = Math.floor(state.survivalTime / 60);
  const seconds = Math.floor(state.survivalTime % 60);
  const skipReady = skipCd <= 0;

  return (
    <div className="absolute inset-0 pointer-events-none font-mono">
      {/* Top-left: Health bar */}
      <div className="absolute top-3 left-3 w-64">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-red-400 font-bold">HP</span>
          <span className="text-gray-300">{Math.ceil(state.stats.currentHp)} / {Math.ceil(state.stats.maxHp)}</span>
        </div>
        <div className="h-5 bg-gray-900/80 rounded border border-gray-700 overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-200"
            style={{ width: `${Math.max(0, hpPct)}%` }}
          />
          {state.shield > 0 && (
            <div
              className="h-full bg-blue-500/60"
              style={{ width: `${Math.min(100 - hpPct, (state.shield / state.stats.maxHp) * 100)}%` }}
            />
          )}
        </div>
      </div>

      {/* Top-center: Timer + Danger Level */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 text-center">
        <div className="text-3xl font-bold text-white tracking-wider" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
        <div className="text-sm text-amber-400 font-bold mt-0.5">
          DANGER LEVEL {state.dangerLevel}
        </div>
      </div>

      {/* Top-right: Kills + Gold */}
      <div className="absolute top-3 right-3 text-right space-y-1">
        <div className="text-sm text-gray-300">
          <span className="text-gray-500">Kills:</span> <span className="text-red-400 font-bold">{state.kills}</span>
        </div>
        <div className="text-sm text-gray-300">
          <span className="text-gray-500">Gold:</span> <span className="text-amber-400 font-bold">{state.gold}</span>
        </div>
        <button
          onClick={onTogglePause}
          className="pointer-events-auto px-3 py-1 bg-gray-800/80 hover:bg-gray-700 text-gray-300 rounded text-xs font-bold border border-gray-600"
        >
          PAUSE
        </button>
      </div>

      {/* Bottom: XP bar */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="h-6 bg-gray-900/80 border-t border-cyan-700/50 relative">
          <div
            className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-200"
            style={{ width: `${xpPct}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
            LV {state.level} — {Math.floor(state.xp)}/{state.xpToNext} XP
          </div>
        </div>
      </div>

      {/* Bottom-left: Weapon tray */}
      <div className="absolute bottom-9 left-3 flex gap-1.5">
        {state.weapons.map((w, i) => {
          const cfg = getWeapon(w.id);
          return (
            <div
              key={i}
              className="w-12 h-12 bg-gray-900/80 rounded border-2 border-gray-600 flex items-center justify-center text-xs font-bold"
              title={cfg.name}
            >
              <span className="text-gray-300" style={{ fontSize: '10px' }}>{cfg.name.slice(0, 4)}</span>
              {w.tier > 0 && <span className="absolute text-amber-400 text-xs" style={{ marginTop: '20px', marginLeft: '20px' }}>T{w.tier}</span>}
            </div>
          );
        })}
      </div>

      {/* Bottom-right: Skip Wave + Auto Skip */}
      <div className="absolute bottom-9 right-3 flex flex-col items-end gap-1.5 pointer-events-auto">
        <button
          onClick={onSkipWave}
          disabled={!skipReady}
          className={`relative w-14 h-14 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
            skipReady
              ? 'bg-amber-700/80 border-amber-500 text-white hover:bg-amber-600 cursor-pointer'
              : 'bg-gray-800/80 border-gray-600 text-gray-500 cursor-not-allowed'
          }`}
          title="Skip Wave"
        >
          SKIP
          {!skipReady && (
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent"
              style={{
                background: `conic-gradient(transparent ${skipCd * 120}deg, rgba(0,0,0,0.5) ${skipCd * 120}deg)`,
                borderRadius: '50%',
              }}
            />
          )}
        </button>
        <button
          onClick={onToggleAutoSkip}
          className={`px-2 py-1 rounded text-xs font-bold ${autoSkip ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-400'}`}
        >
          AUTO {autoSkip ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
}
