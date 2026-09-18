/**
 * YouTube URL Validator and Video ID Extractor
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 */

const extractYouTubeVideoId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Regex matching 11-character YouTube video IDs across standard formats
  const regExp = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&].*)?$/;
  const match = trimmed.match(regExp);
  return match ? match[1] : null;
};

const validateYouTubeUrl = (url) => {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    return {
      isValid: false,
      videoId: null,
      embedUrl: '',
      thumbnailUrl: '',
      error: 'Please enter a valid YouTube video URL.',
    };
  }

  return {
    isValid: true,
    videoId,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    error: null,
  };
};

const getYouTubeThumbnailUrl = (videoId) => (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '');
const getYouTubeEmbedUrl = (videoId) => (videoId ? `https://www.youtube.com/embed/${videoId}` : '');

module.exports = {
  extractYouTubeVideoId,
  validateYouTubeUrl,
  getYouTubeThumbnailUrl,
  getYouTubeEmbedUrl,
};
