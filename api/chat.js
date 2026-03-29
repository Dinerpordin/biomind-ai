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
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [
          { role: 'system', content: 'You are BioMind AI, a friendly and knowledgeable assistant specialising in biology, neuroscience, psychology, and wellness. Give concise, accurate, educational answers in 2-4 sentences. Use simple clear language.' },
          { role: 'user', content: question }
        ],
        max_tokens: 400
      })
    });
    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content || 'I could not get a response. Please try again!';
    return res.status(200).json({ answer });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error contacting AI service' });
  }
}
