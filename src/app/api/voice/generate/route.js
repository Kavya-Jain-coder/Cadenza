import { createClient } from '@/lib/supabase/server';
import { applyVoice } from '@/lib/voice/provider';
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
    const { lyricId, instrumentalId, voiceArchetype } = body;

    if (!voiceArchetype) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Call voice generator
    const { audioUrl, metadata } = await applyVoice({
      supabase,
      voiceArchetype
    });

    // Save final combined track to DB
    const { data: insertedData, error: dbError } = await supabase
      .from('tracks')
      .insert({
        user_id: user.id,
        lyric_id: lyricId || null,
        instrumental_id: instrumentalId || null,
        voice_archetype: voiceArchetype,
        audio_url: audioUrl,
        provider: 'mock'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error inserting track into DB:', dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

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
