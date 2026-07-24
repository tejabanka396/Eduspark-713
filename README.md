# EduSpark AI

**EduSpark AI** is an AI‑powered personalized learning platform for primary schools. It supports four user roles (Admin, Teacher, Parent, Student) with role‑based dashboards, AI tutoring, OCR, voice interaction, and rich analytics.

## Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, React Router, Framer Motion, Chart.js/Recharts
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (default) – can switch to MongoDB
- **Auth**: JWT, email verification, role‑based access control
- **AI**: OpenAI GPT (default) – can switch to Google Gemini
- **Storage**: Cloudinary for media, YouTube embeds for video
- **Deployment**: Frontend on Vercel, Backend on Render/Railway

## Repository Layout (Monorepo)
```
/ (repo root)
├─ frontend/        # React app
├─ backend/         # Express API
├─ docs/            # Design docs, ER diagram, SQL schema, wireframes
├─ .gitignore
├─ README.md        # (this file)
└─ package.json    # Workspace scripts (optional)
```

## Getting Started
### Prerequisites
- Node.js >= 20
- npm or yarn
- PostgreSQL server (if using SQL) or MongoDB instance
- Cloudinary account (for media uploads)
- OpenAI API key (or Gemini key) saved in `.env`

### Setup
```bash
# Clone the repo (if remote)
git clone <repo-url>
cd eduspark-ai

# Install workspace root deps (optional)
npm install

# Frontend
cd frontend
npm install
npm run dev   # Vite dev server at http://localhost:5173

# Backend
cd ../backend
npm install
npm run dev   # Express dev server at http://localhost:4000
```

### Environment Variables
Create `.env` files in `frontend/` and `backend/` with the required keys:
- `VITE_API_URL` – backend base URL
- `BACKEND_PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `CLOUDINARY_URL`
- `OPENAI_API_KEY` (or `GEMINI_API_KEY`)

## Docs
- **ER Diagram**: `docs/ERD.md`
- **SQL Schema**: `docs/sql_schema.sql`
- **Wireframes**: `docs/wireframes.md`

---
*This repository is ready for Phase 1 implementation.*
