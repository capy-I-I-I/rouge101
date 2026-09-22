import { useState } from 'react';
import type { GameState } from '../game/engine/stats';
import { getTome } from '../game/config/tomes';
import { getRelic } from '../game/config/relics';

interface PauseMenuProps {
  state: GameState;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  onUpdateSettings: (s: GameState['save']['settings']) => void;
}

export function PauseMenu({ state, onResume, onRestart, onQuit, onUpdateSettings }: PauseMenuProps) {
  const [tab, setTab] = useState<'stats' | 'upgrades' | 'settings' | 'quit'>('stats');
  const settings = state.save.settings;

  const statList: [string, string][] = [
    ['Damage %', `+${((state.stats.damageMult - 1) * 100).toFixed(0)}%`],
    ['Attack Speed %', `${((1 - state.stats.attackSpeedMult) * 100).toFixed(0)}% faster`],
    ['Area %', `+${((state.stats.areaMult - 1) * 100).toFixed(0)}%`],
    ['Range %', `+${((state.stats.rangeMult - 1) * 100).toFixed(0)}%`],
    ['Crit Chance', `${state.stats.critChance.toFixed(0)}%`],
    ['Crit Damage', `+${state.stats.critDamage}%`],
    ['Move Speed', state.stats.moveSpeed.toFixed(0)],
    ['HP', `${Math.ceil(state.stats.currentHp)} / ${Math.ceil(state.stats.maxHp)}`],
    ['Armor', state.stats.armor > 1 ? state.stats.armor.toFixed(0) : `${(state.stats.armor * 100).toFixed(0)}%`],
    ['Regen', `${state.stats.hpRegen}/s`],
    ['Lifesteal', `${(state.stats.lifesteal * 100).toFixed(0)}%`],
    ['Luck', `${state.stats.luck}%`],
    ['XP Gain', `+${((state.stats.xpGainMult - 1) * 100).toFixed(0)}%`],
    ['Gold Gain', `+${((state.stats.goldGainMult - 1) * 100).toFixed(0)}%`],
    ['Pickup Radius', state.stats.pickupRadius.toFixed(0)],
    ['Projectile Bonus', `+${state.stats.projectileBonus}`],
    ['Pierce Bonus', `+${state.stats.pierceBonus}`],
    ['Dodge', `${state.stats.dodge}%`],
    ['Thorns', `${state.stats.thorns}%`],
  ];

  const minutes = Math.floor(state.survivalTime / 60);
  const seconds = Math.floor(state.survivalTime % 60);

  return (
    <div className="absolute inset-0 bg-black/85 flex items-center justify-center z-50 font-mono">
      <div className="bg-gray-900 rounded-xl border-2 border-gray-700 p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-500">PAUSED</h2>
          <div className="flex gap-2">
            {(['stats', 'upgrades', 'settings', 'quit'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 rounded text-xs font-bold capitalize ${tab === t ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-400'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {tab === 'stats' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                ['Survival Time', `${minutes}:${seconds.toString().padStart(2, '0')}`],
                ['Danger Level', String(state.dangerLevel)],
                ['Kills', String(state.kills)],
                ['Damage Dealt', Math.floor(state.damageDealt).toLocaleString()],
                ['Damage Taken', Math.floor(state.damageTaken).toLocaleString()],
                ['Gold', String(state.gold)],
                ['Level', String(state.level)],
                ['XP', `${Math.floor(state.xp)}/${state.xpToNext}`],
                ['Bosses Defeated', String(state.bossesDefeated)],
              ].map(([label, val]) => (
                <div key={label} className="bg-gray-800/60 rounded px-3 py-2">
                  <div className="text-xs text-gray-500">{label}</div>
                  <div className="text-sm font-bold text-amber-400">{val}</div>
                </div>
              ))}
            </div>
            <h3 className="text-gray-400 text-sm">Full Stat Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
              {statList.map(([label, val]) => (
                <div key={label} className="flex justify-between text-xs bg-gray-800/40 rounded px-2 py-1">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-cyan-400">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'upgrades' && (
          <div className="space-y-1">
            {state.upgradeLog.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No upgrades taken yet.</p>
            ) : (
              state.upgradeLog.map((u, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-800/60 rounded px-3 py-2 text-sm">
                  <span className="text-xs font-bold capitalize" style={{ color: u.rarity === 'legendary' ? '#ddaa22' : u.rarity === 'epic' ? '#aa44cc' : u.rarity === 'rare' ? '#4488dd' : '#888888' }}>{u.rarity}</span>
                  <span className="text-gray-300">{u.name}</span>
                  <span className="text-xs text-gray-600 capitalize">{u.type}</span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'settings' && (
          <div className="space-y-3 max-w-md">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Screen Shake</span>
              <input type="checkbox" checked={settings.screenShake} onChange={e => onUpdateSettings({ ...settings, screenShake: e.target.checked })} className="accent-amber-600 w-5 h-5" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Damage Numbers</span>
              <input type="checkbox" checked={settings.damageNumbers} onChange={e => onUpdateSettings({ ...settings, damageNumbers: e.target.checked })} className="accent-amber-600 w-5 h-5" />
            </label>
            {(['masterVolume', 'sfxVolume', 'musicVolume'] as const).map(key => (
              <div key={key}>
                <label className="text-xs text-gray-400 capitalize">{key.replace('Volume', ' Volume')}</label>
                <input type="range" min={0} max={1} step={0.05} value={settings[key]} onChange={e => onUpdateSettings({ ...settings, [key]: parseFloat(e.target.value) })} className="w-full accent-amber-600" />
              </div>
            ))}
          </div>
        )}

        {tab === 'quit' && (
          <div className="space-y-4 text-center">
            <button onClick={onResume} className="w-full max-w-xs mx-auto py-3 bg-green-700 text-white rounded-lg font-bold hover:bg-green-600">RESUME</button>
            <button onClick={onRestart} className="w-full max-w-xs mx-auto py-3 bg-amber-700 text-white rounded-lg font-bold hover:bg-amber-600">RESTART RUN</button>
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 max-w-xs mx-auto">
              <button onClick={onQuit} className="w-full py-3 bg-red-800 text-white rounded-lg font-bold hover:bg-red-700">QUIT TO MENU</button>
              <p className="text-red-400 text-xs mt-2">Warning: Quitting forfeits all gold earned this run!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
