/**
 * AI Service — with retry logic, better JSON parsing, and robust error handling
 * Now powered by the universal aiProvider (Groq, Ollama, etc.)
 */

import { PERSONAS, DEFAULT_PERSONA } from '../constants/personas.js'
import { ai } from './aiProvider.js'

// ────────────────────────────────────────────────────────────
// Backward Compatibility / Routing
// ────────────────────────────────────────────────────────────

export const checkOllamaHealth = async () => {
    return await ai.checkHealth()
}

// ────────────────────────────────────────────────────────────
// JSON parsing helper — robust extraction from LLM output
// ────────────────────────────────────────────────────────────

const extractJSON = (text) => {
    if (!text) throw new Error('Empty AI response')

    let cleaned = text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim()

    try {
        return JSON.parse(cleaned)
    } catch { /* continue */ }

    const arrayMatch = cleaned.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
        try { return JSON.parse(arrayMatch[0]) } catch { /* continue */ }
    }

    const objectMatch = cleaned.match(/\{[\s\S]*\}/)
    if (objectMatch) {
        try { return JSON.parse(objectMatch[0]) } catch { /* continue */ }
    }

    throw new Error('Could not extract valid JSON from AI response')
}

// ────────────────────────────────────────────────────────────
// Opening Question
// ────────────────────────────────────────────────────────────

export const generateOpeningQuestion = async (resumeData, personaKey = 'tech_lead') => {
    const { skills = [], experience = [], projects = [], name = 'candidate' } = resumeData
    const persona = PERSONAS[personaKey] || DEFAULT_PERSONA

    const prompt = `You are ${persona.name}, a ${persona.role}. ${persona.prompts.system}
Your task is to open the interview. 
The first question MUST be a "Tell me about yourself" style question, but it MUST be personalized to the candidate's resume.

CANDIDATE PROFILE:
- Name: ${name}
- Skills: ${skills.join(', ')}
- Top Experience: ${experience[0]?.role} at ${experience[0]?.company || 'various companies'}
- Key Project: ${projects[0]?.name || 'Not specified'}

GUIDELINES:
1. Warmly welcome the candidate like a friendly colleague, not a formal interviewer.
2. Ask them to introduce themselves, mentioning something specific from their resume that caught your eye.
3. Keep it warm, casual, and human — like a real conversation, not a corporate interrogation.
4. Use short, natural sentences. Avoid robotic phrasing.

OUTPUT FORMAT:
Return a JSON object:
{
  "text": "The opening question text",
  "category": "behavioral",
  "difficulty": "easy"
}`

    try {
        const response = await ai.generate(prompt, { temperature: 0.7, jsonMode: true })
        const parsed = extractJSON(response)
        return {
            text: parsed.text,
            category: 'behavioral',
            difficulty: 'easy'
        }
    } catch (err) {
        console.error('Failed to generate opening question:', err.message)
    }

    // Fallback
    return {
        text: `Welcome! I'm ${persona.name}. To get started, could you tell me a bit about your journey in tech and perhaps elaborate on your experience with ${skills[0] || 'software development'}?`,
        category: 'behavioral',
        difficulty: 'easy'
    }
}

// ────────────────────────────────────────────────────────────
// Generate questions from resume (batch)
// ────────────────────────────────────────────────────────────

export const generateQuestionsFromResume = async (resumeData, type = 'mixed', count = 5, jobDescription = '', personaKey = 'tech_lead') => {
    const { skills = [], experience = [], projects = [], name = 'candidate' } = resumeData
    const persona = PERSONAS[personaKey] || DEFAULT_PERSONA

    const randomnessFactor = Math.random().toString(36).substring(7);
    const prompt = `You are ${persona.name}, a ${persona.role}. ${persona.prompts.system}
Generate ${count} highly UNIQUE, deep, and probing interview questions for a candidate based on their resume ${jobDescription ? 'AND a specific Job Description' : ''}.

CRITICAL: ${persona.prompts.questionGen}
Every question must be DIFFERENT from standard interview banks.

${jobDescription ? `JOB DESCRIPTION (PRIORITY):
${jobDescription}

GOAL: Map the Job Description against the Resume. If the JD requires a skill that is NOT on the resume, ask a probing question to see if they have that knowledge or can adapt. If the skill IS on the resume, ask for a level-3 deep dive into their experience with it in the context of the JD requirements.` : ''}

CANDIDATE PROFILE:
- Name: ${name}
- Skills: ${skills.join(', ') || 'Not specified'}
- Experience: ${experience.map(e => `${e.role} at ${e.company}`).join('; ') || 'Not specified'}
- Projects: ${projects.map(p => p.name).join(', ') || 'Not specified'}

INTERVIEW TYPE: ${type}
SESSION_SALT: ${randomnessFactor}

STRICT GUIDELINES:
1. NO REPETITION: Do not use questions that have been asked in previous sessions. Be creative.
2. PERSONALITY: Ensure the questions reflect the tone of ${persona.name}.
3. VARIETY: Mix specific scenarios with deeper inquiry.
4. PROBING: Each question should feel like a "level 2" or "level 3" followup, not a surface-level inquiry.

OUTPUT FORMAT (JSON array only, no other text):
[
  {"text": "question text", "category": "technical|behavioral", "difficulty": "easy|medium|hard"},
  ...
]

Generate exactly ${count} highly unique questions as a valid JSON array:`

    const response = await ai.generate(prompt, { retries: 3 })

    try {
        const questions = extractJSON(response)
        if (Array.isArray(questions)) {
            return questions.map((q, i) => ({
                questionId: `q-${Date.now()}-${i}`,
                text: q.text,
                category: q.category || 'mixed',
                difficulty: q.difficulty || 'medium',
            }))
        }
    } catch (parseError) {
        console.error('Failed to parse question response:', parseError.message)
    }

    throw new Error('Failed to generate questions from AI')
}

