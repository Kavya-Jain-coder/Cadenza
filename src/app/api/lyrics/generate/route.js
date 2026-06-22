import { createClient } from '@/lib/supabase/server';
import { retrieveGroundingSnippets } from '@/lib/lyricsGrounding/retriever';
import { buildSystemPrompt, buildUserPrompt } from '@/lib/llm/promptBuilder';
import { generateLyrics } from '@/lib/llm/provider';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    // Parse inputs
    const body = await request.json();
    const { language, seedPhrase, genre, mood, tempo, structure, rhymeDensity } = body;

    if (!seedPhrase || !genre || !language) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 1. Retrieve grounding snippets from database
    const groundingSnippets = await retrieveGroundingSnippets(supabase, { genre });

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

    // 5. Persist to Supabase
    const { data: insertedData, error: dbError } = await supabase
      .from('lyrics')
      .insert({
        user_id: user.id,
        language,
        seed_phrase: seedPhrase,
        genre,
        mood,
        tempo,
        structure,
        rhyme_density: rhymeDensity,
        sections: parsedResult.sections || []
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error inserting lyrics into DB:', dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      id: insertedData.id,
      title: parsedResult.title || 'Untitled Creation',
      sections: insertedData.sections
    });
  } catch (err) {
    console.error('Lyric generation route error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
