import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { applyVoice } from '@/lib/voice/provider';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const body = await request.json();
    const { lyricId, instrumentalId, voiceArchetype, audioDataUrl, effectsApplied } = body;

    if (!voiceArchetype && !audioDataUrl) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Call voice generator (mock provider or browser-mix)
    const { audioUrl, metadata } = await applyVoice({
      voiceArchetype,
      audioDataUrl,
      effectsApplied
    });

    // Save final combined track to NeonDB
    const sql = getDb();
    const providerName = audioDataUrl ? 'browser-mix' : 'mock';

    const rows = await sql`
      INSERT INTO tracks (user_id, lyric_id, instrumental_id, voice_archetype, audio_url, provider, effects_applied)
      VALUES (${session.user.id}, ${lyricId || null}, ${instrumentalId || null}, ${voiceArchetype || 'user-vocal'}, ${audioUrl}, ${providerName}, ${effectsApplied ? JSON.stringify(effectsApplied) : null})
      RETURNING id, voice_archetype, audio_url
    `;

    const insertedData = rows[0];

    return NextResponse.json({
      id: insertedData.id,
      audioUrl: insertedData.audio_url,
      voiceArchetype: insertedData.voice_archetype,
      metadata
    });
  } catch (err) {
    console.error('Voice generation API route error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
