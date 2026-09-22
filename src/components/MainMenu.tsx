import { useState } from 'react';
import type { SaveData, ClassConfig, TomeConfig, RelicConfig, WeaponConfig, QuestConfig } from '../game/types';
import { CLASSES } from '../game/config/classes';
import { TOMES } from '../game/config/tomes';
import { RELICS } from '../game/config/relics';
import { EXTRA_WEAPONS, STARTING_WEAPONS, ALL_WEAPONS, SHOP_TIERS } from '../game/config/weapons';
import { QUESTS } from '../game/config/quests';
import { RARITY_BORDER, RARITY_COLORS, RARITY_LABEL } from './rarity';
import { LeaderboardPanel } from './LeaderboardPanel';

interface MainMenuProps {
  save: SaveData;
  onStartRun: (classId: string) => void;
  onUnlockClass: (classId: string) => void;
  onUnlockTome: (tomeId: string) => void;
  onUnlockRelic: (relicId: string) => void;
  onUnlockWeapon: (weaponId: string) => void;
  onEquipTome: (tomeId: string) => void;
  onUnequipTome: (tomeId: string) => void;
  onEquipRelic: (relicId: string) => void;
  onUnequipRelic: (relicId: string) => void;
  onEquipWeapon: (weaponId: string) => void;
  onUnequipWeapon: (weaponId: string) => void;
  onRecommendLoadout: () => void;
  onUpdateSettings: (settings: SaveData['settings']) => void;
  onSetPlayerName: (name: string) => void;
  onSetAutoSkip: (val: boolean) => void;
  onSetAutoChoose: (val: boolean) => void;
}

type Tab = 'main' | 'character' | 'loadout' | 'collection' | 'quests' | 'stats' | 'leaderboard' | 'settings';
type CollectionTab = 'tomes' | 'relics' | 'weapons';

