import type { PagedResponse, PaginationQuery } from '../../types/api/common.dto';
import type { VideoContentDto, CreateVideoDto, UpdateVideoDto, TranscriptSegmentDto } from '../../types/api/video.dto';

export interface IVideoRepository {
  getVideos(query?: PaginationQuery & { hskLevel?: number; status?: string; topic?: string }): Promise<PagedResponse<VideoContentDto>>;
  getVideoById(id: string): Promise<VideoContentDto | null>;
  createVideo(dto: CreateVideoDto): Promise<VideoContentDto>;
  updateVideo(id: string, dto: UpdateVideoDto): Promise<VideoContentDto>;
  deleteVideo(id: string): Promise<boolean>;
  updateTranscripts(id: string, transcripts: TranscriptSegmentDto[]): Promise<VideoContentDto>;
}
