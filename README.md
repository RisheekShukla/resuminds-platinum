# Resuminds - AI Interview Simulator 🎯

An AI-powered mock interview platform that parses your resume and conducts personalized interview practice sessions.

## Features

- 📄 **Resume Parsing** - Upload PDF/text resume for skill extraction
- 🤖 **AI Question Generation** - Tailored questions based on your experience
- 🎤 **Voice Input** - Answer using speech (browser APIs)
- 📊 **Scoring & Feedback** - Get detailed performance analysis
- ⏱️ **Timed Sessions** - Practice under realistic conditions

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | MongoDB |
| AI | Ollama (local LLM) |
| Auth | JWT |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Ollama installed (for AI features)

### Installation

```bash
# Clone the repo
git clone <your-repo-url>
cd resuminds

# Install all dependencies
npm run install:all

# Copy environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
```

### Development

```bash
# Run both client and server
npm run dev

# Or run separately
npm run dev:client  # React on http://localhost:5173
npm run dev:server  # Express on http://localhost:5000
```

### Ollama Setup (for AI)

```bash
# Install Ollama (macOS)
brew install ollama

# Pull a model
ollama pull llama3.2

# Start Ollama server
ollama serve
```

## Project Structure

```
resuminds/
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types
└── package.json     # Root scripts
```

## API Endpoints

See [API Documentation](./docs/api.md) (coming soon)

## License

MIT
