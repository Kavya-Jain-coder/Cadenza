import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch target audio: ${response.status}`);
    }

    // Pass the response body through directly, but overwrite CORS headers
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');

    return new NextResponse(response.body, {
      status: 200,
      headers
    });
  } catch (err) {
    console.error('Audio proxy error:', err);
    return new NextResponse(err.message, { status: 500 });
  }
}
