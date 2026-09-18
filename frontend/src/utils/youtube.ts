/**
 * Client-side YouTube Utility Functions
 */

export const extractYouTubeVideoId = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Regex matching 11-character YouTube video IDs
  const regExp = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&].*)?$/;
  const match = trimmed.match(regExp);
  return match ? match[1] : null;
};

export const validateYouTubeUrl = (url: string): { isValid: boolean; videoId: string | null; error: string | null } => {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    return {
      isValid: false,
      videoId: null,
      error: 'Please enter a valid YouTube video URL.',
    };
  }

  return {
    isValid: true,
    videoId,
    error: null,
  };
};

export const getYouTubeEmbedUrl = (urlOrId: string): string => {
  const videoId = extractYouTubeVideoId(urlOrId) || (urlOrId.length === 11 ? urlOrId : null);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : urlOrId;
};

export const getYouTubeThumbnailUrl = (urlOrId: string): string => {
  const videoId = extractYouTubeVideoId(urlOrId) || (urlOrId.length === 11 ? urlOrId : null);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
};
