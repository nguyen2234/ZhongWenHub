export type TicketPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export type TicketStatus = 'NEW' | 'IN_PROGRESS' | 'WAITING_STUDENT' | 'RESOLVED' | 'CLOSED';

export type TicketCategory = 'CONTENT' | 'TECHNICAL' | 'ACCOUNT' | 'BILLING' | 'OTHER';

export interface TicketNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  isInternal: boolean;
}

export interface TicketActivity {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assigneeId?: string;
  assigneeName: string;
  createdAt: string;
  updatedAt: string;
  slaDeadline: string;
  isOverdue: boolean;
  contentIssueId?: string; // Linked ID in Content Manager (e.g. ISS-1024)
  notes: TicketNote[];
  history: TicketActivity[];
}

export interface TicketFilters {
  search?: string;
  status?: TicketStatus | 'ALL';
  priority?: TicketPriority | 'ALL';
  category?: TicketCategory | 'ALL';
  assignee?: string | 'ALL';
}

export interface SupportMetrics {
  total: number;
  newCount: number;
  inProgress: number;
  resolved: number;
  urgent: number;
  slaOverdue: number;
  avgResolutionHours: number;
  satisfactionRate: number;
}
