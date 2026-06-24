import { getDb } from '@/lib/db';

export async function retrieveGroundingSnippets({ genre }) {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT content, category FROM lyric_corpus WHERE genre = ${genre?.toLowerCase()}
    `;

    return rows || [];
  } catch (err) {
    console.error('Unexpected retriever error:', err.message);
    return [];
  }
}
