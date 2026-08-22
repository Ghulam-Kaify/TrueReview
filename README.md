# TrueReview — Genuine Product Review Analyzer

Paste any product URL and get honest insights from real user reviews across Reddit, Amazon, forums, and more.

---

## Project Structure

```
reviewapp/
├── index.html      ← Frontend (UI)
├── server.js       ← Backend (Node.js + Express)
├── package.json    ← Dependencies
├── .env.example    ← API key template
└── README.md
```

---

## Setup (Step by Step)

### 1. Get your Anthropic API key
- Go to https://console.anthropic.com
- Sign up / log in
- Go to "API Keys" → Create a new key
- Copy it

### 2. Install Node.js
- Download from https://nodejs.org (choose LTS version)
- Install it, then verify: open terminal and run `node -v`

### 3. Set up the project
Open terminal in the `reviewapp` folder and run:

```bash
# Install dependencies
npm install

# Create your .env file
cp .env.example .env
```

### 4. Add your API key
Open `.env` in any text editor and replace:
```
ANTHROPIC_API_KEY=your_api_key_here
```
with your actual key.

### 5. Run the server
```bash
node server.js
```

You should see:
```
TrueReview server running at http://localhost:3000
```

### 6. Open the app
Go to http://localhost:3000 in your browser. Paste any product URL and hit Analyze!

---

## How it works

```
Browser (index.html)
    ↓  POST /analyze  { url: "..." }
server.js (Express)
    ↓  calls Anthropic API with your secret key
Anthropic API (Claude + web search)
    ↓  returns JSON review data
server.js
    ↓  sends JSON back to browser
Browser renders the results dashboard
```

Your API key stays on the server — never exposed to the browser.

---

## Next Step: Deploy to the internet (Step 3)
Once this works locally, we'll deploy it free on Vercel so anyone can use it.
