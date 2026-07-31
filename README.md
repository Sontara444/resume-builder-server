# ResumeCraft Backend API

This is the Node.js / Express backend API for the ResumeCraft application.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB

## Environment Variables

Create a `.env` file in the root of the `server` directory with the following variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_google_gemini_api_key (Optional: Required for AI features)
```

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
   The server will run with `nodemon` for auto-reloading on port `5000` by default.

3. Start for production:
   ```bash
   npm start
   ```

## API Routes Overview

- `/api/auth` - User registration, login, and authentication (JWT-based).
- `/api/resumes` - CRUD operations for resumes (create, read, update, delete, duplicate, version history).
- `/api/ai` - AI features including resume review, keyword extraction, and cover letter generation.
- `/api/contact` - Endpoint for the contact form submission.

## Tech Stack

- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT (JSON Web Tokens) & bcryptjs for password hashing
- **AI Integration**: Google Generative AI (Gemini 1.5 Flash)

## License
ISC