// ────────────────────────────────────────────────────────────
// Score an answer
// ────────────────────────────────────────────────────────────

export const scoreAnswer = async (question, answer, resumeContext = '', personaKey = 'tech_lead') => {
    const persona = PERSONAS[personaKey] || DEFAULT_PERSONA

    const prompt = `You are evaluating an answer as ${persona.name} (${persona.role}). ${persona.prompts.system}
Your goal is to provide a fair and actionable assessment. 

Persona Guidance: ${persona.prompts.scoring}

QUESTION: ${question}
CANDIDATE'S ANSWER: ${answer}
${resumeContext ? `CONTEXT (from resume): ${resumeContext}` : ''}

SCORING GUIDE:
- 0-30: Vague, incorrect, or one-sentence answers.
- 31-60: Generally correct but lacks depth or specific examples.
- 61-85: Good depth, uses examples, clear logic.
- 86-100: Exceptional depth, mentions trade-offs, shows mastery.

OUTPUT FORMAT (JSON only):
{
  "score": 75,
  "metrics": {
    "technicalAccuracy": 80,
    "depthOfKnowledge": 75,
    "resumeAlignment": 85,
    "closenessToJobDescription": 70,
    "communicationEfficiency": 80
  },
  "strengths": ["Clean text strength without markdown"],
  "improvements": ["Clear improvement point without bolding or stars"]
}

IMPORTANT: Do NOT use markdown (**, _, #) inside the JSON string values.
Evaluate (be honest, use the ${persona.name} persona, and return valid JSON):`

    const response = await ai.generate(prompt, { temperature: 0.3, jsonMode: true, retries: 2 })

    try {
        const parsed = extractJSON(response)
        return {
            score: Math.max(0, Math.min(100, parsed.score || 50)),
            metrics: {
                technicalAccuracy: parsed.metrics?.technicalAccuracy || 50,
                depthOfKnowledge: parsed.metrics?.depthOfKnowledge || 50,
                resumeAlignment: parsed.metrics?.resumeAlignment || 50,
                closenessToJobDescription: parsed.metrics?.closenessToJobDescription || 50,
                communicationEfficiency: parsed.metrics?.communicationEfficiency || 50
            },
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Good progress'],
            improvements: Array.isArray(parsed.improvements) ? parsed.improvements : ['Keep going'],
        }
    } catch {
        console.error('Failed to parse scoring response')
    }

    // Fallback
    return {
        score: 50,
        metrics: {
            technicalAccuracy: 50,
            depthOfKnowledge: 50,
            resumeAlignment: 50,
            closenessToJobDescription: 50,
            communicationEfficiency: 50
        },
        strengths: ['Answer provided'],
        improvements: ['Candidate should provide much more detail and specific examples to show expertise.'],
    }
}

// ────────────────────────────────────────────────────────────
// Conversation Question (The Interviewer Brain)
// ────────────────────────────────────────────────────────────

export const generateConversationQuestion = async (resumeData, conversationHistory = [], jobDescription = '', personaKey = 'tech_lead') => {
    const persona = PERSONAS[personaKey] || DEFAULT_PERSONA
    const { skills = [], experience = [], projects = [] } = resumeData

    const historyText = conversationHistory.length > 0
        ? conversationHistory.map(h => `Q: ${h.question}\nA: ${h.answer}`).join('\n\n')
        : 'Starting the interview.'

    const prompt = `You are ${persona.name}, a ${persona.role}. ${persona.prompts.system}
You are having a friendly, professional interview conversation. Think of it as a relaxed but insightful chat with a candidate.

RESUME CONTEXT:
- Skills: ${skills.join(', ')}
- Projects: ${projects.map(p => p.name).join(', ')}
- Experience: ${experience.map(e => `${e.role} at ${e.company}`).join('; ')}

${jobDescription ? `JOB DESCRIPTION (PRIORITY):
${jobDescription}` : ''}

CONVERSATION SO FAR:
${historyText}

HOW TO ASK THE NEXT QUESTION:
1. REACT to the candidate's last answer first — acknowledge what they said briefly (e.g., "Oh nice, that's cool" or "That makes sense").
2. Then naturally transition into the next question based on what they just said OR pivot to a new topic from their resume.
3. Keep the tone friendly and human, like you're genuinely curious — NOT like a robotic interviewer.
4. Use short, natural sentences. Keep the question under 2 sentences max.
5. NO REPETITION: Don't re-ask anything from the history.
6. CONTEXT AWARENESS: If they said they're a backend dev, ask about backend stuff — don't suddenly ask about frontend.

OUTPUT FORMAT:
Return a JSON object:
{
  "text": "The next question text (including transition)",
  "category": "technical|behavioral",
  "difficulty": "medium|hard",
  "reasoning": "Brief explanation of why you chose this question"
}`

    try {
        const response = await ai.generate(prompt, { temperature: 0.8, jsonMode: true, retries: 2 })
        const parsed = extractJSON(response)
        return {
            text: parsed.text,
            category: parsed.category || 'technical',
            difficulty: parsed.difficulty || 'hard'
        }
    } catch (parseError) {
        console.error('Failed to parse AI Brain response:', parseError.message)
    }

    // Fallback
    return {
        text: `Based on your experience with ${skills[0] || 'engineering'}, how do you handle architectural trade-offs in high-pressure environments?`,
        category: 'technical',
        difficulty: 'hard'
    }
}
