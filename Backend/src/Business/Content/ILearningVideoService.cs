using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Content.DTOs;

namespace ZhongWenHub.Business.Content;

public interface ILearningVideoService
{
    Task<PagedResponse<LearningVideoDto>> GetVideosAsync(
        LearningVideoQueryDto query,
        bool publishedOnly = true,
        CancellationToken cancellationToken = default);

    Task<LearningVideoDto?> GetVideoByIdAsync(
        Guid id,
        bool isStaff = false,
        CancellationToken cancellationToken = default);

    Task<List<string>> GetAvailableTopicsAsync(CancellationToken cancellationToken = default);

    Task<PagedResponse<LearningVideoDto>> GetAdminVideosAsync(
        LearningVideoAdminQueryDto query,
        CancellationToken cancellationToken = default);

    Task<LearningVideoDto> CreateVideoAsync(
        CreateLearningVideoDto dto,
        CancellationToken cancellationToken = default);

    Task<LearningVideoDto> UpdateVideoAsync(
        Guid id,
        UpdateLearningVideoDto dto,
        CancellationToken cancellationToken = default);

    Task<LearningVideoDto> UpdateStatusAsync(
        Guid id,
        string newStatus,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteVideoAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    VideoStorageStatusDto GetStorageStatus();
}

