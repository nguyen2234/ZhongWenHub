/**
 * User Learning Summary Contract
 * Minimal global/account-level learning information.
 * Used to deliver streakDays and global XP to the Lesson Player without polluting lesson state.
 */

export interface UserLearningSummaryDTO {
  xpTotal: number;
  streakDays: number;
  dailyGoalProgress?: number;
  dailyGoalTarget?: number;
}
