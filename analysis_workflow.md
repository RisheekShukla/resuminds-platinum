# Analysis Workflow Documentation

This document explains the multi-layered analysis and scoring logic used in Resuminds.

## 3-Step Analysis Process

The system follows a structured pipeline to transform raw interview responses into a professional performance report.

### 1. 🔍 Deconstruction
*   **Transcript Processing**: The user's voice or text response is cleaned and normalized.
*   **Intent Extraction**: The system identifies key technical terms, methodologies (e.g., STAR), and structural indicators.
*   **Context Mapping**: Your answer is mapped against the specific question and the technical skills listed in your resume.

### 2. 🧠 Multi-Dimensional Evaluation
We analyze every response across four critical dimensions:

| Dimension | Description |
| :--- | :--- |
| **Technical Proficiency** | Depth of knowledge in the specific tech stack mentioned in the question and resume. |
| **Communication Clarity** | Use of structured explanations (Situation, Task, Action, Result) and avoidance of filler words. |
| **Critical Thinking** | Ability to discuss trade-offs, edge cases, and architectural decisions rather than just "what" was done. |
| **Overall Execution** | A weighted summary of how effectively the question was answered as a whole. |

### 3. 📄 Synthesis & Feedback
*   **Score Weighting**: Technical questions weight "Proficiency" higher, while behavioral questions weight "Communication" higher.
*   **Actionable Insights**: The AI identifies specific **Excellence** (Strengths) and **Growth Areas** (Improvements).
*   **Premium Formatting**: Results are visualized using glowing gauges and interactive feedback cards.

## AI vs. Heuristic Logic

If the local AI (Llama 3.2) is busy or unavailable, the system automatically falls back to a **Heuristic Logic Engine** that uses rule-based scoring (word count, technical density, keyword matching) to ensure you always get a result.
