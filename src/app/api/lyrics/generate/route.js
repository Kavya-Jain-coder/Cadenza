import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { retrieveGroundingSnippets } from '@/lib/lyricsGrounding/retriever';
import { buildSystemPrompt, buildUserPrompt } from '@/lib/llm/promptBuilder';
import { generateLyrics } from '@/lib/llm/provider';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    // Parse inputs
    const body = await request.json();
    const { language, seedPhrase, genre, mood, tempo, structure, rhymeDensity } = body;

    if (!seedPhrase || !genre || !language) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 1. Retrieve grounding snippets from database
    const groundingSnippets = await retrieveGroundingSnippets({ genre });

    // 2. Build prompt
    const systemPrompt = buildSystemPrompt(groundingSnippets);
    const userPrompt = buildUserPrompt({
      language,
      seedPhrase,
      genre,
      mood,
      tempo,
      structure,
      rhymeDensity
    });

    // 3. Generate lyrics from Groq
    const rawResult = await generateLyrics({
      systemPrompt,
      userPrompt,
      stream: false
    });

    // 4. Parse output
    let parsedResult;
    try {
      parsedResult = JSON.parse(rawResult);
    } catch (parseErr) {
      console.error('Failed to parse LLM JSON:', rawResult);
      // Clean fallback if model returned markdown wrapper or invalid JSON
      const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse generated lyrics as JSON');
      }
    }

    // 5. Persist to NeonDB
    const sql = getDb();
    const title = parsedResult.title || 'Untitled Creation';
    const sections = JSON.stringify(parsedResult.sections || []);

    const rows = await sql`
      INSERT INTO lyrics (user_id, title, language, seed_phrase, genre, mood, tempo, structure, rhyme_density, sections)
      VALUES (${session.user.id}, ${title}, ${language}, ${seedPhrase}, ${genre}, ${mood || null}, ${tempo || null}, ${structure || null}, ${rhymeDensity || null}, ${sections}::jsonb)
      RETURNING id, title, sections
    `;

    const insertedData = rows[0];

    return NextResponse.json({
      id: insertedData.id,
      title: insertedData.title,
      sections: insertedData.sections
    });
  } catch (err) {
    console.error('Lyric generation route error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
