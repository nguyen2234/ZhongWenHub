import { useState, useEffect, useCallback, useRef } from 'react';
import type { LearningVideo, LearningVideoQuery } from '../types/video-learning.types';
import { videoLearningService, STANDARD_VIDEO_TOPICS } from '../services/video-learning.service';

export interface UseVideoLibraryOptions {
  initialHskLevel?: number | 'all';
  initialTopic?: string;
  initialSource?: string;
  pageSize?: number;
}

export function useVideoLibrary(options: UseVideoLibraryOptions = {}) {
  const [videos, setVideos] = useState<LearningVideo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>(options.initialHskLevel ?? 'all');
  const [selectedTopic, setSelectedTopic] = useState<string>(options.initialTopic ?? 'all');
  const [selectedSource, setSelectedSource] = useState<string>(options.initialSource ?? 'all');
  const [availableTopics, setAvailableTopics] = useState<string[]>(STANDARD_VIDEO_TOPICS);

  const pageSize = options.pageSize ?? 12;
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Load available topics once
  useEffect(() => {
    let mounted = true;
    videoLearningService.fetchTopics().then((topics) => {
      if (mounted && topics.length > 0) {
        setAvailableTopics(topics);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch videos on query or page changes
  const loadVideos = useCallback(async () => {
    setLoading(true);
    setError(null);

    const query: LearningVideoQuery = {
      page,
      pageSize,
      search: debouncedSearch.trim() || undefined,
      hskLevel: selectedLevel !== 'all' ? selectedLevel : undefined,
      topic: selectedTopic !== 'all' ? selectedTopic : undefined,
      sourceType: selectedSource !== 'all' ? selectedSource : undefined,
    };

    try {
      const response = await videoLearningService.fetchVideos(query);
      setVideos(response.items);
      setTotalItems(response.totalItems);
      setTotalPages(Math.max(1, response.totalPages));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể kết nối đến máy chủ video.';
      setError(message);
      setVideos([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, selectedLevel, selectedTopic, selectedSource]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const handleLevelChange = (level: number | 'all') => {
    setSelectedLevel(level);
    setPage(1);
  };

  const handleTopicChange = (topic: string) => {
    setSelectedTopic(topic);
    setPage(1);
  };

  const handleSourceChange = (source: string) => {
    setSelectedSource(source);
    setPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedLevel('all');
    setSelectedTopic('all');
    setSelectedSource('all');
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedLevel !== 'all' ||
    selectedTopic !== 'all' ||
    selectedSource !== 'all';

  return {
    videos,
    loading,
    error,
    totalItems,
    totalPages,
    page,
    setPage,
    searchQuery,
    setSearchQuery,
    selectedLevel,
    setSelectedLevel: handleLevelChange,
    selectedTopic,
    setSelectedTopic: handleTopicChange,
    selectedSource,
    setSelectedSource: handleSourceChange,
    availableTopics,
    refetch: loadVideos,
    resetFilters,
    hasActiveFilters,
  };
}

