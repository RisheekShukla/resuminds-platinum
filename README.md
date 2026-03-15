# ✨ ResuMinds: AI-Powered Interview Simulator

![ResuMinds Banner](https://img.shields.io/badge/ResuMinds-Platinum_Edition-blueviolet?style=for-the-badge&logo=openai)
![Status](https://img.shields.io/badge/Status-Production_Ready-success?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Tech-MERN_Stack_+_AI-blue?style=for-the-badge&logo=mongodb)

> **ResuMinds** is a next-generation interview preparation suite that uses advanced AI to simulate real-world technical and behavioral interviews. From parsing resumes to providing real-time speech-to-text feedback, ResuMinds ensures candidates are "Platinum-Ready" for their dream jobs.

---

## 🚀 Key Features

-   **🧠 Intelligent Persona Engine**: Choose between various interviewer personas (Tech Lead, HR Director, Mentor) that adapt their questioning style and difficulty.
-   **📄 Resume-to-Question Mapping**: Automatically parses uploaded resumes to generate targeted, context-aware interview questions.
-   **🎙️ Real-Time Audio Interaction**: Seamless speech synthesis and voice recognition for a true "Google Meet" style experience.
-   **📊 Deep Analytics Report**: Comprehensive performance analysis covering Technical Accuracy, Communication, and Depth of Knowledge with actionable feedback.
-   **💎 Platinum UI/UX**: A modern, glassmorphic design built for professional visual impact.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, CSS3 (Custom Design System), Web Speech API |
| **Backend** | Node.js, Express, MongoDB Atlas, JWT Authentication |
| **AI/LLM** | Groq Cloud (Llama 3.3), Ollama (Local Development) |
| **Infrastructure** | Vercel (Frontend), Render (Backend), GitHub Actions |

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas Account
- Groq Cloud API Key (for production performance)

### Installation
1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/resuminds-ai.git
    cd resuminds-ai
    ```

2.  **Install Dependencies**
    ```bash
    npm run install-all
    ```

3.  **Environment Setup**
    - Create `server/.env` based on `server/.env.example`
    - Create `client/.env` based on `client/.env.example`

4.  **Run Development Mode**
    ```bash
    npm run dev
    ```

---

## 🌩️ Deployment

The project is architected for zero-cost deployment:
- **Frontend**: Deploy to [Vercel](https://vercel.com)
- **Backend API**: Deploy to [Render](https://render.com)
- **Database**: [MongoDB Atlas Free Tier](https://www.mongodb.com/cloud/atlas)

See the [Deployment Guide](./docs/deployment.md) for detailed production steps.
- **Handover Manual**: [View here](./docs/handover.md)
- **Branding Guide**: [View here](./docs/branding.md)

---

## 💼 Presentation & Impact

ResuMinds was developed with a focus on **System Design** and **User Experience**. Key technical hurdles overcome include:
- Implementing an **AI Provider Abstraction** layer for seamless LLM provider switching.
- Building a custom **Scoring Engine** for multi-dimensional qualitative analysis.
- Optimizing **WebRTC-style UI** for high-engagement simulations.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

---

<p align="center">Made with ❤️ for the Developer Community by <b>Risheek Shukla</b></p>
