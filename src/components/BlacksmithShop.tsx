import { useState } from 'react';
import type { GameState } from '../game/engine/stats';
import { EXTRA_WEAPONS, SHOP_TIERS, getWeapon } from '../game/config/weapons';

interface ShopProps {
  state: GameState;
  onBuyWeapon: (weaponId: string) => boolean;
  onUpgradeWeapon: (weaponId: string) => boolean;
  onClose: () => void;
}

export function BlacksmithShop({ state, onBuyWeapon, onUpgradeWeapon, onClose }: ShopProps) {
  const [rerollCost, setRerollCost] = useState(50);
  const [weaponOffers, setWeaponOffers] = useState<string[]>(() => generateWeaponOffers(state));
  const [message, setMessage] = useState('');

  // Weapons the player already owns (from equipped pool)
  const ownedExtraWeapons = state.weapons.filter(w => {
    const cfg = getWeapon(w.id);
    return cfg.shopOnly;
  });

  // Available to buy = equipped but not yet owned this run, and < 3 extras
  const canBuyMore = ownedExtraWeapons.length < 3;

  function generateWeaponOffers(state: GameState): string[] {
    const equipped = state.save.equippedWeapons;
    const owned = state.weapons.map(w => w.id);
    const available = EXTRA_WEAPONS.filter(w => equipped.includes(w.id) && !owned.includes(w.id));
    // Pick up to 3 random
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3).map(w => w.id);
  }

  function handleBuy(weaponId: string) {
    const success = onBuyWeapon(weaponId);
    if (success) {
      setMessage(`Bought ${getWeapon(weaponId).name}!`);
      setWeaponOffers(prev => prev.filter(id => id !== weaponId));
    } else {
      setMessage('Not enough gold or no slots!');
    }
  }

  function handleUpgrade(weaponId: string) {
    const success = onUpgradeWeapon(weaponId);
    if (success) {
      const w = state.weapons.find(w => w.id === weaponId);
      setMessage(`Upgraded ${getWeapon(weaponId).name} to Tier ${w?.tier}!`);
    } else {
      setMessage('Not enough gold or max tier!');
    }
  }

  function handleReroll() {
    if (state.gold < rerollCost) {
      setMessage('Not enough gold to reroll!');
      return;
    }
    // Deduct gold by buying nothing but paying reroll
    // We'll use a simple approach: call onClose and reopen
    // Actually, let's handle reroll locally by spending gold
    state.gold -= rerollCost;
    setRerollCost(prev => prev + 50);
    setWeaponOffers(generateWeaponOffers(state));
    setMessage('');
  }

  return (
    <div className="absolute inset-0 bg-black/85 flex items-center justify-center z-50 font-mono">
      <div className="bg-gray-900 rounded-xl border-2 border-amber-700 p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-500">BLACKSMITH SHOP</h2>
          <div className="flex items-center gap-3">
            <span className="text-amber-400 font-bold">{state.gold}G</span>
            <button onClick={handleReroll} className="px-3 py-1 bg-blue-700 text-white rounded text-xs font-bold hover:bg-blue-600">
              Reroll ({rerollCost}G)
            </button>
            <button onClick={onClose} className="px-4 py-1 bg-red-800 text-white rounded text-sm font-bold hover:bg-red-700">
              CLOSE
            </button>
          </div>
        </div>

        {message && <div className="text-center text-amber-400 text-sm mb-3">{message}</div>}

        {/* Buy new weapons */}
        <div className="mb-6">
          <h3 className="text-gray-400 text-sm mb-2">Buy New Weapon (400G each, max 3 extras)</h3>
          {canBuyMore ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {weaponOffers.map(wid => {
                const w = getWeapon(wid);
                return (
                  <div key={wid} className="bg-gray-800/80 rounded-lg p-3 border border-gray-700">
                    <h4 className="font-bold text-sm text-gray-200">{w.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{w.description}</p>
                    <div className="text-xs text-gray-500 mt-1">DMG: <span className="text-red-400">{w.baseDamage}</span> | CD: <span className="text-cyan-400">{w.baseCooldown}s</span></div>
                    <button
                      onClick={() => handleBuy(wid)}
                      disabled={state.gold < 400}
                      className={`w-full mt-2 py-1 rounded text-xs font-bold ${state.gold >= 400 ? 'bg-amber-700 text-white hover:bg-amber-600' : 'bg-gray-700 text-gray-500'}`}
                    >
                      BUY (400G)
                    </button>
                  </div>
                );
              })}
              {weaponOffers.length === 0 && (
                <div className="col-span-full text-center text-gray-500 text-sm py-4">No more weapons available to buy this run.</div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">All weapon slots full. Upgrade existing weapons below.</p>
          )}
        </div>

        {/* Upgrade existing weapons */}
        <div>
          <h3 className="text-gray-400 text-sm mb-2">Upgrade Your Weapons</h3>
          <div className="space-y-2">
            {state.weapons.map((w, i) => {
              const cfg = getWeapon(w.id);
              const isMaxTier = w.tier >= 5;
              const tierCost = isMaxTier ? 0 : SHOP_TIERS[w.tier]?.cost ?? 0;
              const tierLabel = isMaxTier ? 'MAX TIER' : SHOP_TIERS[w.tier]?.label ?? '';
              return (
                <div key={i} className="bg-gray-800/80 rounded-lg p-3 border border-gray-700 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-gray-200">{cfg.name} <span className="text-amber-400 text-xs">Tier {w.tier}</span></h4>
                    <p className="text-xs text-gray-500">{tierLabel}</p>
                  </div>
                  {!isMaxTier ? (
                    <button
                      onClick={() => handleUpgrade(w.id)}
                      disabled={state.gold < tierCost}
                      className={`px-4 py-2 rounded text-xs font-bold ${state.gold >= tierCost ? 'bg-amber-700 text-white hover:bg-amber-600' : 'bg-gray-700 text-gray-500'}`}
                    >
                      UPGRADE ({tierCost}G)
                    </button>
                  ) : (
                    <span className="text-amber-400 text-xs font-bold">MAXED</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
