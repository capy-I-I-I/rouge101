import { useState, useEffect, useRef } from 'react';
import type { GameState } from '../game/engine/stats';
import type { Rarity } from '../game/types';
import { TOMES } from '../game/config/tomes';
import { RELICS } from '../game/config/relics';
import { RARITY_COLORS, RARITY_LABEL, RARITY_BORDER } from './rarity';

interface LevelUpProps {
  state: GameState;
  onChoose: (tomeId: string, rarity: Rarity, tierIndex: number) => void;
  autoChoose: boolean;
}

interface OfferCard {
  tomeId: string;
  rarity: Rarity;
  tierIndex: number;
  name: string;
  description: string;
  currentValue: string;
  newValue: string;
  flavor: string;
  isRelic: boolean;
  relicId?: string;
}

export function LevelUpScreen({ state, onChoose, autoChoose }: LevelUpProps) {
  const [offers, setOffers] = useState<OfferCard[]>([]);
  const [flashIndex, setFlashIndex] = useState(-1);
  const chosen = useRef(false);

  useEffect(() => {
    chosen.current = false;
    const cards = generateOffers(state);
    setOffers(cards);

    if (autoChoose && cards.length > 0) {
      let bestIndex = 0;
      let bestRarity = -1;
      const rarityOrder: Record<Rarity, number> = { common: 0, rare: 1, epic: 2, legendary: 3 };
      cards.forEach((c, i) => {
        if (rarityOrder[c.rarity] > bestRarity) {
          bestRarity = rarityOrder[c.rarity];
          bestIndex = i;
        }
      });
      // Flash through cards then pick
      let flash = 0;
      const interval = setInterval(() => {
        setFlashIndex(flash % cards.length);
        flash++;
        if (flash > cards.length * 2) {
          clearInterval(interval);
          const chosenCard = cards[bestIndex];
          if (!chosen.current) {
            chosen.current = true;
            onChoose(chosenCard.tomeId, chosenCard.rarity, chosenCard.tierIndex);
          }
        }
      }, 120);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePick(card: OfferCard) {
    if (chosen.current) return;
    chosen.current = true;
    onChoose(card.tomeId, card.rarity, card.tierIndex);
  }

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 font-mono">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-amber-400 tracking-widest">LEVEL UP!</h2>
        <p className="text-gray-400 text-sm mt-2">Choose an upgrade</p>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-4">
        {offers.map((card, i) => {
          const isFlashing = flashIndex === i;
          return (
            <button
              key={i}
              onClick={() => handlePick(card)}
              className={`w-52 h-72 rounded-xl border-2 p-4 flex flex-col items-center justify-between transition-all ${
                RARITY_BORDER[card.rarity]
              } ${isFlashing ? 'ring-4 ring-white scale-105' : 'hover:scale-105'} bg-gray-900/95 shadow-lg`}
              style={{ borderColor: RARITY_COLORS[card.rarity] }}
            >
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold mb-2"
                style={{ background: RARITY_COLORS[card.rarity] + '22', border: `2px solid ${RARITY_COLORS[card.rarity]}`, color: RARITY_COLORS[card.rarity] }}
              >
                {card.name[0]}
              </div>
              <div className="text-center">
                <div className="text-xs font-bold" style={{ color: RARITY_COLORS[card.rarity] }}>{RARITY_LABEL[card.rarity]}</div>
                <h3 className="text-white font-bold text-sm mt-1">{card.name}</h3>
                <p className="text-gray-400 text-xs mt-1">{card.description}</p>
                <p className="text-cyan-400 text-xs mt-2">{card.currentValue} → {card.newValue}</p>
                <p className="text-gray-600 text-xs italic mt-2">{card.flavor}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function generateOffers(state: GameState): OfferCard[] {
  const equippedTomeIds = state.save.equippedTomes;
  const availableTomes = TOMES.filter(t => equippedTomeIds.includes(t.id));
  const equippedRelicIds = state.save.equippedRelics;
  const availableRelics = RELICS.filter(r => equippedRelicIds.includes(r.id) && !state.relics.includes(r.id));

  const cards: OfferCard[] = [];
  const luck = state.stats.luck / 100;
  const usedIds = new Set<string>();

  // Try to generate 4 cards: mostly tomes, sometimes relics
  const attempts = 4;
  for (let i = 0; i < attempts; i++) {
    // 75% tome, 25% relic (if available)
    const tryRelic = availableRelics.length > 0 && Math.random() < 0.25 && i >= 1;
    if (tryRelic) {
      const remaining = availableRelics.filter(r => !usedIds.has(r.id));
      if (remaining.length === 0) continue;
      const relic = remaining[Math.floor(Math.random() * remaining.length)];
      usedIds.add(relic.id);
      cards.push({
        tomeId: 'relic_' + relic.id,
        rarity: 'epic',
        tierIndex: 0,
        name: relic.name,
        description: relic.description,
        currentValue: 'New',
        newValue: 'Active',
        flavor: relic.flavor,
        isRelic: true,
        relicId: relic.id,
      });
      continue;
    }

    const remaining = availableTomes.filter((t: typeof availableTomes[0]) => !usedIds.has(t.id));
    if (remaining.length === 0) {
      // Re-use already taken tomes (upgrade path)
      const taken = availableTomes.filter((t: typeof availableTomes[0]) => state.tomes.some((ti: typeof state.tomes[0]) => ti.id === t.id && ti.tierIndex < 3));
      if (taken.length === 0) continue;
      const tome = taken[Math.floor(Math.random() * taken.length)];
      const existing = state.tomes.find((t: typeof state.tomes[0]) => t.id === tome.id)!;
      const nextTier = Math.min(existing.tierIndex + 1, 3);
      const rarity = tome.tiers[nextTier].rarity;
      cards.push({
        tomeId: tome.id,
        rarity,
        tierIndex: nextTier,
        name: tome.name,
        description: tome.description,
        currentValue: String(tome.tiers[existing.tierIndex].value),
        newValue: String(tome.tiers[nextTier].value),
        flavor: tome.flavor,
        isRelic: false,
      });
      continue;
    }

    const tome = remaining[Math.floor(Math.random() * remaining.length)];
    usedIds.add(tome.id);
    const existing = state.tomes.find((t: typeof state.tomes[0]) => t.id === tome.id);
    let tierIndex = 0;
    if (existing) {
      tierIndex = Math.min(existing.tierIndex + 1, 3);
    } else {
      // Roll rarity based on luck
      const roll = Math.random() + luck;
      if (roll > 0.95) tierIndex = 3;
      else if (roll > 0.80) tierIndex = 2;
      else if (roll > 0.55) tierIndex = 1;
      else tierIndex = 0;
    }
    const rarity = tome.tiers[tierIndex].rarity;
    const currentVal = existing ? String(tome.tiers[existing.tierIndex].value) : '0';
    cards.push({
      tomeId: tome.id,
      rarity,
      tierIndex,
      name: tome.name,
      description: tome.description,
      currentValue: currentVal,
      newValue: String(tome.tiers[tierIndex].value),
      flavor: tome.flavor,
      isRelic: false,
    });
  }

  // Ensure at least 2 cards
  if (cards.length < 2) {
    // Fallback: always offer damage and max HP
    for (const fallbackId of ['damage', 'maxHp']) {
      if (cards.length >= 2) break;
      const tome = TOMES.find(t => t.id === fallbackId)!;
      if (usedIds.has(fallbackId)) continue;
      cards.push({
        tomeId: fallbackId,
        rarity: 'common',
        tierIndex: 0,
        name: tome.name,
        description: tome.description,
        currentValue: '0',
        newValue: String(tome.tiers[0].value),
        flavor: tome.flavor,
        isRelic: false,
      });
    }
  }

  return cards.slice(0, 4);
}
