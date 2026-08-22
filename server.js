require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const PROMPT_TEMPLATE = (url) => `
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

Return ONLY the JSON. Nothing before it, nothing after it.
`;

app.post('/analyze', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'TrueReview'
      },
      body: JSON.stringify({
        model: 'openrouter/auto',
        messages: [
          {
            role: 'user',
            content: PROMPT_TEMPLATE(url)
          }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'OpenRouter API error');

    let raw = data.choices?.[0]?.message?.content || '';

    // clean markdown
    raw = raw.replace(/```json|```/g, '').trim();

    // extract only the JSON object
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON in response');

    const jsonStr = raw.slice(start, end + 1);
    const parsed = JSON.parse(jsonStr);
    res.json(parsed);

  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TrueReview running at http://localhost:${PORT}`);
});