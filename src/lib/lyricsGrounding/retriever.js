export async function retrieveGroundingSnippets(supabase, { genre }) {
  try {
    const { data, error } = await supabase
      .from('lyric_corpus')
      .select('content, category')
      .eq('genre', genre?.toLowerCase());

    if (error) {
      console.error('Error retrieving grounding snippets:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected retriever error:', err.message);
    return [];
  }
}
