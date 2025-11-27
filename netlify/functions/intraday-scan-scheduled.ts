/**
 * Netlify Scheduled Function - Intraday Scanner
 *
 * Runs every 5 minutes during market hours (9:30 AM - 4:00 PM ET, Mon-Fri)
 * Triggers the intraday scanner via API endpoint
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  console.log('Netlify scheduled function triggered:', new Date().toISOString());

  const siteUrl = process.env.SITE_URL || process.env.URL;
  const scanSecretKey = process.env.SCAN_SECRET_KEY;

  if (!siteUrl) {
    console.error('SITE_URL not configured');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'SITE_URL not configured' }),
    };
  }

  if (!scanSecretKey) {
    console.error('SCAN_SECRET_KEY not configured');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'SCAN_SECRET_KEY not configured' }),
    };
  }

  try {
    const url = `${siteUrl}/api/scan/intraday`;
    console.log(`Triggering intraday scanner: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${scanSecretKey}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Scanner API error:', data);
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: 'Scanner failed',
          details: data,
        }),
      };
    }

    console.log('Intraday scanner completed:', data);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        result: data,
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error) {
    console.error('Scheduled function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Scheduled function failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };
