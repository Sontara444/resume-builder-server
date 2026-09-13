# ResumeCraft Backend API

Node.js / Express backend API for the ResumeCraft application.

## Key Features
- **Auth**: JWT-based user authentication.
- **Resumes**: CRUD, duplication, and version history for resumes.
- **AI**: Gemini-powered resume review, keyword extraction, and cover letter generation.
- **File Processing**: Extract text from uploaded resumes (PDF parsing).

## Tech Stack
- Node.js, Express
- MongoDB (Mongoose)
- Google Generative AI (Gemini 1.5 Flash)
- JWT & bcryptjs

## Quick Start
1. `npm install`
2. `npm run dev` (Runs with nodemon on port `5000`)

## Environment
Create a `.env` file in the `server` root:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_google_gemini_api_key
```
