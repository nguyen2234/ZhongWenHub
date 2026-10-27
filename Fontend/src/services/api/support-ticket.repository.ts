import type { PagedResponse, PaginationQuery } from '../../types/api/common.dto';
import type {
  SupportTicketDto,
  CreateSupportTicketDto,
  UpdateTicketStatusDto,
  AssignTicketDto,
  AddTicketNoteDto,
  EscalateTicketDto,
} from '../../types/api/support.dto';

export interface ISupportTicketRepository {
  getTickets(query?: PaginationQuery & { status?: string; priority?: string; category?: string; assignee?: string }): Promise<PagedResponse<SupportTicketDto>>;
  getTicketById(id: string): Promise<SupportTicketDto | null>;
  createTicket(dto: CreateSupportTicketDto): Promise<SupportTicketDto>;
  updateStatus(id: string, dto: UpdateTicketStatusDto): Promise<SupportTicketDto>;
  assignTicket(id: string, dto: AssignTicketDto): Promise<SupportTicketDto>;
  addNote(id: string, dto: AddTicketNoteDto): Promise<SupportTicketDto>;
  escalateToContentManager(id: string, dto: EscalateTicketDto): Promise<{ ticket: SupportTicketDto; contentIssueId: string }>;
}
