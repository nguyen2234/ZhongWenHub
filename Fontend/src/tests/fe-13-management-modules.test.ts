// @ts-ignore
import { describe, it, expect, beforeEach } from 'bun:test';
import {
  videoManagementService,
  secondsToTimestamp,
  timestampToSeconds,
} from '../management/content-manager/services/video-management.service';
import { supportTicketService } from '../management/support/services/support-ticket.service';
import { contentIssuesService } from '../management/content-manager/services/content-issues.service';

describe('FE-13.1 Management Frontend & Evondev UI/UX Modules', () => {
  beforeEach(() => {
    supportTicketService.resetToInitial();
  });

  describe('1. Video Management Service (Content Manager)', () => {
    it('should convert seconds to mm:ss.ms timestamps correctly', () => {
      expect(secondsToTimestamp(0)).toBe('00:00.000');
      expect(secondsToTimestamp(65.5)).toBe('01:05.500');
    });

    it('should parse mm:ss.ms timestamps to seconds correctly', () => {
      expect(timestampToSeconds('00:00.000')).toBe(0);
      expect(timestampToSeconds('01:05.500')).toBe(65.5);
      expect(timestampToSeconds('invalid')).toBe(0);
    });

    it('should return default video list with HSK 1-4 demo data', () => {
      const videos = videoManagementService.getVideos();
      expect(videos.length).toBeGreaterThanOrEqual(4);
      const hsk1Video = videos.find((v) => v.hskLevel === 1);
      expect(hsk1Video).toBeDefined();
      expect(hsk1Video?.transcripts.length).toBeGreaterThan(0);
    });

    it('should filter videos accurately by HSK level, status, topic, and keyword search', () => {
      const hsk1Only = videoManagementService.getVideos({ hskLevel: 1 });
      expect(hsk1Only.every((v) => v.hskLevel === 1)).toBe(true);

      const publishedOnly = videoManagementService.getVideos({ status: 'PUBLISHED' });
      expect(publishedOnly.every((v) => v.status === 'PUBLISHED')).toBe(true);

      const searched = videoManagementService.getVideos({ search: 'chào' });
      expect(searched.length).toBeGreaterThan(0);
    });

    it('should support creating, updating, and deleting video metadata and transcripts', () => {
      const newVideo = videoManagementService.createVideo({
        title: 'Video kiểm thử HSK 2',
        description: 'Mô tả video kiểm thử',
        hskLevel: 2,
        topic: 'Giao tiếp hàng ngày',
        duration: 120,
        thumbnailUrl: 'https://example.com/thumb.jpg',
        videoUrl: 'https://example.com/video.mp4',
        lessonId: 'les-1',
        lessonTitle: 'HSK 1 - Bài 1',
        status: 'DRAFT',
        tags: ['test', 'hsk2'],
        transcripts: [
          {
            id: 'seg-test-1',
            startTime: 0,
            endTime: 5,
            startFormatted: '00:00.000',
            endFormatted: '00:05.000',
            textZh: '你好！',
            pinyin: 'Nǐ hǎo!',
            textVi: 'Xin chào!',
          },
        ],
      });

      expect(newVideo.id).toBeDefined();
      expect(newVideo.title).toBe('Video kiểm thử HSK 2');

      const updated = videoManagementService.updateVideo(newVideo.id, {
        title: 'Video kiểm thử đã sửa',
        status: 'PUBLISHED',
      });
      expect(updated?.title).toBe('Video kiểm thử đã sửa');
      expect(updated?.status).toBe('PUBLISHED');

      const deleted = videoManagementService.deleteVideo(newVideo.id);
      expect(deleted).toBe(true);
      expect(videoManagementService.getVideoById(newVideo.id)).toBeUndefined();
    });
  });

  describe('2. Support Ticket Service & Cross-Portal Content Escalation', () => {
    it('should compute executive support KPIs and SLA indicators accurately', () => {
      const metrics = supportTicketService.getMetrics();
      expect(metrics.total).toBeGreaterThanOrEqual(5);
      expect(metrics.newCount).toBeGreaterThanOrEqual(1);
      expect(metrics.inProgress).toBeGreaterThanOrEqual(1);
      expect(metrics.urgent).toBeGreaterThanOrEqual(1);
      expect(typeof metrics.avgResolutionHours).toBe('number');
      expect(typeof metrics.satisfactionRate).toBe('number');
    });

    it('should filter tickets by status, priority, category, and search query', () => {
      const newTickets = supportTicketService.getTickets({ status: 'NEW' });
      expect(newTickets.every((t) => t.status === 'NEW')).toBe(true);

      const urgentTickets = supportTicketService.getTickets({ priority: 'URGENT' });
      expect(urgentTickets.every((t) => t.priority === 'URGENT')).toBe(true);

      const contentCategory = supportTicketService.getTickets({ category: 'CONTENT' });
      expect(contentCategory.every((t) => t.category === 'CONTENT')).toBe(true);

      const searched = supportTicketService.getTickets({ search: 'ngữ pháp' });
      expect(searched.length).toBeGreaterThan(0);
    });

    it('should update ticket status, record activity history, and add notes', () => {
      const tickets = supportTicketService.getTickets();
      const firstTicket = tickets[0];

      const updated = supportTicketService.updateTicketStatus(
        firstTicket.id,
        'RESOLVED',
        'Kiểm thử viên',
        'Đã xử lý xong phản hồi cho học viên'
      );

      expect(updated).toBeDefined();
      expect(updated.status).toBe('RESOLVED');
      expect(updated.history.some((a) => a.action.includes('RESOLVED'))).toBe(true);

      const ticketWithNote = supportTicketService.addNote(
        firstTicket.id,
        'Ghi chú nội bộ cho ticket',
        'Kiểm thử viên',
        true
      );
      expect(ticketWithNote.notes.some((n) => n.content === 'Ghi chú nội bộ cho ticket')).toBe(true);
    });

    it('should escalate a support ticket to Content Manager creating an issue in contentIssuesService', () => {
      const tickets = supportTicketService.getTickets({ category: 'CONTENT' });
      const targetTicket = tickets[0] || supportTicketService.getTickets()[0];

      const initialIssuesCount = contentIssuesService.getIssues().length;

      const result = supportTicketService.escalateToContentManager(targetTicket.id, {
        targetContentId: 'grammar-hsk2-01',
        targetContentType: 'GRAMMAR_POINT',
        targetContentTitle: 'Cấu trúc câu chữ 把 trong HSK 2',
        title: 'Sai lệch cấu trúc câu chữ 把 trong bài giảng',
        description: 'Học viên báo phần dịch nghĩa bị đảo vị trí tân ngữ.',
        issueType: 'WRONG_MEANING',
        priority: 'HIGH',
        reportedBy: targetTicket.studentName,
        supportStaffName: 'Trần Thuỳ Trang (Support)',
      });

      expect(result).not.toBeNull();
      expect(result.contentIssueId).toBeDefined();
      expect(result.ticket.status).toBe('IN_PROGRESS');
      expect(result.ticket.contentIssueId).toBe(result.contentIssueId);

      // Verify cross-portal issue is now present in Content Manager
      const newIssuesCount = contentIssuesService.getIssues().length;
      expect(newIssuesCount).toBe(initialIssuesCount + 1);

      const createdIssue = contentIssuesService.getIssues().find((i) => i.id === result.contentIssueId);
      expect(createdIssue).toBeDefined();
      expect(createdIssue?.title).toBe('Sai lệch cấu trúc câu chữ 把 trong bài giảng');
      expect(createdIssue?.targetContentType).toBe('GRAMMAR_POINT');
    });
  });
});
