import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // A simple, free text-to-speech workaround using Google Translate TTS
    // Split text into chunks of max 200 characters to avoid API limits
    const chunks = text.match(/.{1,200}(?:\s|$)/g) || [text];
    
    const fetches = chunks.map(async (chunk) => {
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk.trim())}&tl=en&client=tw-ob`;
      const response = await fetch(ttsUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (!response.ok) throw new Error(`TTS API failed: ${response.statusText}`);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer).toString('base64');
    });

    const base64Chunks = await Promise.all(fetches);

    return NextResponse.json({ audioChunks: base64Chunks });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
