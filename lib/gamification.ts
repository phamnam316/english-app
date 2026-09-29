/** Cấp độ (level) của user tính từ tổng XP: mỗi 100 XP lên 1 cấp */
export const XP_PER_LEVEL = 100;

export interface LevelInfo {
  level: number;
  /** XP đã có trong cấp hiện tại */
  xpInLevel: number;
  /** XP còn thiếu để lên cấp tiếp theo */
  xpToNextLevel: number;
  /** Phần trăm tiến tới cấp tiếp theo, 0-100 */
  percent: number;
}

export function getLevelInfo(totalXp: number): LevelInfo {
  const xp = Math.max(0, Math.floor(totalXp));
  const xpInLevel = xp % XP_PER_LEVEL;
  return {
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    xpInLevel,
    xpToNextLevel: XP_PER_LEVEL - xpInLevel,
    percent: Math.round((xpInLevel / XP_PER_LEVEL) * 100),
  };
}
