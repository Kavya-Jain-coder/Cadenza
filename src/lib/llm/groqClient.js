import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY;

const groq = apiKey ? new Groq({ apiKey }) : null;

export async function groqGenerate({ systemPrompt, userPrompt, stream = false }) {
  if (!groq) {
    throw new Error('GROQ_API_KEY environment variable is not defined.');
  }

  // Use llama-3.3-70b-versatile or standard models
  const model = 'llama-3.3-70b-versatile';

  if (stream) {
    return await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model,
      stream: true,
      response_format: { type: 'json_object' }
    });
  }

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    model,
    response_format: { type: 'json_object' }
  });

  return completion.choices[0].message.content;
}
