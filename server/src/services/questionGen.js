import Resume from '../models/Resume.js'
import { generateQuestionsFromResume, checkOllamaHealth } from './aiService.js'
import { demoResumes } from './demoStorage.js'

/**
 * Generate interview questions
 * Uses AI when available, falls back to smart template-based generation
 */
export const generateQuestions = async (resumeId, type = 'mixed', count = 5, jobDescription = '') => {
    let resumeData = null

    // Try to get resume data
    if (resumeId) {
        try {
            const resume = await Resume.findById(resumeId)
            if (resume?.parsedData) {
                resumeData = resume.parsedData
            } else {
                // Check demo storage
                const demoResume = demoResumes.get(resumeId)
                if (demoResume) {
                    resumeData = demoResume.parsedData
                }
            }
        } catch (error) {
            console.log('Could not fetch resume from DB, checking demo storage...')
            const demoResume = demoResumes.get(resumeId)
            if (demoResume) {
                resumeData = demoResume.parsedData
            }
        }
    }

    // Check if Ollama is available
    const ollamaAvailable = await checkOllamaHealth()

    if (ollamaAvailable && resumeData) {
        try {
            console.log('🤖 Generating AI-powered questions from resume...')
            const questions = await generateQuestionsFromResume(resumeData, type, count, jobDescription)
            console.log(`✅ Generated ${questions.length} personalized questions`)
            return questions
        } catch (error) {
            console.error('AI generation failed, using fallback:', error.message)
        }
    }

    // Fallback: Generate questions based on resume data (template-based)
    console.log('📝 Using template-based question generation')
    return generateTemplateQuestions(resumeData, type, count, jobDescription)
}

/**
 * Template-based question generation when AI is unavailable
 * Still uses resume data to personalize questions
 */
const generateTemplateQuestions = (resumeData, type, count, jobDescription = '') => {
    const skills = resumeData?.skills || ['Software Engineering', 'System Design', 'General Programming']
    const projects = resumeData?.projects || []
    const experience = resumeData?.experience || []

    const randomSkill = () => skills[Math.floor(Math.random() * skills.length)]

    // Extract keywords from JD to spice up templates [PHASE 2]
    const jdKeywords = jobDescription
        ? jobDescription.match(/\b(React|Node|Python|AWS|Docker|Kubernetes|TypeScript|Tailwind|Java|C\+\+)\b/gi) || []
        : []
    const priorityTech = jdKeywords.length > 0 ? jdKeywords[0] : randomSkill()

    const mainProject = projects[0]?.name || 'your primary engineering project'

    // High-quality modern behavioral bank
    const behavioralPool = [
        "Tell me about a time you had to make a technical trade-off. What did you sacrifice and why?",
        "Describe a situation where you had to work with a legacy codebase. How did you maintain quality while delivering features?",
        "How do you handle a situation where you disagree with a Senior Architect's decision?",
        "Tell me about a time you took ownership of a project that was failing. What was your first move?",
        "Walk me through your process for performing a architectural review for a mission-critical feature."
    ]

    // High-quality modern technical bank (simulating FAANG depth)
    const technicalPool = [
        `Walk me through the internal architecture of a system you built using ${priorityTech}. How did it handle scale?`,
        `If you had to redesign "${mainProject}" to handle 100x the current traffic/data, which bottlenecks would you hit first?`,
        `Describe a specific memory leak, race condition, or performance bottleneck you encountered with ${priorityTech} and how you profiled it.`,
        `Explain the trade-offs between a monolithic and microservices approach for a project like "${mainProject}".`,
        `In ${priorityTech}, how do you handle concurrency or shared state in a high-throughput environment?`,
        `If we were to implement a real-time caching layer for your project, would you choose Redis or a memory-stored solution? Defend your choice.`,
        `How do you ensure data consistency across multiple services or databases in your project "${mainProject}"?`
    ]

    // Experience deep-dives
    const experienceLevelPool = experience.map(exp =>
        `At ${exp.company}, you functioned as a ${exp.role}. What was the most technically complex feature you shipped there from scratch?`
    )

    // Merge and pick
    let selectionPool = []
    if (type === 'technical') {
        selectionPool = [...technicalPool, ...experienceLevelPool]
    } else if (type === 'behavioral') {
        selectionPool = behavioralPool
    } else {
        selectionPool = [...technicalPool, ...behavioralPool, ...experienceLevelPool]
    }

    // Shuffle and pick unique
    const shuffled = selectionPool.sort(() => Math.random() - 0.5)
    const uniqueSelected = Array.from(new Set(shuffled)).slice(0, count)

    // Ensure we have enough
    while (uniqueSelected.length < count) {
        uniqueSelected.push(behavioralPool[Math.floor(Math.random() * behavioralPool.length)])
    }

    return uniqueSelected.map((text, i) => ({
        questionId: `q-${Date.now()}-${i}`,
        text: text,
        category: type === 'mixed' ? (i % 2 === 0 ? 'technical' : 'behavioral') : type,
        difficulty: i < 2 ? 'medium' : 'hard',
    }))
}
