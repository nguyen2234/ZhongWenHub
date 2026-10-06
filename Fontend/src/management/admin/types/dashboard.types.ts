export type DateRangeOption = '7d' | '30d' | '90d';

export interface MetricDelta {
  value: number;
  percentageText: string; // e.g. "+12.4%" or "+85"
  trend: 'positive' | 'negative' | 'neutral';
  timeContext: string; // e.g. "so với 7 ngày trước"
}

export interface StatMetricItem {
  id: string;
  title: string;
  currentTotal: number | string;
  totalLabel: string; // e.g. "Tổng tích lũy hiện tại"
  deltaInRange: MetricDelta;
  deltaLabel: string; // e.g. "Mới trong kỳ"
  iconType: 'learners' | 'teachers' | 'lessons' | 'activity';
}

export interface LearningActivityPoint {
  date: string; // e.g. "01/10"
  fullDate: string; // e.g. "01/10/2026"
  sessions: number; // Lượt học / phiên học
  completedLessons: number; // Bài học hoàn thành
  practiceSubmissions: number; // Lượt nộp bài luyện tập
}

export interface HskDistributionItem {
  levelId: string;
  label: string; // e.g. "HSK 1", "HSK 2", ..., "HSK 7–9"
  learnerCount: number;
  percentage: number;
  colorVar?: string;
  stageNote?: string; // e.g. "Sơ cấp", "Trung cấp", "Cao cấp"
}

export interface RecentUser {
  id: string;
  name: string;
  email: string;
  hskLevel: string;
  joinedAt: string;
  status: 'active' | 'inactive' | 'pending';
}

export interface UrgentTicket {
  id: string;
  code: string;
  subject: string;
  requesterName: string;
  priority: 'high' | 'urgent' | 'medium' | 'low';
  category: 'content' | 'account' | 'technical';
  timeAgo: string;
}

export interface SupportOverview {
  openCount: number;
  pendingCount: number;
  urgentCount: number;
  avgResponseTime: string;
  resolvedRate: number; // percentage e.g. 94
  urgentTickets: UrgentTicket[];
}

export interface ContentScaleItem {
  key: string;
  label: string;
  totalCount: number;
  addedInRange: number;
  unit: string;
}

export interface ContentScale {
  vocabulary: ContentScaleItem;
  grammar: ContentScaleItem;
  characters: ContentScaleItem;
  lessons: ContentScaleItem;
  exercises: ContentScaleItem;
}

export interface RecentActivity {
  id: string;
  actorName: string;
  actorRole: string;
  actionText: string;
  targetName: string;
  timestamp: string;
  category: 'academic' | 'user' | 'system' | 'support';
}

export interface AdminDashboardData {
  range: DateRangeOption;
  rangeLabel: string;
  metrics: StatMetricItem[];
  learningActivity: LearningActivityPoint[];
  hskDistribution: HskDistributionItem[];
  recentUsers: RecentUser[];
  supportOverview: SupportOverview;
  contentScale: ContentScale;
  recentActivities: RecentActivity[];
}
