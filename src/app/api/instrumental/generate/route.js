import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { generateInstrumental } from '@/lib/instrumental/provider';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const body = await request.json();
    const { lyricId, genre, instruments, audioDataUrl } = body;

    if (!genre || !instruments || !Array.isArray(instruments)) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Call generator
    const { audioUrl, metadata } = await generateInstrumental({
      genre,
      instruments,
      audioDataUrl
    });

    // Save to NeonDB
    const sql = getDb();
    const instrumentsJson = JSON.stringify(instruments);
    const providerName = audioDataUrl ? 'browser-synth' : 'mock';

    const rows = await sql`
      INSERT INTO instrumentals (user_id, lyric_id, instruments, audio_url, provider)
      VALUES (${session.user.id}, ${lyricId || null}, ${instrumentsJson}::jsonb, ${audioUrl}, ${providerName})
      RETURNING id, instruments, audio_url
    `;

    const insertedData = rows[0];

    return NextResponse.json({
      id: insertedData.id,
      audioUrl: insertedData.audio_url,
      instruments: insertedData.instruments,
      metadata
    });
  } catch (err) {
    console.error('Instrumental generation error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
