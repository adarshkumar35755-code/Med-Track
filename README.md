# Antibiotic Awareness & Risk Checkee



Prototype link --   
https://med-track-2.onrender.com/

Deployed using - Render
## Run it

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env                                # then paste your key into .env
uvicorn main:app --reload --port 8000
```
Get a free Groq API key (no credit card) at **console.groq.com/keys**, sign in,
click "Create API Key," and paste it into `backend/.env` as `GROQ_API_KEY=...`.

> **Why Groq instead of Gemini:** as of March 2026 Google requires prepaid billing
> for new AI Studio accounts even to use the "free" tier, so Groq is the more
> reliably free option right now. Both are OpenAI-compatible-ish; the code that
> calls the LLM is isolated to a few lines in `main.py` if you want to swap providers
> again later (OpenRouter and Cerebras are other genuinely-free, no-card options).

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open the printed localhost URL. If your backend runs somewhere other than
`localhost:8000`, set `VITE_API_URL` in a `.env` file in `frontend/`.

## Architecture recap
- Deterministic core = the rules embedded in the system prompt + the static
  `knowledge_base.json` advice mapping (auditable, doesn't hallucinate).
- Generative shell = Gemini call that does extraction + risk tiering +
  plain-language explanation in one structured JSON response.
- Frontend never lets the LLM's raw text reach the user unstructured — it's
  always parsed into the typed `CheckResponse` shape first.

