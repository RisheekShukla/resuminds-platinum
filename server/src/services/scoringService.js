import { scoreAnswer as scoreWithAI } from './aiService.js'

/**
 * Score an interview answer
 * Uses AI when available, falls back to rule-based scoring
 */
export const scoreAnswer = async (question, answer, resumeContext = {}, personaKey = 'tech_lead') => {
    // Check if answer is empty or too short
    if (!answer || answer.trim().length < 10) {
        return {
            score: 0,
            strengths: [],
            improvements: [
                'No answer provided',
                'Please provide a detailed response to demonstrate your knowledge',
            ],
        }
    }

    // Try AI scoring first
    try {
        const contextStr = typeof resumeContext === 'string' ? resumeContext : JSON.stringify(resumeContext)
        const aiResponse = await scoreWithAI(question.text || question, answer, contextStr, personaKey)

        return {
            score: aiResponse.score || 0,
            metrics: aiResponse.metrics || {
                technicalAccuracy: 0,
                depthOfKnowledge: 0,
                resumeAlignment: 0,
                closenessToJobDescription: 0,
                communicationEfficiency: 0
            },
            strengths: aiResponse.strengths || [],
            improvements: aiResponse.improvements || []
        }
    } catch (error) {
        console.log('AI scoring unavailable, using rule-based scoring')
    }

    // Fallback: Rule-based scoring
    const ruleBased = ruleBasedScoring(question, answer, resumeContext)
    return {
        ...ruleBased,
        metrics: {
            technicalAccuracy: ruleBased.score,
            depthOfKnowledge: ruleBased.score,
            resumeAlignment: ruleBased.score,
            closenessToJobDescription: ruleBased.score,
            communicationEfficiency: ruleBased.score
        }
    }
}

/**
 * Rule-based scoring when AI is unavailable
 */
const ruleBasedScoring = (question, answer, resumeContext) => {
    const answerLower = answer.toLowerCase()
    const questionLower = question.text.toLowerCase()

    let score = 40 // Base score for attempting
    const strengths = []
    const improvements = []

    // 1. Length analysis (Real interviews need depth)
    const wordCount = answer.split(/\s+/).length
    if (wordCount < 15) {
        improvements.push('Answer is extremely short - provide more context and detail.')
        score -= 25
    } else if (wordCount < 40) {
        improvements.push('Answer is somewhat brief - aim for at least 3-4 sentences with examples.')
        score -= 10
    } else if (wordCount > 100) {
        strengths.push('Provided a comprehensive and detailed response.')
        score += 15
    }

    // 2. Structural indicators
    const starIndicators = ['situation', 'task', 'action', 'result', 'resolved', 'achieved', 'because', 'example']
    const hasStructure = starIndicators.filter(word => answer.toLowerCase().includes(word)).length >= 3
    if (hasStructure) {
        strengths.push('Good logical structure in response.')
        score += 10
    }
    else {
        improvements.push('Add specific examples from your experience')
    }

    // Check for technical terms (if technical question)
    if (question.category === 'technical') {
        const techTerms = resumeContext.skills || []
        const mentionedSkills = techTerms.filter(skill =>
            answerLower.includes(skill.toLowerCase())
        )

        if (mentionedSkills.length > 0) {
            strengths.push(`Referenced relevant skills: ${mentionedSkills.slice(0, 2).join(', ')}`)
            score += 10
        } else {
            improvements.push('Connect your answer to your technical skills')
        }
    }

    // Check for STAR method (behavioral questions)
    if (question.category === 'behavioral') {
        const hasSituation = answerLower.match(/situation|context|when|at the time/i)
        const hasTask = answerLower.match(/task|challenge|problem|needed to/i)
        const hasAction = answerLower.match(/i did|i implemented|i worked|i created/i)
        const hasResult = answerLower.match(/result|outcome|achieved|improved|increased/i)

        const starComponents = [hasSituation, hasTask, hasAction, hasResult].filter(Boolean).length

        if (starComponents >= 3) {
            strengths.push('Followed STAR method (Situation, Task, Action, Result)')
            score += 15
        } else if (starComponents >= 2) {
            strengths.push('Provided structured response')
            score += 5
            improvements.push('Try using STAR method: Situation, Task, Action, Result')
        } else {
            improvements.push('Use STAR method to structure behavioral answers')
        }
    }

    // Check for clarity
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim())
    if (sentences.length >= 3) {
        strengths.push('Clear and well-structured')
        score += 5
    }

    // Check for filler words (negative indicator)
    const fillerCount = (answer.match(/\b(um|uh|like|you know|basically|actually)\b/gi) || []).length
    if (fillerCount > 3) {
        improvements.push('Reduce filler words for more confident delivery')
        score -= 5
    }

    // Ensure score is in valid range
    score = Math.max(0, Math.min(100, score))

    // Ensure we have at least one strength and improvement
    if (strengths.length === 0) {
        strengths.push('Attempted the question')
    }
    if (improvements.length === 0) {
        improvements.push('Continue practicing to improve confidence')
    }

    return {
        score,
        strengths: strengths.slice(0, 3),
        improvements: improvements.slice(0, 3),
    }
}

/**
 * Generate overall report from interview session
 */
