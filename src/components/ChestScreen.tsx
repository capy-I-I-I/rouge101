import { useState } from 'react';
import type { GameState } from '../game/engine/stats';
import { RELICS } from '../game/config/relics';

interface ChestScreenProps {
  state: GameState;
  onChoose: (relicId: string) => void;
}

export function ChestScreen({ state, onChoose }: ChestScreenProps) {
  const equippedRelicIds = state.save.equippedRelics;
  const available = RELICS.filter(r => equippedRelicIds.includes(r.id) && !state.relics.includes(r.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5).slice(0, 2);
  const [offers] = useState(shuffled);

  return (
    <div className="absolute inset-0 bg-black/85 flex items-center justify-center z-50 font-mono">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-amber-400 tracking-widest">RELIC FOUND</h2>
        <p className="text-gray-400 text-sm mt-2">Choose one</p>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-4">
        {offers.length === 0 ? (
          <div className="bg-gray-900 rounded-xl border-2 border-gray-700 p-8 text-center">
            <p className="text-gray-400 mb-4">No new relics available from your loadout.</p>
            <button
              onClick={() => onChoose('')}
              className="px-6 py-2 bg-gray-700 text-white rounded font-bold hover:bg-gray-600"
            >
              CLOSE
            </button>
          </div>
        ) : (
          offers.map((relic, i) => (
            <button
              key={i}
              onClick={() => onChoose(relic.id)}
              className="w-56 h-64 rounded-xl border-2 border-purple-500 p-4 flex flex-col items-center justify-between bg-gray-900/95 shadow-lg hover:scale-105 transition-all"
            >
              <div className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold bg-purple-900/40 border-2 border-purple-500 text-purple-400">
                {relic.name[0]}
              </div>
              <div className="text-center">
                <span className="text-xs text-purple-400 capitalize">{relic.category}</span>
                <h3 className="text-white font-bold text-sm mt-1">{relic.name}</h3>
                <p className="text-gray-400 text-xs mt-1">{relic.description}</p>
                <p className="text-gray-600 text-xs italic mt-2">{relic.flavor}</p>
              </div>
              <div className="text-purple-400 text-xs font-bold">TAKE</div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
