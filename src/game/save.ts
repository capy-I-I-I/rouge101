import type { SaveData, AllTimeStats, RunStats, GameSettings } from './types';
import { FREE_TOME_IDS } from './config/tomes';

const SAVE_KEY = 'rogue_save_v1';

function defaultAllTimeStats(): AllTimeStats {
  return {
    bestSurvivalTime: 0,
    bestSurvivalDate: '',
    totalRuns: 0,
    totalKills: 0,
    totalDamage: 0,
    totalGoldEarned: 0,
    highestDangerLevel: 0,
    highestLevel: 0,
    totalPlayTime: 0,
    bossesDefeated: 0,
    classUsage: {},
    recentRuns: [],
  };
}

function defaultSettings(): GameSettings {
  return {
    masterVolume: 0.7,
    sfxVolume: 0.8,
    musicVolume: 0.5,
    screenShake: true,
    damageNumbers: true,
    controls: {
      up: 'w',
      down: 's',
      left: 'a',
      right: 'd',
      pause: 'Escape',
      skip: 'space',
    },
  };
}

export function defaultSave(): SaveData {
  return {
    gold: 0,
    unlockedClasses: ['warrior', 'mage'],
    unlockedTomes: [...FREE_TOME_IDS],
    unlockedRelics: [],
    unlockedWeapons: [],
    equippedTomes: [...FREE_TOME_IDS].slice(0, 5),
    equippedRelics: [],
    equippedWeapons: [],
    questProgress: {},
    questCompleted: [],
    allTimeStats: defaultAllTimeStats(),
    settings: defaultSettings(),
    playerName: '',
    autoSkip: false,
    autoChoose: false,
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const data = JSON.parse(raw) as Partial<SaveData>;
    const base = defaultSave();
    return {
      ...base,
      ...data,
      allTimeStats: { ...defaultAllTimeStats(), ...data.allTimeStats },
      settings: { ...defaultSettings(), ...data.settings },
      unlockedClasses: data.unlockedClasses ?? base.unlockedClasses,
      unlockedTomes: data.unlockedTomes ?? base.unlockedTomes,
      unlockedRelics: data.unlockedRelics ?? base.unlockedRelics,
      unlockedWeapons: data.unlockedWeapons ?? base.unlockedWeapons,
      equippedTomes: data.equippedTomes ?? base.equippedTomes,
      equippedRelics: data.equippedRelics ?? base.equippedRelics,
      equippedWeapons: data.equippedWeapons ?? base.equippedWeapons,
      questProgress: data.questProgress ?? {},
      questCompleted: data.questCompleted ?? [],
    };
  } catch {
    return defaultSave();
  }
}

export function saveSave(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function recordRunResult(save: SaveData, run: RunStats): SaveData {
  const stats = { ...save.allTimeStats };
  const newSave = { ...save };

  stats.totalRuns += 1;
  stats.totalKills += run.kills;
  stats.totalDamage += run.damageDealt;
  stats.totalGoldEarned += run.goldEarned;
  stats.totalPlayTime += run.survivalTime;
  stats.bossesDefeated += run.bossesDefeated;
  if (run.survivalTime > stats.bestSurvivalTime) {
    stats.bestSurvivalTime = run.survivalTime;
    stats.bestSurvivalDate = run.date;
  }
  if (run.dangerLevel > stats.highestDangerLevel) stats.highestDangerLevel = run.dangerLevel;
  if (run.level > stats.highestLevel) stats.highestLevel = run.level;
  stats.classUsage = { ...stats.classUsage, [run.classId]: (stats.classUsage[run.classId] ?? 0) + 1 };
  stats.recentRuns = [run, ...stats.recentRuns].slice(0, 5);
  newSave.allTimeStats = stats;

  return newSave;
}
