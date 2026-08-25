# TrueReview — Genuine Product Review Analyzer

Paste any product URL and get honest insights from real user reviews across Reddit, Amazon, forums, and more — powered by AI.

---

## Project Structure

```
truereview/
├── index.html      ← Frontend (UI)
├── server.js       ← Backend (Node.js + Express)
├── package.json    ← Dependencies
├── .env.example    ← API key template
├── .gitignore      ← Ignores node_modules and .env
└── README.md
```

---

## Tech Stack

- **Frontend** — HTML, CSS, JavaScript
- **Backend** — Node.js + Express
- **AI** — OpenRouter API (free tier)
- **Model** — openrouter/auto (picks best available free model)

---

## Setup (Step by Step)

### 1. Install Node.js
- Download from https://nodejs.org (choose LTS version)
- Install it, then verify:
```bash
node -v
npm -v
```

### 2. Get your OpenRouter API key
- Go to https://openrouter.ai
- Sign up / log in
- Click **API Keys** → **Create Key**
- Copy it (starts with `sk-or-v1-...`)

### 3. Install dependencies
Open terminal in the `truereview` folder and run:
```bash
npm install
npm install dotenv
```

### 4. Set up your `.env` file
Rename `.env.example` to `.env` and add your key:
```
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxx
PORT=3000
```

### 5. Run the server
```bash
node server.js
```

You should see:
```
TrueReview running at http://localhost:3000
```

### 6. Open the app
Go to **http://localhost:3000** in your browser. Paste any product URL and hit Analyze!

---

## How it works

```
Browser (index.html)
    ↓  POST /analyze  { url: "..." }
server.js (Node.js + Express)
    ↓  calls OpenRouter API with your secret key
OpenRouter API (AI model)
    ↓  researches reviews and returns JSON data
server.js
    ↓  sends JSON back to browser
Browser renders the results dashboard
```

Your API key stays on the server — never exposed to the browser.

---

## What it shows

- Overall score (out of 10)
- Total reviews found
- Trust score
- Sentiment breakdown (Positive / Neutral / Negative)
- What people love (Pros)
- Common complaints (Cons)
- Honest verdict
- Sources checked

---

