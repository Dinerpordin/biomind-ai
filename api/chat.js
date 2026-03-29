// BioMind AI - Serverless chat function
// Uses openrouter/free router which auto-selects from all available free models
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing API key' });

  const { question } = req.body || {};
  if (!question || typeof question !== 'string') return res.status(400).json({ error: 'Invalid question' });

  // Try models in order until one works
  const models = [
    'meta-llama/llama-3.2-3b-instruct:free',
    'google/gemma-3-27b-it:free',
    'mistralai/mistral-small-3.1-24b-instruct:free',
    'openrouter/auto'
  ];

  const systemPrompt = 'You are BioMind AI, a friendly and knowledgeable assistant specialising in biology, neuroscience, psychology, and wellness. Give concise, accurate, educational answers in 2-4 sentences. Use simple clear language.';

  for (const model of models) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://biomind-ai-ten.vercel.app',
          'X-Title': 'BioMind AI'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question }
          ],
          max_tokens: 400
        })
      });

      const data = await response.json();
      console.log(`Model ${model} status:`, response.status, JSON.stringify(data).slice(0, 200));

      if (data.error) {
        console.warn(`Model ${model} error:`, data.error.message || data.error);
        continue; // try next model
      }

      const answer = data?.choices?.[0]?.message?.content;
      if (answer) {
        return res.status(200).json({ answer });
      }

      console.warn(`Model ${model} returned empty answer, trying next...`);
    } catch (err) {
      console.error(`Model ${model} threw:`, err.message);
    }
  }

  return res.status(200).json({ answer: 'All AI models are currently busy. Please try again in a moment.' });
}
