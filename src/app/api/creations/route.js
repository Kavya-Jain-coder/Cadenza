import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const sql = getDb();
    const userId = session.user.id;

    // Fetch lyrics
    const lyrics = await sql`
      SELECT * FROM lyrics WHERE user_id = ${userId} ORDER BY created_at DESC
    `;

    // Fetch instrumentals
    const instrumentals = await sql`
      SELECT * FROM instrumentals WHERE user_id = ${userId} ORDER BY created_at DESC
    `;

    // Fetch tracks
    const tracks = await sql`
      SELECT * FROM tracks WHERE user_id = ${userId} ORDER BY created_at DESC
    `;

    return NextResponse.json({
      lyrics: lyrics || [],
      instrumentals: instrumentals || [],
      tracks: tracks || []
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    // Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');

    if (!id || !type) {
      return NextResponse.json({ error: 'Missing id or type parameter' }, { status: 400 });
    }

    const sql = getDb();
    const userId = session.user.id;

    // Execute delete on the correct table (safe whitelist, no dynamic SQL needed)
    if (type === 'lyric') {
      await sql`DELETE FROM lyrics WHERE id = ${id} AND user_id = ${userId}`;
    } else if (type === 'instrumental') {
      await sql`DELETE FROM instrumentals WHERE id = ${id} AND user_id = ${userId}`;
    } else if (type === 'track') {
      await sql`DELETE FROM tracks WHERE id = ${id} AND user_id = ${userId}`;
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
