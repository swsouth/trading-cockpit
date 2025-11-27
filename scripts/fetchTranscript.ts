import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const videoUrl = process.argv[2] || 'https://www.youtube.com/watch?v=aHPZUb-OO-A';
const apiKey = process.env.YOUTUBE_TRANSCRIPT_API_KEY;

if (!apiKey) {
  console.error('❌ YOUTUBE_TRANSCRIPT_API_KEY not set in .env.local');
  process.exit(1);
}

async function fetchTranscript() {
  const params = new URLSearchParams({
    video_url: videoUrl,
    format: 'text',
    include_timestamp: 'false',
    send_metadata: 'true'
  });

  const response = await fetch(
    `https://transcriptapi.com/api/v2/youtube/transcript?${params}`,
    { headers: { 'Authorization': `Bearer ${apiKey}` } }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ API Error:', error);
    process.exit(1);
  }

  const data = await response.json();

  console.log('\n=== VIDEO INFO ===');
  if (data.metadata) {
    console.log('Title:', data.metadata.title);
    console.log('Author:', data.metadata.author_name);
  }
  console.log('\n=== TRANSCRIPT ===\n');
  console.log(data.transcript);
}

fetchTranscript();
