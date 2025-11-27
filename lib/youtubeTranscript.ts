// YouTube Transcript API helper
// API Docs: https://transcriptapi.com/docs

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface TranscriptResponse {
  video_id: string;
  language: string;
  transcript: TranscriptSegment[] | string;
  metadata?: {
    title: string | null;
    author_name: string | null;
    author_url: string | null;
    thumbnail_url: string | null;
  };
}

export async function getYouTubeTranscript(
  videoUrl: string,
  options: {
    format?: 'json' | 'text';
    includeTimestamp?: boolean;
    includeMetadata?: boolean;
  } = {}
): Promise<TranscriptResponse> {
  const apiKey = process.env.YOUTUBE_TRANSCRIPT_API_KEY;

  if (!apiKey) {
    throw new Error('YOUTUBE_TRANSCRIPT_API_KEY not configured in .env.local');
  }

  const params = new URLSearchParams({
    video_url: videoUrl,
    format: options.format || 'json',
    include_timestamp: String(options.includeTimestamp ?? true),
    send_metadata: String(options.includeMetadata ?? true)
  });

  const response = await fetch(
    `https://transcriptapi.com/api/v2/youtube/transcript?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Transcript API error (${response.status}): ${error.detail || response.statusText}`);
  }

  return response.json();
}

// Helper: Get transcript as plain text
export async function getTranscriptText(videoUrl: string): Promise<string> {
  const result = await getYouTubeTranscript(videoUrl, {
    format: 'text',
    includeTimestamp: false,
    includeMetadata: false
  });

  return result.transcript as string;
}
