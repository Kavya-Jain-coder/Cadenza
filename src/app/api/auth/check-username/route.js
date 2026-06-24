import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username')?.trim();

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const sql = getDb();
    const rows = await sql`
      SELECT username FROM users WHERE username = ${username}
    `;

    const isAvailable = rows.length === 0;

    return NextResponse.json({ available: isAvailable });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
