import type { PagedResponse, PaginationQuery } from '../../types/api/common.dto';
import type {
  ContentIssueDto,
  CreateContentIssueDto,
  ResolveContentIssueDto,
  ContentIssueStatus,
  ContentPriority,
  ContentIssueType,
} from '../../types/api/content-issue.dto';

export interface IContentIssueRepository {
  getIssues(query?: PaginationQuery & { status?: ContentIssueStatus; priority?: ContentPriority; issueType?: ContentIssueType }): Promise<PagedResponse<ContentIssueDto>>;
  getIssueById(id: string): Promise<ContentIssueDto | null>;
  createIssue(dto: CreateContentIssueDto): Promise<ContentIssueDto>;
  assignToContentManager(id: string, cmName: string, actor: string): Promise<ContentIssueDto>;
  updateStatus(id: string, status: ContentIssueStatus, actor: string, notes?: string): Promise<ContentIssueDto>;
  resolveIssue(id: string, dto: ResolveContentIssueDto): Promise<ContentIssueDto>;
  reopenIssue(id: string, reason: string, actor: string): Promise<ContentIssueDto>;
  closeIssue(id: string, actor: string): Promise<ContentIssueDto>;
}
