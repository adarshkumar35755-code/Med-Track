# Antibiotic Awareness & Risk Checker

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

## Datasets — what you actually need

You do **not** need a training dataset for this build. The system uses Gemini
directly with a grounded system prompt (`backend/system_prompt.py`) instead of a
fine-tuned classifier, so there's no labeled data to collect for the hackathon.

What you *do* need is reference/knowledge content, all of which is already
included and can be extended:

1. **`backend/knowledge_base.json`** — myths/facts and safe-advice text. Already
   populated with 7 myth/fact pairs and advice snippets. Feel free to add more
   before the demo; keep them short and factual.
2. **AWaRe-style clinical grounding** — embedded directly in `system_prompt.py`
   as plain-language rules (viral vs. bacterial symptom patterns, red flags,
   why early stopping matters). This mirrors the WHO AWaRe (Access, Watch,
   Reserve) antibiotic classification framework and CDC "Be Antibiotics Aware"
   guidance, but condensed to what's decision-relevant here — no need to pull
   the full datasets.

### If you want to go further after the hackathon
These are the datasets to look at if you later add a real trained
classifier/NER layer instead of prompting an LLM directly:
- **WHO AWaRe antibiotic classification list** — official categorization of
  antibiotics by resistance risk.
- **CDC "Be Antibiotics Aware" campaign materials** — structured guidance on
  appropriate use by condition.
- **MIMIC-III / MIMIC-IV (PhysioNet, credentialed access)** — real prescription
  and antibiotic course data, if you want real-world adherence patterns.
- Public antibiotic dosing references (e.g., national formularies) for a
  dosing-range rule table.

None of these are required to demo what's in this repo.

## Architecture recap
- Deterministic core = the rules embedded in the system prompt + the static
  `knowledge_base.json` advice mapping (auditable, doesn't hallucinate).
- Generative shell = Gemini call that does extraction + risk tiering +
  plain-language explanation in one structured JSON response.
- Frontend never lets the LLM's raw text reach the user unstructured — it's
  always parsed into the typed `CheckResponse` shape first.
