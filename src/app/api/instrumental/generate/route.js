import { createClient } from '@/lib/supabase/server';
import { generateInstrumental } from '@/lib/instrumental/provider';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = await createClient();

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const body = await request.json();
    const { lyricId, genre, instruments } = body;

    if (!genre || !instruments || !Array.isArray(instruments)) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Call generator
    const { audioUrl, metadata } = await generateInstrumental({
      supabase,
      genre,
      instruments
    });

    // Save to DB
    const { data: insertedData, error: dbError } = await supabase
      .from('instrumentals')
      .insert({
        user_id: user.id,
        lyric_id: lyricId || null,
        instruments,
        audio_url: audioUrl,
        provider: 'mock'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error inserting instrumental into DB:', dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

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
