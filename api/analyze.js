export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  const PROMPT = `
You are a product review researcher. Research genuine user reviews for this product: ${url}

Search Reddit discussions, Amazon reviews, tech forums, YouTube comments, and community sources for this SPECIFIC product.

Based on your actual research, respond ONLY with a valid JSON object — no markdown, no backticks, no explanation before or after. Use REAL data you find, not placeholder numbers.

{
  "product_name": "actual product name from the URL",
  "overall_score": 7.5,
  "total_reviews_found": 850,
  "sentiment": { "positive": 70, "neutral": 18, "negative": 12 },
  "trust_score": 75,
  "pros": ["actual pro from real reviews", "actual pro", "actual pro", "actual pro"],
  "cons": ["actual con from real reviews", "actual con", "actual con"],
  "verdict": "2-3 sentences summarizing what real users actually say about this specific product",
  "sources": ["actual sources you checked like Reddit, Amazon, etc"]
}

IMPORTANT: You MUST return a complete JSON object with ALL fields filled with real data. Never leave any field empty or as placeholder text. If you don't know exact numbers, make reasonable estimates based on the product type and name. Return ONLY the JSON. Nothing before it, nothing after it.
`;

  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://true-review-taupe.vercel.app',
          'X-Title': 'TrueReview'
        },
        body: JSON.stringify({
          model: 'openrouter/auto',
          messages: [{ role: 'user', content: PROMPT }]
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'OpenRouter API error');

      let raw = data.choices?.[0]?.message?.content || '';
      raw = raw.replace(/```json|```/g, '').trim();

      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error('No JSON in response');

      const parsed = JSON.parse(raw.slice(start, end + 1));

      // validate all required fields exist
      const required = ['product_name', 'overall_score', 'total_reviews_found', 'sentiment', 'trust_score', 'pros', 'cons', 'verdict', 'sources'];
      const missing = required.filter(k => !parsed[k]);
      if (missing.length > 0) throw new Error(`Missing fields: ${missing.join(', ')}`);

      return res.json(parsed);

    } catch (err) {
      attempt++;
      console.error(`Attempt ${attempt} failed:`, err.message);
      if (attempt === MAX_RETRIES) {
        return res.status(500).json({ error: err.message });
      }
    }
  }
}