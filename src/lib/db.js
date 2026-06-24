import { neon } from '@neondatabase/serverless';

/**
 * Returns a tagged template SQL executor bound to the NeonDB connection.
 * Usage:
 *   const sql = getDb();
 *   const rows = await sql`SELECT * FROM users WHERE id = ${userId}`;
 */
export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is not set. Please add your NeonDB connection string to .env.local'
    );
  }

  return neon(databaseUrl);
}
