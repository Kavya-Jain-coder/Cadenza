import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const supabase = await createClient();

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    // Fetch lyrics
    const { data: lyrics, error: lyricError } = await supabase
      .from('lyrics')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Fetch instrumentals
    const { data: instrumentals, error: instError } = await supabase
      .from('instrumentals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Fetch tracks
    const { data: tracks, error: trackError } = await supabase
      .from('tracks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (lyricError || instError || trackError) {
      return NextResponse.json({
        error: lyricError?.message || instError?.message || trackError?.message
      }, { status: 500 });
    }

    return NextResponse.json({
      lyrics: lyrics || [],
      instrumentals: instrumentals || [],
      tracks: tracks || []
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
