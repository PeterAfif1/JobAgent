# JobAgent

Paste a job posting URL and your resume. JobAgent reads the job description,
scores your resume against it from 0 to 100, then rewrites the weak parts and
re-scores until it hits a target you set or runs out of attempts.

It is built on a LangGraph `StateGraph` so the flow can loop instead of running
once: scrape the JD, score the fit, find gaps, rewrite bullets, score again.
Scoring uses GPT-4o-mini, rewriting uses GPT-4o.

## Requirements

Python 3.10+, Node 18+, and an OpenAI API key.

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then add your OPENAI_API_KEY
uvicorn app.main:app --reload
```

Runs on `http://localhost:8000`. Defaults for threshold, max passes, and models
live in `.env.example`.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` and expects the backend at `http://localhost:8000`.
To point elsewhere, `cp .env.example .env` and set `VITE_API_URL`.

## Note

The scraper handles plain HTML. JavaScript-rendered boards (Greenhouse, Lever,
Workday) come back empty, in which case paste the job text directly.
