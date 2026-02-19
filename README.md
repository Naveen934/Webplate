# Leaf Plate Sales Website

A web application for selling eco-friendly leaf plates.

## Tech Stack
- **Frontend**: React, Vite, TailwindCSS
- **Backend**: FastAPI, Python
- **Database**: PostgreSQL (Supabase)

## Local Development

### Backend
1. Navigate to root directory.
2. Install dependencies: `pip install -r backend/requirements.txt`
3. Create `backend/.env` with your secrets (see `backend/.env.example` if available).
4. Run server: `uvicorn backend.main:app --reload`

### Frontend
1. Navigate to `frontend` directory.
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`

## Deployment
- **Backend**: Deployed on Vercel (using `vercel.json`).
- **Frontend**: Deployed on Netlify (using `netlify.toml`).