export const generateReport = async (session, resumeData = {}) => {
    const { questions, answers } = session

    if (!answers || answers.length === 0) {
        return {
            overallScore: 0,
            categoryScores: {
                technical: 0,
                communication: 0,
                problemSolving: 0,
            },
            feedback: [],
            summary: 'No answers provided. Please complete the interview to receive feedback.',
        }
    }

    // Score each question — sequentially in batches of 2
    // (Ollama can't handle 6 parallel AI calls)
    const scoredAnswers = []
    for (let i = 0; i < questions.length; i += 2) {
        const batch = questions.slice(i, i + 2)
        const batchResults = await Promise.all(
            batch.map(async (question) => {
                const answer = answers.find(a => a.questionId === question.questionId)

                if (!answer || !answer.userAnswer || answer.userAnswer.trim().length < 5) {
                    return {
                        questionId: question.questionId,
                        questionText: question.text,
                        category: question.category,
                        score: 0,
                        metrics: {
                            technicalAccuracy: 0,
                            depthOfKnowledge: 0,
                            resumeAlignment: 0,
                            closenessToJobDescription: 0,
                            communicationEfficiency: 0
                        },
                        strengths: [],
                        improvements: ['Question was skipped or answered very briefly. Provide more detail next time.'],
                    }
                }

                try {
                    const scoring = await scoreAnswer(question, answer.userAnswer, resumeData, session.persona || 'tech_lead')
                    return {
                        questionId: question.questionId,
                        questionText: question.text,
                        category: question.category,
                        score: scoring.score,
                        metrics: scoring.metrics,
                        strengths: scoring.strengths,
                        improvements: scoring.improvements,
                    }
                } catch (error) {
                    console.error(`Error scoring answer for ${question.questionId}:`, error.message)
                    const fallback = ruleBasedScoring(question, answer.userAnswer, resumeData)
                    return {
                        questionId: question.questionId,
                        questionText: question.text,
                        category: question.category,
                        score: fallback.score,
                        metrics: {
                            technicalAccuracy: fallback.score,
                            depthOfKnowledge: fallback.score,
                            resumeAlignment: fallback.score,
                            closenessToJobDescription: fallback.score,
                            communicationEfficiency: fallback.score
                        },
                        strengths: fallback.strengths,
                        improvements: fallback.improvements,
                    }
                }
            })
        )
        scoredAnswers.push(...batchResults.filter(Boolean))
    }

    // Calculate category averages
    const scoredCount = scoredAnswers.length || 1
    
    const aggregateMetrics = {
        technicalAccuracy: Math.round(scoredAnswers.reduce((sum, a) => sum + (a.metrics?.technicalAccuracy || 0), 0) / scoredCount),
        depthOfKnowledge: Math.round(scoredAnswers.reduce((sum, a) => sum + (a.metrics?.depthOfKnowledge || 0), 0) / scoredCount),
        resumeAlignment: Math.round(scoredAnswers.reduce((sum, a) => sum + (a.metrics?.resumeAlignment || 0), 0) / scoredCount),
        closenessToJobDescription: Math.round(scoredAnswers.reduce((sum, a) => sum + (a.metrics?.closenessToJobDescription || 0), 0) / scoredCount),
        communicationEfficiency: Math.round(scoredAnswers.reduce((sum, a) => sum + (a.metrics?.communicationEfficiency || 0), 0) / scoredCount)
    }

    const overallScore = Math.round(scoredAnswers.reduce((sum, a) => sum + (a.score || 0), 0) / scoredCount)

    // Generate summary
    const summary = generateSummary(overallScore, scoredAnswers, session)

    return {
        overallScore,
        metrics: aggregateMetrics,
        feedback: scoredAnswers.map(a => ({
            questionId: a.questionId,
            question: a.questionText,
            score: a.score,
            metrics: a.metrics,
            strengths: a.strengths,
            improvements: a.improvements,
        })),
        summary,
        persona: session.persona || 'tech_lead',
    }
}

/**
 * Generate summary text based on performance
 */
const generateSummary = (overallScore, scoredAnswers, session) => {
    const answeredCount = session.answers.length
    const totalQuestions = session.questions.length
    const completionRate = Math.round((answeredCount / totalQuestions) * 100)

    let summary = ''

    // Overall performance
    if (overallScore >= 80) {
        summary = 'Excellent performance! You demonstrated strong knowledge and communication skills. '
    } else if (overallScore >= 60) {
        summary = 'Good performance overall. You showed solid understanding with room for improvement. '
    } else if (overallScore >= 40) {
        summary = 'Fair performance. Focus on providing more detailed answers with specific examples. '
    } else if (overallScore > 0) {
        summary = 'Needs improvement. Practice answering questions with more depth and structure. '
    } else {
        summary = 'No answers were provided. Please complete the interview to receive meaningful feedback. '
    }

    // Completion rate
    if (completionRate < 100) {
        summary += `You completed ${completionRate}% of the questions. `
    }

    // Specific feedback
    const emptyAnswers = scoredAnswers.filter(a => a.score === 0).length
    if (emptyAnswers > 0) {
        summary += `${emptyAnswers} question(s) were left unanswered or had insufficient responses. `
    }

    const strongAnswers = scoredAnswers.filter(a => a.score >= 80).length
    if (strongAnswers > 0) {
        summary += `You provided ${strongAnswers} strong answer(s). `
    }

    // Recommendations
    if (overallScore < 60) {
        summary += 'Focus on using the STAR method for behavioral questions and providing specific technical examples. '
    }

    return summary.trim()
}
