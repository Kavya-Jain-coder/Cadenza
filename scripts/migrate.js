const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set in .env.local');
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  try {
    console.log('Running database migration...');
    await sql`ALTER TABLE tracks ADD COLUMN IF NOT EXISTS effects_applied JSONB DEFAULT NULL;`;
    console.log('Migration successful: effects_applied column added (if not exists).');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

main();
