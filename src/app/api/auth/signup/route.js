import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, email, password, genrePreferences } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const sql = getDb();

    // Check if email already exists
    const existingEmail = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;
    if (existingEmail.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Check if username already exists
    const existingUsername = await sql`
      SELECT id FROM users WHERE username = ${username}
    `;
    if (existingUsername.length > 0) {
      return NextResponse.json(
        { error: 'This username is already taken' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user
    const genres = genrePreferences || [];
    const rows = await sql`
      INSERT INTO users (email, password_hash, username, genre_preferences)
      VALUES (${email}, ${passwordHash}, ${username}, ${genres})
      RETURNING id, email, username
    `;

    const newUser = rows[0];

    return NextResponse.json({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      message: 'Account created successfully'
    });
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during signup' },
      { status: 500 }
    );
  }
}
