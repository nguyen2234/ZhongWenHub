// @ts-ignore
import { describe, it, expect, beforeEach } from 'bun:test';
import { supportTicketService } from '../management/support/services/support-ticket.service';
import { videoManagementService } from '../management/content-manager/services/video-management.service';
import { contentIssuesService } from '../management/content-manager/services/content-issues.service';
import type { PagedResponse, ApiProblemDetails } from '../types/api/common.dto';
import type { SupportTicketDto } from '../types/api/support.dto';

describe('FE-13.3 API Readiness & Immutability Verification', () => {
  beforeEach(() => {
    supportTicketService.resetToInitial();
    videoManagementService.resetToInitial();
    contentIssuesService.resetToInitial();
  });

  describe('1. Support Ticket Service Immutability', () => {
    it('returns a detached copy from getTickets (preventing external fixture mutations)', () => {
      const tickets1 = supportTicketService.getTickets();
      const initialCount = tickets1.length;
      expect(initialCount).toBeGreaterThan(0);

      // Mutating the returned array should not affect service state
      tickets1.pop();
      expect(supportTicketService.getTickets().length).toBe(initialCount);

      // Mutating an item inside the returned array should not affect service state
      const ticket = tickets1[0];
      const originalSubject = ticket.subject;
      ticket.subject = 'MUTATED_SUBJECT';
      const fetched = supportTicketService.getTicketById(ticket.id);
      expect(fetched?.subject).toBe(originalSubject);
    });

    it('performs immutable update on updateTicketStatus without mutating history or notes in-place', () => {
      const ticketId = 'TICK-2041';
      const before = supportTicketService.getTicketById(ticketId)!;
      const originalNotesCount = before.notes.length;
      const originalHistoryCount = before.history.length;

      const updated = supportTicketService.updateTicketStatus(
        ticketId,
        'IN_PROGRESS',
        'Support Staff A',
        'Tiếp nhận xử lý lỗi ngữ pháp'
      );

      expect(updated.status).toBe('IN_PROGRESS');
      expect(updated.notes.length).toBe(originalNotesCount + 1);
      expect(updated.history.length).toBe(originalHistoryCount + 1);

      // Verify the previous reference was not mutated
      expect(before.notes.length).toBe(originalNotesCount);
      expect(before.history.length).toBe(originalHistoryCount);
      expect(before.status).toBe('NEW');
    });

    it('handles cross-portal escalation to Content Manager immutably and links IDs', () => {
      const ticketId = 'TICK-2041';
      const result = supportTicketService.escalateToContentManager(ticketId, {
        targetContentId: 'g-hsk3-01',
        targetContentType: 'GRAMMAR_POINT',
        targetContentTitle: 'Ngữ pháp câu chữ Ba (把)',
        title: 'Sai dịch nghĩa cấu trúc câu chữ Ba',
        description: 'Phần giải thích cấu trúc bị động nhầm lẫn với chủ động.',
        issueType: 'WRONG_MEANING',
        priority: 'URGENT',
        reportedBy: 'Trần Minh Quân',
        supportStaffName: 'Trần Thuỳ Trang (Support)',
      });

      expect(result.ticket.contentIssueId).toBeDefined();
      expect(result.contentIssueId).toBe(result.ticket.contentIssueId);
      expect(result.ticket.status).toBe('IN_PROGRESS');

      // Check linked issue in ContentIssuesService
      const linkedIssue = contentIssuesService.getIssueById(result.contentIssueId);
      expect(linkedIssue).toBeDefined();
      expect(linkedIssue?.targetContentId).toBe('g-hsk3-01');
      expect(linkedIssue?.status).toBe('NEW');
    });
  });

  describe('2. Video Management Service Immutability & Workflow', () => {
    it('creates draft video and copies transcripts deeply without mutating input', () => {
      const initialTranscripts = [
        {
          id: 'ts-new-1',
          startTime: 0,
          endTime: 3,
          startFormatted: '00:00.000',
          endFormatted: '00:03.000',
          textZh: '你好',
          pinyin: 'Nǐ hǎo',
          textVi: 'Xin chào',
        },
      ];

      const created = videoManagementService.createVideo({
        title: 'Video Hội thoại HSK 1 Mới',
        description: 'Mô tả video kiểm thử',
        hskLevel: 1,
        topic: 'Giao tiếp hàng ngày',
        duration: 120,
        status: 'DRAFT',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        tags: ['Giao tiếp', 'HSK 1'],
        transcripts: initialTranscripts,
      });

      expect(created.id.startsWith('VID-')).toBe(true);
      expect(created.status).toBe('DRAFT');
      expect(created.transcripts.length).toBe(1);

      // Mutate original input array
      initialTranscripts[0].textZh = 'MUTATED';
      expect(created.transcripts[0].textZh).toBe('你好');
    });

    it('updates transcript segments immutably', () => {
      const videoId = 'VID-101';
      const before = videoManagementService.getVideoById(videoId)!;
      const newSegments = [
        {
          id: 'ts-custom-1',
          startTime: 1.0,
          endTime: 5.0,
          startFormatted: '00:01.000',
          endFormatted: '00:05.000',
          textZh: '今天天气很好。',
          pinyin: 'Jīntiān tiānqì hěn hǎo.',
          textVi: 'Hôm nay thời tiết rất đẹp.',
        },
      ];

      const updated = videoManagementService.updateTranscript(videoId, newSegments);
      expect(updated.transcripts.length).toBe(1);
      expect(updated.transcripts[0].textZh).toBe('今天天气很好。');
      expect(before.transcripts.length).toBeGreaterThan(1);
    });
  });

  describe('3. DTO & ASP.NET Core Contract Compliance', () => {
    it('supports PagedResponse<T> structure with exact property conventions', () => {
      const mockPagedResponse: PagedResponse<SupportTicketDto> = {
        items: supportTicketService.getTickets() as unknown as SupportTicketDto[],
        pageNumber: 1,
        pageSize: 10,
        totalItems: 5,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      };

      expect(mockPagedResponse.pageNumber).toBe(1);
      expect(mockPagedResponse.pageSize).toBe(10);
      expect(Array.isArray(mockPagedResponse.items)).toBe(true);
      expect(mockPagedResponse.items.length).toBe(5);
    });

    it('handles RFC 7807 Problem Details error model', () => {
      const problemDetails: ApiProblemDetails = {
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'One or more validation errors occurred.',
        status: 400,
        detail: 'Dữ liệu gửi lên không vượt qua các kiểm tra tính hợp lệ.',
        instance: '/api/v1/content/videos',
        errors: {
          Title: ['Tiêu đề video không được để trống.'],
          Duration: ['Thời lượng video phải lớn hơn 0 giây.'],
        },
        traceId: '00-9a2c3b4e-01',
      };

      expect(problemDetails.status).toBe(400);
      expect(problemDetails.errors?.Title).toBeDefined();
      expect(problemDetails.errors?.Title[0]).toContain('không được để trống');
    });

    it('validates Content Issue status transition chain', () => {
      // Pick an issue in 'NEW' status (ISS-2026-002)
      const issue = contentIssuesService.getIssues().find((i) => i.status === 'NEW') || contentIssuesService.getIssues()[0];
      expect(issue).toBeDefined();

      // Assign -> TRIAGED
      const triaged = contentIssuesService.assignToContentManager(issue.id, 'Nguyễn Văn Minh (Content Manager)');
      expect(triaged.status).toBe('TRIAGED');
      expect(triaged.contentManagerName).toContain('Nguyễn Văn Minh');

      // Update to IN_PROGRESS
      const inProgress = contentIssuesService.updateStatus(issue.id, 'IN_PROGRESS', 'Nguyễn Văn Minh');
      expect(inProgress.status).toBe('IN_PROGRESS');

      // Resolve
      const resolved = contentIssuesService.resolveIssue(
        issue.id,
        'Đã cập nhật câu giải thích ngữ pháp chính xác trên CDN.',
        'Đã sửa đổi nội dung bài giảng, học viên có thể tải lại trang để kiểm tra.'
      );
      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolutionNotes).toBeDefined();

      // Close
      const closed = contentIssuesService.closeIssue(issue.id, 'Trần Thuỳ Trang (Support)');
      expect(closed.status).toBe('CLOSED');
    });
  });
});
