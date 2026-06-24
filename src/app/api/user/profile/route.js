import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const sql = getDb();
    const userId = session.user.id;

    const userProfile = await sql`
      SELECT voice_footprint FROM users WHERE id = ${userId}
    `;

    return NextResponse.json({
      voiceFootprint: userProfile?.[0]?.voice_footprint || null
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const body = await request.json();
    const { voiceFootprint } = body;

    if (!voiceFootprint) {
      return NextResponse.json({ error: 'Missing voice footprint data' }, { status: 400 });
    }

    const sql = getDb();
    const userId = session.user.id;

    await sql`
      UPDATE users SET voice_footprint = ${JSON.stringify(voiceFootprint)} WHERE id = ${userId}
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
