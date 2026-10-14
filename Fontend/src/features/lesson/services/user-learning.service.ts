import type { UserLearningSummaryDTO } from '../types/user-learning-summary.types';

/**
 * Service for fetching user's global learning summary (account-level metrics).
 * Supplies streakDays and xpTotal to student experiences without mixing them
 * into per-lesson content or progress models.
 */
class UserLearningService {
  private summary: UserLearningSummaryDTO = {
    xpTotal: 1250,
    streakDays: 8,
    dailyGoalProgress: 3,
    dailyGoalTarget: 5,
  };

  /**
   * Get user learning summary
   */
  async getUserLearningSummary(
    _userId: string = 'user-default'
  ): Promise<UserLearningSummaryDTO> {
    return { ...this.summary };
  }

  /**
   * Increment streak or XP if needed globally
   */
  async recordActivity(xpGained: number): Promise<UserLearningSummaryDTO> {
    this.summary = {
      ...this.summary,
      xpTotal: this.summary.xpTotal + xpGained,
      dailyGoalProgress: (this.summary.dailyGoalProgress ?? 0) + 1,
    };
    return { ...this.summary };
  }
}

export const userLearningService = new UserLearningService();