export function MainMenu(props: MainMenuProps) {
  const [tab, setTab] = useState<Tab>('main');
  const [selectedClass, setSelectedClass] = useState<string>('warrior');
  const [collectionTab, setCollectionTab] = useState<CollectionTab>('tomes');

  return (
    <div className="min-h-screen bg-[#0a0a12] text-gray-200 font-mono overflow-y-auto" style={{ fontFamily: 'monospace' }}>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold tracking-widest text-amber-500" style={{ textShadow: '0 0 20px rgba(245,158,11,0.3)' }}>
            ROGUE GAME 101
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Endless Survival Roguelite</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-gray-900/80 px-4 py-2 rounded-lg border border-amber-700/30">
            <span className="text-amber-400 text-lg font-bold">{props.save.gold}</span>
            <span className="text-amber-600 text-sm">GOLD</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {([
            ['main', 'Play'],
            ['character', 'Character'],
            ['loadout', 'Loadout'],
            ['collection', 'Collection'],
            ['quests', 'Quests'],
            ['stats', 'Stats'],
            ['leaderboard', 'Leaderboard'],
            ['settings', 'Settings'],
          ] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                tab === t
                  ? 'bg-amber-700 text-white shadow-lg shadow-amber-700/30'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'main' && (
          <MainTab save={props.save} onStartRun={() => { props.onStartRun(selectedClass); }} selectedClass={selectedClass} />
        )}

        {tab === 'character' && (
          <CharacterTab
            save={props.save}
            selectedClass={selectedClass}
            onSelect={setSelectedClass}
            onUnlock={props.onUnlockClass}
          />
        )}

        {tab === 'loadout' && (
          <LoadoutTab
            save={props.save}
            onEquipTome={props.onEquipTome}
            onUnequipTome={props.onUnequipTome}
            onEquipRelic={props.onEquipRelic}
            onUnequipRelic={props.onUnequipRelic}
            onEquipWeapon={props.onEquipWeapon}
            onUnequipWeapon={props.onUnequipWeapon}
            onRecommend={props.onRecommendLoadout}
          />
        )}

        {tab === 'collection' && (
          <CollectionTabView
            save={props.save}
            subTab={collectionTab}
            onSubTabChange={setCollectionTab}
            onUnlockTome={props.onUnlockTome}
            onUnlockRelic={props.onUnlockRelic}
            onUnlockWeapon={props.onUnlockWeapon}
            onEquipTome={props.onEquipTome}
            onUnequipTome={props.onUnequipTome}
            onEquipRelic={props.onEquipRelic}
            onUnequipRelic={props.onUnequipRelic}
            onEquipWeapon={props.onEquipWeapon}
            onUnequipWeapon={props.onUnequipWeapon}
          />
        )}

        {tab === 'quests' && <QuestsTab save={props.save} />}

        {tab === 'stats' && <StatsTab save={props.save} />}

        {tab === 'leaderboard' && <LeaderboardPanel />}

        {tab === 'settings' && (
          <SettingsTab
            save={props.save}
            onUpdateSettings={props.onUpdateSettings}
            onSetPlayerName={props.onSetPlayerName}
            onSetAutoSkip={props.onSetAutoSkip}
            onSetAutoChoose={props.onSetAutoChoose}
          />
        )}
      </div>
    </div>
  );
}

function MainTab({ save, onStartRun, selectedClass }: { save: SaveData; onStartRun: () => void; selectedClass: string }) {
  const cls = CLASSES.find(c => c.id === selectedClass) ?? CLASSES[0];
  const unlocked = save.unlockedClasses.includes(selectedClass);
  return (
    <div className="text-center space-y-6">
      <div className="bg-gray-900/80 rounded-xl p-6 border border-gray-700 max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-2" style={{ color: cls.color }}>{cls.name}</h2>
        <p className="text-gray-400 text-sm mb-3">{cls.description}</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-800/60 rounded px-3 py-2"><span className="text-gray-500">HP:</span> <span className="text-red-400">{cls.hp}</span></div>
          <div className="bg-gray-800/60 rounded px-3 py-2"><span className="text-gray-500">Speed:</span> <span className="text-cyan-400">{cls.speed}</span></div>
          <div className="bg-gray-800/60 rounded px-3 py-2 col-span-2"><span className="text-gray-500">Passive:</span> <span className="text-amber-400">{cls.passive}</span></div>
        </div>
      </div>
      <button
        onClick={onStartRun}
        disabled={!unlocked}
        className={`px-12 py-4 rounded-xl text-xl font-bold transition-all ${
          unlocked
            ? 'bg-gradient-to-b from-amber-600 to-amber-800 text-white hover:from-amber-500 hover:to-amber-700 shadow-lg shadow-amber-700/40 hover:scale-105'
            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
        }`}
      >
        {unlocked ? 'START RUN' : 'LOCKED'}
      </button>
      {!unlocked && (
        <p className="text-amber-500 text-sm">Unlock for {cls.cost} Gold or complete the quest</p>
      )}
    </div>
  );
}

function CharacterTab({ save, selectedClass, onSelect, onUnlock }: {
  save: SaveData;
  selectedClass: string;
  onSelect: (id: string) => void;
  onUnlock: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {CLASSES.map(cls => {
        const unlocked = save.unlockedClasses.includes(cls.id);
        const quest = cls.quest ? QUESTS.find(q => q.id === cls.quest) : null;
        const questProgress = cls.quest ? (save.questProgress[cls.quest] ?? 0) : 0;
        const questComplete = quest ? questProgress >= quest.target : false;
        const isSelected = selectedClass === cls.id;
        const canUnlockWithGold = !unlocked && save.gold >= cls.cost;
        const canUnlockWithQuest = !unlocked && questComplete;
        return (
          <div
            key={cls.id}
            onClick={() => unlocked && onSelect(cls.id)}
            className={`rounded-xl p-4 border-2 cursor-pointer transition-all ${
              isSelected ? 'border-amber-500 bg-amber-900/20' : 'border-gray-700 bg-gray-900/80 hover:border-gray-500'
            } ${!unlocked ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded flex items-center justify-center text-lg font-bold" style={{ background: cls.color + '33', border: `2px solid ${cls.color}` }}>
                <span style={{ color: cls.color }}>{cls.name[0]}</span>
              </div>
              <div>
                <h3 className="font-bold" style={{ color: cls.color }}>{cls.name}</h3>
                {unlocked ? (
                  <span className="text-green-400 text-xs">Unlocked</span>
                ) : (
                  <span className="text-gray-500 text-xs">Locked</span>
                )}
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-2">{cls.description}</p>
            <div className="text-xs space-y-1">
              <div className="text-gray-500">HP: <span className="text-red-400">{cls.hp}</span> | Speed: <span className="text-cyan-400">{cls.speed}</span></div>
              <div className="text-amber-400">{cls.passive}</div>
            </div>
            {!unlocked && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-gray-500">{cls.cost} Gold or Quest</div>
                {quest && (
                  <div>
                    <div className="text-xs text-gray-400">{quest.name}: {quest.description}</div>
                    <div className="w-full bg-gray-800 rounded-full h-2 mt-1">
                      <div className="bg-amber-600 rounded-full h-2" style={{ width: `${Math.min(100, (questProgress / quest.target) * 100)}%` }} />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{Math.floor(questProgress)} / {quest.target}</div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onUnlock(cls.id); }}
                    disabled={!canUnlockWithGold}
                    className={`flex-1 py-2 rounded text-xs font-bold ${canUnlockWithGold ? 'bg-amber-700 text-white hover:bg-amber-600' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                  >
                    {cls.cost}G
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onUnlock(cls.id); }}
                    disabled={!canUnlockWithQuest}
                    className={`flex-1 py-2 rounded text-xs font-bold ${canUnlockWithQuest ? 'bg-green-700 text-white hover:bg-green-600' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                  >
                    Quest
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LoadoutTab({ save, onEquipTome, onUnequipTome, onEquipRelic, onUnequipRelic, onEquipWeapon, onUnequipWeapon, onRecommend }: {
  save: SaveData;
  onEquipTome: (id: string) => void;
  onUnequipTome: (id: string) => void;
  onEquipRelic: (id: string) => void;
  onUnequipRelic: (id: string) => void;
  onEquipWeapon: (id: string) => void;
  onUnequipWeapon: (id: string) => void;
  onRecommend: () => void;
}) {
  const [subTab, setSubTab] = useState<'tomes' | 'relics' | 'weapons'>('tomes');
  const equippedTomes = save.equippedTomes.length;
  const equippedRelics = save.equippedRelics.length;
  const equippedWeapons = save.equippedWeapons.length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button onClick={() => setSubTab('tomes')} className={`px-4 py-2 rounded text-sm font-bold ${subTab === 'tomes' ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-400'}`}>
            Tomes ({equippedTomes}/5)
          </button>
          <button onClick={() => setSubTab('relics')} className={`px-4 py-2 rounded text-sm font-bold ${subTab === 'relics' ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-400'}`}>
            Relics ({equippedRelics}/10)
          </button>
          <button onClick={() => setSubTab('weapons')} className={`px-4 py-2 rounded text-sm font-bold ${subTab === 'weapons' ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-400'}`}>
            Weapons ({equippedWeapons}/5)
          </button>
        </div>
        <button onClick={onRecommend} className="px-4 py-2 rounded bg-blue-700 text-white text-sm font-bold hover:bg-blue-600">
          Recommended Loadout
        </button>
      </div>

      {subTab === 'tomes' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {TOMES.filter(t => save.unlockedTomes.includes(t.id)).map(tome => {
            const equipped = save.equippedTomes.includes(tome.id);
            const canEquip = !equipped && equippedTomes < 5;
            return (
              <div key={tome.id} className={`rounded-lg p-3 border ${equipped ? 'border-amber-500 bg-amber-900/20' : 'border-gray-700 bg-gray-900/80'}`}>
                <h4 className="font-bold text-sm text-gray-200">{tome.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{tome.description}</p>
                <div className="flex gap-1 mt-2">
                  {tome.tiers.map((tier, i) => (
                    <span key={i} className="text-xs px-1 rounded" style={{ color: RARITY_COLORS[tier.rarity] }}>{tier.value}</span>
                  ))}
                </div>
                <button
                  onClick={() => equipped ? onUnequipTome(tome.id) : onEquipTome(tome.id)}
                  disabled={!equipped && !canEquip}
                  className={`w-full mt-2 py-1 rounded text-xs font-bold ${
                    equipped ? 'bg-red-800 text-white hover:bg-red-700' : canEquip ? 'bg-green-800 text-white hover:bg-green-700' : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {equipped ? 'UNEQUIP' : canEquip ? 'EQUIP' : 'SLOTS FULL'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {subTab === 'relics' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {RELICS.filter(r => save.unlockedRelics.includes(r.id)).map(relic => {
            const equipped = save.equippedRelics.includes(relic.id);
            const canEquip = !equipped && equippedRelics < 10;
            return (
              <div key={relic.id} className={`rounded-lg p-3 border ${equipped ? 'border-amber-500 bg-amber-900/20' : 'border-gray-700 bg-gray-900/80'}`}>
                <h4 className="font-bold text-sm text-gray-200">{relic.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{relic.description}</p>
                <span className="text-xs text-purple-400 capitalize">{relic.category}</span>
                <button
                  onClick={() => equipped ? onUnequipRelic(relic.id) : onEquipRelic(relic.id)}
                  disabled={!equipped && !canEquip}
                  className={`w-full mt-2 py-1 rounded text-xs font-bold ${
                    equipped ? 'bg-red-800 text-white hover:bg-red-700' : canEquip ? 'bg-green-800 text-white hover:bg-green-700' : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {equipped ? 'UNEQUIP' : canEquip ? 'EQUIP' : 'SLOTS FULL'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {subTab === 'weapons' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {EXTRA_WEAPONS.filter(w => save.unlockedWeapons.includes(w.id)).map(weapon => {
            const equipped = save.equippedWeapons.includes(weapon.id);
            const canEquip = !equipped && equippedWeapons < 5;
            return (
              <div key={weapon.id} className={`rounded-lg p-3 border ${equipped ? 'border-amber-500 bg-amber-900/20' : 'border-gray-700 bg-gray-900/80'}`}>
                <h4 className="font-bold text-sm text-gray-200">{weapon.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{weapon.description}</p>
                <div className="text-xs text-gray-500 mt-1">
                  DMG: <span className="text-red-400">{weapon.baseDamage}</span> | CD: <span className="text-cyan-400">{weapon.baseCooldown}s</span>
                </div>
                <button
                  onClick={() => equipped ? onUnequipWeapon(weapon.id) : onEquipWeapon(weapon.id)}
                  disabled={!equipped && !canEquip}
                  className={`w-full mt-2 py-1 rounded text-xs font-bold ${
                    equipped ? 'bg-red-800 text-white hover:bg-red-700' : canEquip ? 'bg-green-800 text-white hover:bg-green-700' : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {equipped ? 'UNEQUIP' : canEquip ? 'EQUIP' : 'SLOTS FULL'}
                </button>
              </div>
            );
          })}
          {EXTRA_WEAPONS.filter(w => save.unlockedWeapons.includes(w.id)).length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-8">
              No weapons unlocked yet. Complete quests or purchase with Gold in the Collection tab.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CollectionTabView({ save, subTab, onSubTabChange, onUnlockTome, onUnlockRelic, onUnlockWeapon, onEquipTome, onUnequipTome, onEquipRelic, onUnequipRelic, onEquipWeapon, onUnequipWeapon }: {
  save: SaveData;
  subTab: CollectionTab;
  onSubTabChange: (t: CollectionTab) => void;
  onUnlockTome: (id: string) => void;
  onUnlockRelic: (id: string) => void;
  onUnlockWeapon: (id: string) => void;
  onEquipTome: (id: string) => void;
  onUnequipTome: (id: string) => void;
  onEquipRelic: (id: string) => void;
  onUnequipRelic: (id: string) => void;
  onEquipWeapon: (id: string) => void;
  onUnequipWeapon: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => onSubTabChange('tomes')} className={`px-4 py-2 rounded text-sm font-bold ${subTab === 'tomes' ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-400'}`}>Tomes ({TOMES.length})</button>
        <button onClick={() => onSubTabChange('relics')} className={`px-4 py-2 rounded text-sm font-bold ${subTab === 'relics' ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-400'}`}>Relics ({RELICS.length})</button>
        <button onClick={() => onSubTabChange('weapons')} className={`px-4 py-2 rounded text-sm font-bold ${subTab === 'weapons' ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-400'}`}>Weapons ({ALL_WEAPONS.length})</button>
      </div>

      {subTab === 'tomes' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {TOMES.map(tome => {
            const unlocked = save.unlockedTomes.includes(tome.id);
            const equipped = save.equippedTomes.includes(tome.id);
            const quest = tome.quest ? QUESTS.find(q => q.id === tome.quest) : null;
            const questProgress = tome.quest ? (save.questProgress[tome.quest] ?? 0) : 0;
            const questComplete = quest ? questProgress >= quest.target : false;
            const canBuy = !unlocked && !tome.free && save.gold >= tome.cost;
            const canQuest = !unlocked && questComplete;
            const canEquip = unlocked && !equipped && save.equippedTomes.length < 5;
            return (
              <div key={tome.id} className={`rounded-lg p-3 border ${equipped ? 'border-amber-500 bg-amber-900/20' : unlocked ? 'border-gray-700 bg-gray-900/80' : 'border-gray-800 bg-gray-900/40 opacity-70'}`}>
                <h4 className="font-bold text-sm text-gray-200">{tome.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{tome.description}</p>
                <div className="flex gap-1 mt-2">
                  {tome.tiers.map((tier, i) => (
                    <span key={i} className="text-xs px-1 rounded" style={{ color: RARITY_COLORS[tier.rarity] }}>{tier.value}</span>
                  ))}
                </div>
                <p className="text-xs text-gray-600 italic mt-1">{tome.flavor}</p>
                {!unlocked ? (
                  <div className="mt-2 space-y-1">
                    {!tome.free && <div className="text-xs text-amber-500">Cost: {tome.cost}G</div>}
                    {quest && (
                      <div>
                        <div className="text-xs text-gray-400">{quest.name}</div>
                        <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
                          <div className="bg-amber-600 rounded-full h-1.5" style={{ width: `${Math.min(100, (questProgress / quest.target) * 100)}%` }} />
                        </div>
                      </div>
                    )}
                    <div className="flex gap-1">
                      {!tome.free && (
                        <button onClick={() => onUnlockTome(tome.id)} disabled={!canBuy} className={`flex-1 py-1 rounded text-xs font-bold ${canBuy ? 'bg-amber-700 text-white hover:bg-amber-600' : 'bg-gray-800 text-gray-600'}`}>{tome.cost}G</button>
                      )}
                      {quest && (
                        <button onClick={() => onUnlockTome(tome.id)} disabled={!canQuest} className={`flex-1 py-1 rounded text-xs font-bold ${canQuest ? 'bg-green-700 text-white hover:bg-green-600' : 'bg-gray-800 text-gray-600'}`}>Quest</button>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => equipped ? onUnequipTome(tome.id) : onEquipTome(tome.id)}
                    disabled={!equipped && !canEquip}
                    className={`w-full mt-2 py-1 rounded text-xs font-bold ${equipped ? 'bg-red-800 text-white' : canEquip ? 'bg-green-800 text-white' : 'bg-gray-800 text-gray-600'}`}
                  >
                    {equipped ? 'UNEQUIP' : canEquip ? 'EQUIP' : 'SLOTS FULL'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {subTab === 'relics' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {RELICS.map(relic => {
            const unlocked = save.unlockedRelics.includes(relic.id);
            const equipped = save.equippedRelics.includes(relic.id);
            const quest = relic.quest ? QUESTS.find(q => q.id === relic.quest) : null;
            const questProgress = relic.quest ? (save.questProgress[relic.quest] ?? 0) : 0;
            const questComplete = quest ? questProgress >= quest.target : false;
            const canBuy = !unlocked && save.gold >= relic.cost;
            const canQuest = !unlocked && questComplete;
            const canEquip = unlocked && !equipped && save.equippedRelics.length < 10;
            return (
              <div key={relic.id} className={`rounded-lg p-3 border ${equipped ? 'border-amber-500 bg-amber-900/20' : unlocked ? 'border-gray-700 bg-gray-900/80' : 'border-gray-800 bg-gray-900/40 opacity-70'}`}>
                <h4 className="font-bold text-sm text-gray-200">{relic.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{relic.description}</p>
                <span className="text-xs text-purple-400 capitalize">{relic.category}</span>
                <p className="text-xs text-gray-600 italic mt-1">{relic.flavor}</p>
                {!unlocked ? (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-amber-500">Cost: {relic.cost}G</div>
                    {quest && (
                      <div>
                        <div className="text-xs text-gray-400">{quest.name}</div>
                        <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
                          <div className="bg-amber-600 rounded-full h-1.5" style={{ width: `${Math.min(100, (questProgress / quest.target) * 100)}%` }} />
                        </div>
                      </div>
                    )}
                    <div className="flex gap-1">
                      <button onClick={() => onUnlockRelic(relic.id)} disabled={!canBuy} className={`flex-1 py-1 rounded text-xs font-bold ${canBuy ? 'bg-amber-700 text-white hover:bg-amber-600' : 'bg-gray-800 text-gray-600'}`}>{relic.cost}G</button>
                      {quest && (
                        <button onClick={() => onUnlockRelic(relic.id)} disabled={!canQuest} className={`flex-1 py-1 rounded text-xs font-bold ${canQuest ? 'bg-green-700 text-white hover:bg-green-600' : 'bg-gray-800 text-gray-600'}`}>Quest</button>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => equipped ? onUnequipRelic(relic.id) : onEquipRelic(relic.id)}
                    disabled={!equipped && !canEquip}
                    className={`w-full mt-2 py-1 rounded text-xs font-bold ${equipped ? 'bg-red-800 text-white' : canEquip ? 'bg-green-800 text-white' : 'bg-gray-800 text-gray-600'}`}
                  >
                    {equipped ? 'UNEQUIP' : canEquip ? 'EQUIP' : 'SLOTS FULL'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {subTab === 'weapons' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm text-gray-400 mb-2">Starting Weapons (always available)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {STARTING_WEAPONS.map(weapon => (
                <div key={weapon.id} className="rounded-lg p-3 border border-gray-700 bg-gray-900/80">
                  <h4 className="font-bold text-sm text-gray-200">{weapon.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{weapon.description}</p>
                  <div className="text-xs text-gray-500 mt-1">DMG: <span className="text-red-400">{weapon.baseDamage}</span> | CD: <span className="text-cyan-400">{weapon.baseCooldown}s</span></div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm text-gray-400 mb-2">Extra Weapons ({EXTRA_WEAPONS.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {EXTRA_WEAPONS.map(weapon => {
                const unlocked = save.unlockedWeapons.includes(weapon.id);
                const equipped = save.equippedWeapons.includes(weapon.id);
                const quest = weapon.quest ? QUESTS.find(q => q.id === weapon.quest) : null;
                const questProgress = weapon.quest ? (save.questProgress[weapon.quest] ?? 0) : 0;
                const questComplete = quest ? questProgress >= quest.target : false;
                const canBuy = !unlocked && save.gold >= weapon.cost;
                const canQuest = !unlocked && questComplete;
                const canEquip = unlocked && !equipped && save.equippedWeapons.length < 5;
                return (
                  <div key={weapon.id} className={`rounded-lg p-3 border ${equipped ? 'border-amber-500 bg-amber-900/20' : unlocked ? 'border-gray-700 bg-gray-900/80' : 'border-gray-800 bg-gray-900/40 opacity-70'}`}>
                    <h4 className="font-bold text-sm text-gray-200">{weapon.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{weapon.description}</p>
                    <div className="text-xs text-gray-500 mt-1">DMG: <span className="text-red-400">{weapon.baseDamage}</span> | CD: <span className="text-cyan-400">{weapon.baseCooldown}s</span></div>
                    <p className="text-xs text-gray-600 italic mt-1">{weapon.flavor}</p>
                    {!unlocked ? (
                      <div className="mt-2 space-y-1">
                        <div className="text-xs text-amber-500">Cost: {weapon.cost}G</div>
                        {quest && (
                          <div>
                            <div className="text-xs text-gray-400">{quest.name}</div>
                            <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
                              <div className="bg-amber-600 rounded-full h-1.5" style={{ width: `${Math.min(100, (questProgress / quest.target) * 100)}%` }} />
                            </div>
                          </div>
                        )}
                        <div className="flex gap-1">
                          <button onClick={() => onUnlockWeapon(weapon.id)} disabled={!canBuy} className={`flex-1 py-1 rounded text-xs font-bold ${canBuy ? 'bg-amber-700 text-white hover:bg-amber-600' : 'bg-gray-800 text-gray-600'}`}>{weapon.cost}G</button>
                          {quest && (
                            <button onClick={() => onUnlockWeapon(weapon.id)} disabled={!canQuest} className={`flex-1 py-1 rounded text-xs font-bold ${canQuest ? 'bg-green-700 text-white hover:bg-green-600' : 'bg-gray-800 text-gray-600'}`}>Quest</button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => equipped ? onUnequipWeapon(weapon.id) : onEquipWeapon(weapon.id)}
                        disabled={!equipped && !canEquip}
                        className={`w-full mt-2 py-1 rounded text-xs font-bold ${equipped ? 'bg-red-800 text-white' : canEquip ? 'bg-green-800 text-white' : 'bg-gray-800 text-gray-600'}`}
                      >
                        {equipped ? 'UNEQUIP' : canEquip ? 'EQUIP' : 'SLOTS FULL'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestsTab({ save }: { save: SaveData }) {
  const categories: { key: string; label: string; quests: QuestConfig[] }[] = [
    { key: 'cumulative', label: 'Kill Quests', quests: QUESTS.filter(q => q.type === 'cumulative') },
    { key: 'survival', label: 'Survival Quests', quests: QUESTS.filter(q => q.type === 'survival') },
    { key: 'stat', label: 'Stat Quests', quests: QUESTS.filter(q => q.type === 'stat') },
  ];
  return (
    <div className="space-y-6">
      {categories.map(cat => (
        <div key={cat.key}>
          <h3 className="text-amber-400 font-bold text-sm mb-3">{cat.label}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {cat.quests.map(q => {
              const progress = save.questProgress[q.id] ?? 0;
              const complete = save.questCompleted.includes(q.id);
              const pct = Math.min(100, (progress / q.target) * 100);
              return (
                <div key={q.id} className={`rounded-lg p-3 border ${complete ? 'border-green-600 bg-green-900/20' : 'border-gray-700 bg-gray-900/80'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm text-gray-200">{q.name}</h4>
                    {complete && <span className="text-green-400 text-xs">DONE</span>}
                  </div>
                  <p className="text-xs text-gray-500">{q.description}</p>
                  <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                    <div className={`rounded-full h-2 ${complete ? 'bg-green-500' : 'bg-amber-600'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex justify-between">
                    <span>{Math.floor(progress)} / {q.target}</span>
                    <span className="text-purple-400 capitalize">{q.reward.type}: {q.reward.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatsTab({ save }: { save: SaveData }) {
  const s = save.allTimeStats;
  const favClass = Object.entries(s.classUsage).sort((a, b) => b[1] - a[1])[0];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          ['Best Survival Time', formatTime(s.bestSurvivalTime), s.bestSurvivalDate ? `(${s.bestSurvivalDate})` : ''],
          ['Total Runs', String(s.totalRuns), ''],
          ['Total Kills', String(s.totalKills), ''],
          ['Total Damage', formatNum(s.totalDamage), ''],
          ['Total Gold Earned', String(s.totalGoldEarned), ''],
          ['Highest Danger Level', String(s.highestDangerLevel), ''],
          ['Highest Level', String(s.highestLevel), ''],
          ['Bosses Defeated', String(s.bossesDefeated), ''],
          ['Total Play Time', formatTime(s.totalPlayTime), ''],
          ['Favorite Class', favClass ? favClass[0] : 'None', favClass ? `(${favClass[1]} runs)` : ''],
        ].map(([label, value, sub]) => (
          <div key={label} className="bg-gray-900/80 rounded-lg p-4 border border-gray-700">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-lg font-bold text-amber-400 mt-1">{value}</div>
            {sub && <div className="text-xs text-gray-600">{sub}</div>}
          </div>
        ))}
      </div>

      {s.recentRuns.length > 0 && (
        <div>
          <h3 className="text-amber-400 font-bold text-sm mb-2">Recent Runs</h3>
          <div className="space-y-2">
            {s.recentRuns.map((r, i) => (
              <div key={i} className="bg-gray-900/80 rounded-lg p-3 border border-gray-700 flex justify-between text-sm">
                <div className="flex gap-4">
                  <span className="text-cyan-400">{formatTime(r.survivalTime)}</span>
                  <span className="text-gray-400">{r.kills} kills</span>
                  <span className="text-amber-400">{r.goldEarned} gold</span>
                </div>
                <span className="text-gray-500 capitalize">{r.classId}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsTab({ save, onUpdateSettings, onSetPlayerName, onSetAutoSkip, onSetAutoChoose }: {
  save: SaveData;
  onUpdateSettings: (s: SaveData['settings']) => void;
  onSetPlayerName: (name: string) => void;
  onSetAutoSkip: (val: boolean) => void;
  onSetAutoChoose: (val: boolean) => void;
}) {
  const settings = save.settings;
  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="bg-gray-900/80 rounded-lg p-4 border border-gray-700 space-y-3">
        <h3 className="text-amber-400 font-bold text-sm">Volume</h3>
        {(['masterVolume', 'sfxVolume', 'musicVolume'] as const).map(key => (
          <div key={key}>
            <label className="text-xs text-gray-400 capitalize">{key.replace('Volume', ' Volume')}</label>
            <input
              type="range" min={0} max={1} step={0.05}
              value={settings[key]}
              onChange={e => onUpdateSettings({ ...settings, [key]: parseFloat(e.target.value) })}
              className="w-full accent-amber-600"
            />
          </div>
        ))}
      </div>

      <div className="bg-gray-900/80 rounded-lg p-4 border border-gray-700 space-y-3">
        <h3 className="text-amber-400 font-bold text-sm">Gameplay</h3>
        <label className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Screen Shake</span>
          <input type="checkbox" checked={settings.screenShake} onChange={e => onUpdateSettings({ ...settings, screenShake: e.target.checked })} className="accent-amber-600 w-5 h-5" />
        </label>
        <label className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Damage Numbers</span>
          <input type="checkbox" checked={settings.damageNumbers} onChange={e => onUpdateSettings({ ...settings, damageNumbers: e.target.checked })} className="accent-amber-600 w-5 h-5" />
        </label>
        <label className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Default Auto Skip</span>
          <input type="checkbox" checked={save.autoSkip} onChange={e => onSetAutoSkip(e.target.checked)} className="accent-amber-600 w-5 h-5" />
        </label>
        <label className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Default Auto Choose</span>
          <input type="checkbox" checked={save.autoChoose} onChange={e => onSetAutoChoose(e.target.checked)} className="accent-amber-600 w-5 h-5" />
        </label>
      </div>

      <div className="bg-gray-900/80 rounded-lg p-4 border border-gray-700 space-y-3">
        <h3 className="text-amber-400 font-bold text-sm">Leaderboard Name</h3>
        <input
          type="text" maxLength={12} value={save.playerName}
          onChange={e => onSetPlayerName(e.target.value)}
          placeholder="Enter display name (max 12)"
          className="w-full bg-gray-800 text-gray-200 px-3 py-2 rounded border border-gray-600 text-sm"
        />
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatNum(n: number): string {
  if (n > 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n > 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(Math.floor(n));
}
