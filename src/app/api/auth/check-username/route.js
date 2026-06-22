import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username')?.trim();

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const isAvailable = !data;

    return NextResponse.json({ available: isAvailable });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
