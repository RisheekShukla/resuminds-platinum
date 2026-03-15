# Resuminds - AI Interview Simulator

## ✅ Project Setup Complete

**Tech Stack:**
- Frontend: React + Vite
- Backend: Node.js + Express  
- Database: MongoDB
- AI: Ollama (to integrate)
- Auth: JWT

**Dev Servers:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## 📁 Project Structure

```
resuminds/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── pages/          # HomePage, UploadPage, InterviewPage, ReportPage
│   │   ├── services/       # API client
│   │   └── styles/         # Dark theme CSS
│   └── package.json
│
├── server/                 # Express Backend
│   ├── src/
│   │   ├── controllers/    # Auth, Resume, Interview, Report
│   │   ├── models/         # User, Resume, InterviewSession, Report
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Resume parser, Question generator
│   │   └── middleware/     # JWT auth, file upload
│   └── package.json
│
├── .env                    # Environment variables
└── package.json            # Root scripts
```

---

## 🚀 Commands

```bash
# Run both servers
npm run dev

# Run separately
npm run dev:client   # Frontend only
npm run dev:server   # Backend only
```

---

## 📋 Next Steps

1. [ ] Configure MongoDB Atlas in `.env`
2. [ ] Install Ollama and integrate AI
3. [ ] Implement real resume parsing
4. [ ] Add voice input (Web Speech API)
5. [ ] Deploy (Vercel + Render)
