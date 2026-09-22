import { useState, useRef, useEffect, useCallback } from 'react';
import type { SaveData, TomeInstance, ActiveWeapon, Rarity, RunStats } from './game/types';
import { loadSave, saveSave, recordRunResult, defaultSave } from './game/save';
import { createGameState, type GameState } from './game/engine/stats';
import { GameEngine } from './game/engine/GameEngine';
import { getClass } from './game/config/classes';
import { getTome } from './game/config/tomes';
import { getRelic } from './game/config/relics';
import { getWeapon, EXTRA_WEAPONS } from './game/config/weapons';
import { QUESTS } from './game/config/quests';
import { MainMenu } from './components/MainMenu';
import { HUD } from './components/HUD';
import { LevelUpScreen } from './components/LevelUpScreen';
import { BlacksmithShop } from './components/BlacksmithShop';
import { PauseMenu } from './components/PauseMenu';
import { DeathScreen } from './components/DeathScreen';
import { ChestScreen } from './components/ChestScreen';

type Screen = 'menu' | 'game';

export default function App() {
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [screen, setScreen] = useState<Screen>('menu');
  const [selectedClass, setSelectedClass] = useState('warrior');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showChest, setShowChest] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [showDeath, setShowDeath] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);
  const [killerName, setKillerName] = useState('Unknown');
  const [autoSkip, setAutoSkip] = useState(save.autoSkip);
  const [autoChoose, setAutoChoose] = useState(save.autoChoose);
  const [skipCd, setSkipCd] = useState(0);
  const lastShopDanger = useRef(0);

  // Persist save on changes
  useEffect(() => { saveSave(save); }, [save]);

  // Track quest progress
  const updateQuestProgress = useCallback((s: GameState) => {
    setSave(prev => {
      const progress = { ...prev.questProgress };
      const completed = [...prev.questCompleted];

      // Cumulative kill quests
      for (const q of QUESTS) {
        if (q.type === 'cumulative') {
          if (q.description.includes('enemies')) {
            progress[q.id] = (progress[q.id] ?? 0) + s.kills - (progress['__lastKills_' + q.id] ?? 0);
            progress['__lastKills_' + q.id] = s.kills;
          } else if (q.description.includes('Elite') || q.description.includes('Veteran')) {
            // Track elite/veteran kills separately - approximate via kill count
            // For simplicity, count all kills toward these
            progress[q.id] = Math.max(progress[q.id] ?? 0, s.kills);
          }
        }
      }

      // Survival quests - check best
      for (const q of QUESTS) {
        if (q.type === 'survival') {
          progress[q.id] = Math.max(progress[q.id] ?? 0, s.survivalTime);
        }
      }

      // Stat quests
      for (const q of QUESTS) {
        if (q.type === 'stat') {
          if (q.statKey === 'highestDangerLevel') {
            progress[q.id] = Math.max(progress[q.id] ?? 0, s.dangerLevel);
          }
        }
      }

      // Check completions
      for (const q of QUESTS) {
        if (!completed.includes(q.id) && (progress[q.id] ?? 0) >= q.target) {
          completed.push(q.id);
        }
      }

      return { ...prev, questProgress: progress, questCompleted: completed };
    });
  }, []);

  // Start run
  const startRun = useCallback((classId: string) => {
    if (!save.unlockedClasses.includes(classId)) return;
    const cls = getClass(classId);

    // Build tome instances from equipped tomes (all start at tier 0)
    const tomes: TomeInstance[] = save.equippedTomes.slice(0, 5).map(id => ({
      id,
      rarity: 'common' as Rarity,
      tierIndex: 0,
    }));

    // Build relic list from equipped relics
    const relics: string[] = [...save.equippedRelics];

    // Build weapons from equipped weapons
    const weapons: ActiveWeapon[] = save.equippedWeapons.slice(0, 5).map(id => ({
      id,
      tier: 0,
      cooldownTimer: 0,
    }));

    const gs = createGameState(save, classId, tomes, relics, weapons);
    setGameState(gs);
    setSelectedClass(classId);
    setShowLevelUp(false);
    setShowShop(false);
    setShowChest(false);
    setShowPause(false);
    setShowDeath(false);
    lastShopDanger.current = 0;
    setScreen('game');
  }, [save]);

  // Initialize game engine when screen changes
  useEffect(() => {
    if (screen !== 'game' || !canvasRef.current || !gameState) return;

    const canvas = canvasRef.current;
    const engine = new GameEngine(canvas, gameState, {
      onLevelUp: () => setShowLevelUp(true),
      onShop: () => setShowShop(true),
      onChest: () => setShowChest(true),
      onDeath: () => {
        if (engineRef.current) {
          const s = engineRef.current.state;
          // Find killer
          const enemies = engineRef.current.enemyPool.items.filter(e => e.active);
          const nearest = enemies.sort((a, b) => {
            const da = Math.hypot(a.x - engineRef.current!.playerX, a.y - engineRef.current!.playerY);
            const db = Math.hypot(b.x - engineRef.current!.playerX, b.y - engineRef.current!.playerY);
            return da - db;
          })[0];
          setKillerName(nearest ? (nearest.type === 'cryptTyrant' ? 'Crypt Tyrant' : nearest.type === 'wretchedBrute' ? 'Wretched Brute' : nearest.type === 'shambler' ? 'Shambler' : 'Crypt Hound') : 'Unknown');

          // Record run
          const runStats: RunStats = {
            survivalTime: s.survivalTime,
            kills: s.kills,
            damageDealt: Math.floor(s.damageDealt),
            damageTaken: Math.floor(s.damageTaken),
            goldEarned: s.gold,
            xpEarned: Math.floor(s.xp),
            level: s.level,
            dangerLevel: s.dangerLevel,
            bossesDefeated: s.bossesDefeated,
            classId: s.classId,
            date: new Date().toLocaleDateString(),
          };

          const bestBefore = save.allTimeStats.bestSurvivalTime;
          setIsNewBest(s.survivalTime > bestBefore);

          const newSave = recordRunResult(save, runStats);
          newSave.gold += s.gold;
          setSave(newSave);

          // Update quest progress
          updateQuestProgress(s);

          setShowDeath(true);
        }
      },
      onStateChange: (newState) => {
        setGameState(prev => {
          // Skip if overlays are open to avoid overwriting
          return newState;
        });

        // Track shop opening every 5 danger levels
        if (engineRef.current) {
          const dl = newState.dangerLevel;
          if (dl > 0 && dl % 5 === 0 && dl !== lastShopDanger.current && newState.survivalTime > 5) {
            lastShopDanger.current = dl;
            setShowShop(true);
          }

          // Track skip cooldown
          setSkipCd(engineRef.current.skipWaveCd);

          // Auto skip
          if (autoSkip && engineRef.current.skipWaveCd <= 0 && !showLevelUp && !showShop && !showChest && !showPause && !showDeath) {
            engineRef.current.skipWave();
          }
        }
      },
    });

    engineRef.current = engine;
    engine.start();

    // Handle keyboard
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPause(prev => {
          const newPaused = !prev;
          engine.setPaused(newPaused);
          return newPaused;
        });
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        engine.skipWave();
        return;
      }
      engine.setKey(e.key, true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      engine.setKey(e.key, false);
    };
    const handleResize = () => engine.resize();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);

    return () => {
      engine.stop();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // Pause engine when overlays are open
  useEffect(() => {
    if (!engineRef.current) return;
    const shouldPause = showLevelUp || showShop || showChest || showPause || showDeath;
    engineRef.current.setPaused(shouldPause);
  }, [showLevelUp, showShop, showChest, showPause, showDeath]);

  // Handle level up choice
  const handleLevelUpChoice = useCallback((tomeId: string, rarity: Rarity, tierIndex: number) => {
    if (!engineRef.current) return;
    if (tomeId.startsWith('relic_')) {
      // It's actually a relic choice from level up
      const relicId = tomeId.replace('relic_', '');
      engineRef.current.applyRelicChoice(relicId);
    } else {
      engineRef.current.applyLevelUpChoice(tomeId, rarity, tierIndex);
    }
    setShowLevelUp(false);
  }, []);

  // Handle chest choice
  const handleChestChoice = useCallback((relicId: string) => {
    if (!engineRef.current) return;
    if (relicId) {
      engineRef.current.applyRelicChoice(relicId);
    } else {
      engineRef.current.pendingChestId = -1;
      engineRef.current.paused = false;
    }
    setShowChest(false);
  }, []);

  // Handle shop actions
  const handleBuyWeapon = useCallback((weaponId: string): boolean => {
    if (!engineRef.current) return false;
    return engineRef.current.buyWeapon(weaponId);
  }, []);

  const handleUpgradeWeapon = useCallback((weaponId: string): boolean => {
    if (!engineRef.current) return false;
    return engineRef.current.upgradeWeapon(weaponId);
  }, []);

  const handleCloseShop = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.closeShop();
    setShowShop(false);
  }, []);

  // Skip wave
  const handleSkipWave = useCallback(() => {
    engineRef.current?.skipWave();
  }, []);

  // Pause toggle
  const handleTogglePause = useCallback(() => {
    setShowPause(prev => !prev);
  }, []);

  // Quit to menu
  const handleQuit = useCallback(() => {
    engineRef.current?.stop();
    engineRef.current = null;
    setScreen('menu');
    setShowPause(false);
    setShowDeath(false);
  }, []);

  // Restart run
  const handleRestart = useCallback(() => {
    engineRef.current?.stop();
    engineRef.current = null;
    setShowDeath(false);
    setShowPause(false);
    startRun(selectedClass);
  }, [selectedClass, startRun]);

  // --- Menu actions ---
  const handleUnlockClass = useCallback((classId: string) => {
    setSave(prev => {
      const cls = getClass(classId);
      if (prev.unlockedClasses.includes(classId)) return prev;
      // Try gold first
      if (prev.gold >= cls.cost) {
        return { ...prev, gold: prev.gold - cls.cost, unlockedClasses: [...prev.unlockedClasses, classId] };
      }
      // Try quest
      if (cls.quest && prev.questCompleted.includes(cls.quest)) {
        return { ...prev, unlockedClasses: [...prev.unlockedClasses, classId] };
      }
      return prev;
    });
  }, []);

  const handleUnlockTome = useCallback((tomeId: string) => {
    setSave(prev => {
      const tome = getTome(tomeId);
      if (!tome || prev.unlockedTomes.includes(tomeId)) return prev;
      if (tome.free) return { ...prev, unlockedTomes: [...prev.unlockedTomes, tomeId] };
      if (prev.gold >= tome.cost) {
        return { ...prev, gold: prev.gold - tome.cost, unlockedTomes: [...prev.unlockedTomes, tomeId] };
      }
      if (tome.quest && prev.questCompleted.includes(tome.quest)) {
        return { ...prev, unlockedTomes: [...prev.unlockedTomes, tomeId] };
      }
      return prev;
    });
  }, []);

  const handleUnlockRelic = useCallback((relicId: string) => {
    setSave(prev => {
      const relic = getRelic(relicId);
      if (!relic || prev.unlockedRelics.includes(relicId)) return prev;
      if (prev.gold >= relic.cost) {
        return { ...prev, gold: prev.gold - relic.cost, unlockedRelics: [...prev.unlockedRelics, relicId] };
      }
      if (relic.quest && prev.questCompleted.includes(relic.quest)) {
        return { ...prev, unlockedRelics: [...prev.unlockedRelics, relicId] };
      }
      return prev;
    });
  }, []);

  const handleUnlockWeapon = useCallback((weaponId: string) => {
    setSave(prev => {
      const weapon = getWeapon(weaponId);
      if (!weapon || prev.unlockedWeapons.includes(weaponId)) return prev;
      if (prev.gold >= weapon.cost) {
        return { ...prev, gold: prev.gold - weapon.cost, unlockedWeapons: [...prev.unlockedWeapons, weaponId] };
      }
      if (weapon.quest && prev.questCompleted.includes(weapon.quest)) {
        return { ...prev, unlockedWeapons: [...prev.unlockedWeapons, weaponId] };
      }
      return prev;
    });
  }, []);

  const handleEquipTome = useCallback((tomeId: string) => {
    setSave(prev => {
      if (prev.equippedTomes.includes(tomeId)) return prev;
      if (prev.equippedTomes.length >= 5) return prev;
      if (!prev.unlockedTomes.includes(tomeId)) return prev;
      return { ...prev, equippedTomes: [...prev.equippedTomes, tomeId] };
    });
  }, []);

  const handleUnequipTome = useCallback((tomeId: string) => {
    setSave(prev => ({ ...prev, equippedTomes: prev.equippedTomes.filter(id => id !== tomeId) }));
  }, []);

  const handleEquipRelic = useCallback((relicId: string) => {
    setSave(prev => {
      if (prev.equippedRelics.includes(relicId)) return prev;
      if (prev.equippedRelics.length >= 10) return prev;
      if (!prev.unlockedRelics.includes(relicId)) return prev;
      return { ...prev, equippedRelics: [...prev.equippedRelics, relicId] };
    });
  }, []);

  const handleUnequipRelic = useCallback((relicId: string) => {
    setSave(prev => ({ ...prev, equippedRelics: prev.equippedRelics.filter(id => id !== relicId) }));
  }, []);

  const handleEquipWeapon = useCallback((weaponId: string) => {
    setSave(prev => {
      if (prev.equippedWeapons.includes(weaponId)) return prev;
      if (prev.equippedWeapons.length >= 5) return prev;
      if (!prev.unlockedWeapons.includes(weaponId)) return prev;
      return { ...prev, equippedWeapons: [...prev.equippedWeapons, weaponId] };
    });
  }, []);

  const handleUnequipWeapon = useCallback((weaponId: string) => {
    setSave(prev => ({ ...prev, equippedWeapons: prev.equippedWeapons.filter(id => id !== weaponId) }));
  }, []);

  const handleRecommendLoadout = useCallback(() => {
    setSave(prev => {
      // Auto-fill tomes: pick first 5 unlocked not yet equipped
      const tomesToEquip = prev.unlockedTomes.filter(id => !prev.equippedTomes.includes(id)).slice(0, 5 - prev.equippedTomes.length);
      const relicsToEquip = prev.unlockedRelics.filter(id => !prev.equippedRelics.includes(id)).slice(0, 10 - prev.equippedRelics.length);
      const weaponsToEquip = prev.unlockedWeapons.filter(id => !prev.equippedWeapons.includes(id)).slice(0, 5 - prev.equippedWeapons.length);
      return {
        ...prev,
        equippedTomes: [...prev.equippedTomes, ...tomesToEquip].slice(0, 5),
        equippedRelics: [...prev.equippedRelics, ...relicsToEquip].slice(0, 10),
        equippedWeapons: [...prev.equippedWeapons, ...weaponsToEquip].slice(0, 5),
      };
    });
  }, []);

  const handleUpdateSettings = useCallback((settings: SaveData['settings']) => {
    setSave(prev => ({ ...prev, settings }));
    if (engineRef.current) {
      engineRef.current.state.save.settings = settings;
    }
  }, []);

  const handleSetPlayerName = useCallback((name: string) => {
    setSave(prev => ({ ...prev, playerName: name }));
  }, []);

  const handleSetAutoSkip = useCallback((val: boolean) => {
    setAutoSkip(val);
    setSave(prev => ({ ...prev, autoSkip: val }));
  }, []);

  const handleSetAutoChoose = useCallback((val: boolean) => {
    setAutoChoose(val);
    setSave(prev => ({ ...prev, autoChoose: val }));
  }, []);

  if (screen === 'menu') {
    return (
      <MainMenu
        save={save}
        onStartRun={startRun}
        onUnlockClass={handleUnlockClass}
        onUnlockTome={handleUnlockTome}
        onUnlockRelic={handleUnlockRelic}
        onUnlockWeapon={handleUnlockWeapon}
        onEquipTome={handleEquipTome}
        onUnequipTome={handleUnequipTome}
        onEquipRelic={handleEquipRelic}
        onUnequipRelic={handleUnequipRelic}
        onEquipWeapon={handleEquipWeapon}
        onUnequipWeapon={handleUnequipWeapon}
        onRecommendLoadout={handleRecommendLoadout}
        onUpdateSettings={handleUpdateSettings}
        onSetPlayerName={handleSetPlayerName}
        onSetAutoSkip={handleSetAutoSkip}
        onSetAutoChoose={handleSetAutoChoose}
      />
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-black relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ imageRendering: 'pixelated' }}
      />

      {gameState && !showDeath && (
        <HUD
          state={gameState}
          onSkipWave={handleSkipWave}
          onTogglePause={handleTogglePause}
          autoSkip={autoSkip}
          onToggleAutoSkip={() => setAutoSkip(prev => !prev)}
          skipCd={skipCd}
        />
      )}

      {showLevelUp && gameState && (
        <LevelUpScreen
          state={gameState}
          onChoose={handleLevelUpChoice}
          autoChoose={autoChoose}
        />
      )}

      {showShop && gameState && (
        <BlacksmithShop
          state={gameState}
          onBuyWeapon={handleBuyWeapon}
          onUpgradeWeapon={handleUpgradeWeapon}
          onClose={handleCloseShop}
        />
      )}

      {showChest && gameState && (
        <ChestScreen
          state={gameState}
          onChoose={handleChestChoice}
        />
      )}

      {showPause && gameState && (
        <PauseMenu
          state={gameState}
          onResume={() => setShowPause(false)}
          onRestart={handleRestart}
          onQuit={handleQuit}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {showDeath && gameState && (
        <DeathScreen
          state={gameState}
          isNewBest={isNewBest}
          killerName={killerName}
          onRetry={handleRestart}
          onReturnToHub={handleQuit}
        />
      )}
    </div>
  );
}
