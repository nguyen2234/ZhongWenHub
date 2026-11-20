import type { SharedExerciseItem } from '../../exercise-engine';
import type { AdaptiveRecommendationsResponse } from '../services/practice-question-bank.service';

export type CanonicalPracticeFormatType =
  | 'sentence-order'
  | 'fill-blank'
  | 'listen-fill-blank'
  | 'listen-order'
  | 'reading-cloze';

export interface PracticeFormatDefinition {
  orderLabel: string;
  type: CanonicalPracticeFormatType;
  title: string;
  description: string;
  supportedInRenderer: boolean;
  unavailableReason: string;
}

export interface PracticeFormatAvailability {
  count: number;
  availableHskLevels: number[];
  isAvailable: boolean;
  statusLabel: string;
}

export const PRACTICE_FORMATS: PracticeFormatDefinition[] = [
  {
    orderLabel: '01',
    type: 'sentence-order',
    title: 'Sắp xếp từ thành câu hoàn chỉnh',
    description:
      'Sắp xếp các từ hoặc cụm từ tiếng Trung thành câu hoàn chỉnh đúng trật tự ngữ pháp.',
    supportedInRenderer: true,
    unavailableReason: 'Chưa có câu hỏi sắp xếp câu đã xuất bản cho lựa chọn hiện tại.',
  },
  {
    orderLabel: '02',
    type: 'fill-blank',
    title: 'Điền từ vào chỗ trống',
    description:
      'Chọn hoặc điền từ vựng chính xác vào chỗ trống theo ngữ cảnh của câu.',
    supportedInRenderer: true,
    unavailableReason: 'Chưa có câu hỏi điền từ đã xuất bản cho lựa chọn hiện tại.',
  },
  {
    orderLabel: '03',
    type: 'listen-fill-blank',
    title: 'Nghe điền từ còn thiếu',
    description:
      'Nghe đoạn âm thanh tiếng Trung và điền từ hoặc cụm từ còn thiếu vào chỗ trống.',
    supportedInRenderer: false,
    unavailableReason:
      'Chưa khả dụng — chưa có dữ liệu nghe điền từ xuất bản trong Ngân hàng câu hỏi.',
  },
  {
    orderLabel: '04',
    type: 'listen-order',
    title: 'Nghe và sắp xếp nội dung theo thứ tự',
    description:
      'Nghe hội thoại hoặc câu mẫu và sắp xếp lại các phần nội dung theo đúng trình tự.',
    supportedInRenderer: false,
    unavailableReason:
      'Chưa khả dụng — chưa có dữ liệu nghe sắp xếp thứ tự xuất bản trong Ngân hàng câu hỏi.',
  },
  {
    orderLabel: '05',
    type: 'reading-cloze',
    title: 'Đọc hiểu và suy đoán điền từ',
    description:
      'Đọc đoạn văn tiếng Trung và suy đoán từ thích hợp để hoàn thành từng chỗ trống.',
    supportedInRenderer: false,
    unavailableReason:
      'Chưa khả dụng — chưa có bài đọc hiểu điền từ nhiều chỗ trống (hiện có bài đọc hiểu trắc nghiệm ở phần dưới).',
  },
];

export function resolveDynamicHskLevels(
  meta?: AdaptiveRecommendationsResponse | null,
  fallbackPool?: Record<string, SharedExerciseItem>
): number[] {
  if (meta) {
    if (Array.isArray(meta.availableHskLevels) && meta.availableHskLevels.length > 0) {
      return [...new Set(meta.availableHskLevels.filter((n) => Number.isInteger(n) && n > 0))].sort(
        (a, b) => a - b
      );
    }
    if (meta.publishedByHsk) {
      return Object.entries(meta.publishedByHsk)
        .filter(([lvl, count]) => Number(lvl) > 0 && Number(count) > 0)
        .map(([lvl]) => Number(lvl))
        .sort((a, b) => a - b);
    }
    return [];
  }

  if (!fallbackPool) return [];
  const levels = new Set<number>();
  Object.values(fallbackPool).forEach((ex) => {
    if (ex.hskLevel && ex.hskLevel > 0) {
      levels.add(ex.hskLevel);
    }
  });
  return Array.from(levels).sort((a, b) => a - b);
}

export function getFormatAvailability(
  format: PracticeFormatDefinition,
  meta?: AdaptiveRecommendationsResponse | null,
  fallbackPool?: Record<string, SharedExerciseItem>,
  selectedHskLevel?: number | null
): PracticeFormatAvailability {
  if (meta) {
    const rawCount = meta.publishedByType?.[format.type] ?? 0;
    const rawLevels = meta.availableHskLevelsByType?.[format.type] ?? [];
    const sortedLevels = [...new Set(rawLevels.filter((lvl) => Number.isInteger(lvl) && lvl > 0))].sort(
      (a, b) => a - b
    );
    const hasSelectedLevel = !selectedHskLevel || sortedLevels.includes(selectedHskLevel);
    const isAvailable = format.supportedInRenderer && rawCount > 0 && hasSelectedLevel;

    let statusLabel = format.unavailableReason;
    if (!format.supportedInRenderer || rawCount === 0) {
      statusLabel = 'Chưa khả dụng';
    } else if (!hasSelectedLevel && selectedHskLevel) {
      statusLabel = `Chưa có câu hỏi HSK ${selectedHskLevel}`;
    } else {
      statusLabel = `${rawCount} câu sẵn sàng`;
    }

    return {
      count: rawCount,
      availableHskLevels: sortedLevels,
      isAvailable,
      statusLabel,
    };
  }

  if (fallbackPool) {
    const matching = Object.values(fallbackPool).filter((ex) => {
      if (ex.type !== format.type) return false;
      if (selectedHskLevel && ex.hskLevel !== selectedHskLevel) return false;
      return true;
    });
    const levels = Array.from(
      new Set(
        Object.values(fallbackPool)
          .filter(
            (ex): ex is SharedExerciseItem & { hskLevel: number } =>
              ex.type === format.type && typeof ex.hskLevel === 'number' && ex.hskLevel > 0
          )
          .map((ex) => ex.hskLevel)
      )
    ).sort((a, b) => a - b);
    const isAvailable = format.supportedInRenderer && matching.length > 0;
    return {
      count: matching.length,
      availableHskLevels: levels,
      isAvailable,
      statusLabel: isAvailable ? `${matching.length} câu sẵn sàng` : 'Chưa khả dụng',
    };
  }

  return {
    count: 0,
    availableHskLevels: [],
    isAvailable: false,
    statusLabel: 'Chưa khả dụng',
  };
}

export function formatHskRangeSummary(levels: number[], isLoading = false): string {
  if (isLoading && levels.length === 0) return 'Đang tải...';
  if (levels.length === 0) return 'Chưa có dữ liệu';
  if (levels.length === 1) return `HSK ${levels[0]}`;
  const isContiguous = levels.every((lvl, idx) => idx === 0 || lvl === levels[idx - 1] + 1);
  if (isContiguous) {
    return `HSK ${levels[0]} – HSK ${levels[levels.length - 1]}`;
  }
  return levels.map((lvl) => `HSK ${lvl}`).join(', ');
}

