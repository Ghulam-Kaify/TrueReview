import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  url: { type: String, unique: true },
  product_name: String,
  overall_score: Number,
  total_reviews_found: Number,
  sentiment: Object,
  trust_score: Number,
  pros: [String],
  cons: [String],
  verdict: String,
  sources: [String],
  createdAt: { type: Date, default: Date.now }
});

const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  // check cache
  try {
    await connectDB();
    const cached = await Review.findOne({ url }).lean();
    if (cached) {
      console.log('Cache hit:', cached.product_name);
      const { _id, __v, ...data } = cached;
      return res.json(data);
    }
  } catch (err) {
    console.error('Cache read error:', err.message);
  }

  const PROMPT = `
You are a product review analyst. Analyze user opinion for this product: ${url}

Use the product name visible in the URL. Base your answer on what real users commonly say on Reddit, Amazon, tech forums and YouTube about this specific product.

Respond with ONLY a valid JSON object with exactly these fields:

{
  "product_name": string,
  "overall_score": number between 1 and 10 (one decimal),
  "total_reviews_found": integer estimate,
  "sentiment": { "positive": number, "neutral": number, "negative": number } (must sum to 100),
  "trust_score": integer 0-100,
  "pros": [4 short strings],
  "cons": [3 short strings],
  "verdict": string (2-3 sentences),
  "sources": [strings]
}

Every field must be filled with product-specific values. No placeholders. No text outside the JSON.
`;

  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: PROMPT }],
          temperature: 0.2,
          max_tokens: 800,
          response_format: { type: 'json_object' }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Groq API error');

      const raw = data.choices?.[0]?.message?.content || '';
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error('No JSON in response');

      const parsed = JSON.parse(raw.slice(start, end + 1));

      const required = ['product_name', 'overall_score', 'total_reviews_found', 'sentiment', 'trust_score', 'pros', 'cons', 'verdict', 'sources'];
      const missing = required.filter(k => !parsed[k]);
      if (missing.length > 0) throw new Error(`Missing fields: ${missing.join(', ')}`);

      // save to cache
      try {
        await connectDB();
        await Review.create({ url, ...parsed });
        console.log('Saved to cache:', parsed.product_name);
      } catch (dbErr) {
        console.error('Cache write error:', dbErr.message);
      }

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