import type { SkillItemConfig } from '../types';

export const SKILL_ITEMS: SkillItemConfig[] = [
  {
    id: 'vocabulary',
    chinese: '词汇',
    vietnamese: 'Từ vựng',
    icon: '📝',
    masteryPercentage: 75,
    totalExercises: 32,
    description: 'Nắm chắc 150 từ vựng HSK 1-2 & từ đồng nghĩa',
  },
  {
    id: 'grammar',
    chinese: '语法',
    vietnamese: 'Ngữ pháp',
    icon: '📐',
    masteryPercentage: 54,
    totalExercises: 18,
    description: 'Cấu trúc 想, 是...的, lượng từ & trợ từ',
  },
  {
    id: 'sentence',
    chinese: '句子',
    vietnamese: 'Cấu trúc câu',
    icon: '💬',
    masteryPercentage: 60,
    totalExercises: 20,
    description: 'Thực hành trật tự câu hỏi, vị ngữ & tân ngữ',
  },
  {
    id: 'comprehensive',
    chinese: '综合练习',
    vietnamese: 'Luyện tổng hợp',
    icon: '⚡',
    masteryPercentage: 70,
    totalExercises: 28,
    description: 'Thử thách phản xạ hỗn hợp đa kỹ năng',
  },
];
