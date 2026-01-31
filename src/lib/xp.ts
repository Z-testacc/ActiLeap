export const XP_PER_WORKOUT = 25;
export const XP_PER_LEVEL_BASE = 200;

export function getLevelFromXp(xp: number): number {
  if (xp < 0) return 1;
  // This is a simple linear progression.
  // Level 1: 0-199 XP
  // Level 2: 200-399 XP
  // etc.
  return Math.floor(xp / XP_PER_LEVEL_BASE) + 1;
}

export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return (level - 1) * XP_PER_LEVEL_BASE;
}

export function getProgressToNextLevel(xp: number): {
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercentage: number;
  currentLevel: number;
} {
  const currentLevel = getLevelFromXp(xp);
  const xpForCurrentLevel = getXpForLevel(currentLevel);
  const xpForNextLevel = getXpForLevel(currentLevel + 1);

  const xpInCurrentLevel = xp - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;

  const progressPercentage = (xpInCurrentLevel / xpNeededForNextLevel) * 100;

  return {
    currentLevelXp: xpInCurrentLevel,
    nextLevelXp: xpNeededForNextLevel,
    progressPercentage: progressPercentage,
    currentLevel: currentLevel,
  };
}
