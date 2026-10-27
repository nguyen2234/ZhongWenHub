import type { TicketCategory, TicketPriority, TicketStatus } from '../../management/support/types/support-ticket.types';

export interface TicketNoteDto {
  id: string;
  author: string;
  content: string;
  createdAt: string; // ISO 8601
  isInternal: boolean;
}

export interface TicketHistoryDto {
  id: string;
  actorName: string;
  actorRole: 'STUDENT' | 'TEACHER' | 'SUPPORT' | 'CONTENT_MANAGER' | 'ADMIN' | 'SYSTEM';
  action: string;
  timestamp: string; // ISO 8601
}

export interface SupportTicketDto {
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
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  slaDeadline: string; // ISO 8601
  isOverdue: boolean;
  contentIssueId?: string;
  notes: TicketNoteDto[];
  history: TicketHistoryDto[];
}

export interface CreateSupportTicketDto {
  studentId: string;
  studentName: string;
  studentEmail: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
}

export interface UpdateTicketStatusDto {
  status: TicketStatus;
  note?: string;
  actorName?: string;
}

export interface AssignTicketDto {
  assigneeId?: string;
  assigneeName: string;
  actorName?: string;
}

export interface AddTicketNoteDto {
  content: string;
  isInternal: boolean;
  authorName?: string;
}

export interface EscalateTicketDto {
  targetContentId: string;
  targetContentType: 'VOCABULARY' | 'GRAMMAR' | 'LESSON' | 'EXERCISE' | 'VIDEO' | 'OTHER';
  targetContentTitle: string;
  title: string;
  description: string;
  issueType: 'TYPO' | 'AUDIO_ERROR' | 'TRANSLATION_WRONG' | 'GRAMMAR_EXPLANATION' | 'BROKEN_MEDIA' | 'OTHER';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  reportedBy: string;
  supportStaffName?: string;
}
