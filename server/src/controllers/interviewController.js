import InterviewSession from '../models/InterviewSession.js'
import { generateQuestions } from '../services/questionGen.js'
import { demoSessions, demoReports } from '../services/demoStorage.js'

// Start new interview session
export const startInterview = async (req, res) => {
    try {
        const { resumeId, type = 'mixed', jobDescription = '', persona = 'tech_lead' } = req.body

        // OPENING QUESTION (PHASE 6) - Personalize using AI
        const { generateOpeningQuestion } = await import('../services/aiService.js')
        
        // Fetch resume data if available
        let resumeData = {}
        if (resumeId) {
            try {
                const Resume = (await import('../models/Resume.js')).default
                const resume = await Resume.findById(resumeId)
                if (resume) resumeData = resume.parsedData || {}
            } catch (err) {
                console.log('Resume Fetch failed, using empty data for opening')
            }
        }

        console.log('🤖 Generating personalized opening question...')
        const aiOpening = await generateOpeningQuestion(resumeData, persona)

        const openingQuestion = {
            questionId: `q-opening-${Date.now()}`,
            text: aiOpening.text,
            category: 'behavioral',
            difficulty: 'easy'
        }

        const sessionData = {
            _id: `session-${Date.now()}`,
            userId: req.user.userId,
            resumeId,
            type,
            persona,
            status: 'in-progress',
            questions: [openingQuestion],
            answers: [],
            startedAt: new Date(),
        }

        // Try to save to MongoDB, fall back to in-memory
        try {
            const session = await InterviewSession.create(sessionData)
            console.log(`✅ Created interview session: ${session._id}`)

            res.status(201).json({
                success: true,
                data: session,
            })
        } catch (dbError) {
            // MongoDB not available - use in-memory storage
            console.log('📝 Using in-memory session storage (demo mode)')
            demoSessions.set(sessionData._id, sessionData)

            res.status(201).json({
                success: true,
                data: sessionData,
            })
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}

// Get session details
export const getSession = async (req, res) => {
    try {
        // Try MongoDB first
        try {
            const session = await InterviewSession.findOne({
                _id: req.params.id,
                userId: req.user.userId,
            })

            if (session) {
                return res.json({
                    success: true,
                    data: session,
                })
            }
        } catch (dbError) {
            // MongoDB not available
        }

        // Fall back to in-memory
        const session = demoSessions.get(req.params.id)
        if (session && session.userId === req.user.userId) {
            return res.json({
                success: true,
                data: session,
            })
        }

        res.status(404).json({
            success: false,
            error: 'Session not found',
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}

// Submit answer
export const submitAnswer = async (req, res) => {
    try {
        const { questionId, userAnswer, timeSpent } = req.body

        // FIND SESSION
        let session = null;
        try {
            session = await InterviewSession.findOne({ _id: req.params.id, userId: req.user.userId }).populate('resumeId');
        } catch (err) { }

        if (!session) {
            session = demoSessions.get(req.params.id);
        }

        if (!session) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }

        // SAVE THE ANSWER
        const answerData = {
            questionId,
            userAnswer,
            timeSpent,
            timestamp: new Date(),
        };

        session.answers.push(answerData);

        // GENERATE NEXT QUESTION (PHASE 6)
        // A session should target ~5-8 questions. Let's say 6.
        if (session.answers.length < 6) {
            const { generateConversationQuestion } = await import('../services/aiService.js');

            // Get resume context
            let resumeData = {};
            if (session.resumeId) {
                resumeData = session.resumeId.parsedData || {};
            }

            // Prepare history
            const conversationHistory = session.answers.map(ans => {
                const q = session.questions.find(q => q.questionId === ans.questionId);
                return {
                    question: q?.text || 'Unknown',
                    answer: ans.userAnswer
                };
            });

            console.log(`🧠 Generating dynamic question for answer #${session.answers.length}...`);
            const nextQ = await generateConversationQuestion(
                resumeData,
                conversationHistory,
                session.jobDescription || '',
                session.persona || 'tech_lead'
            );

            const nextQuestionData = {
                questionId: `q-dynamic-${Date.now()}`,
                ...nextQ
            };

            session.questions.push(nextQuestionData);
        }

        // PERSIST SESSION
        if (demoSessions.has(req.params.id)) {
            demoSessions.set(req.params.id, session);
        } else {
            await session.save();
        }

        res.json({
            success: true,
            data: session,
        });

    } catch (error) {
        console.error('Submit answer error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}

// Generate follow-up question (The Probe) [PHASE 2]
export const askFollowUp = async (req, res) => {
    try {
        const { questionText, userAnswer } = req.body
        const sessionId = req.params.id

        // Fetch session first to get persona
        let session = null;
        try {
            session = await InterviewSession.findOne({ _id: sessionId, userId: req.user.userId });
        } catch (dbError) { }

        if (!session) {
            session = demoSessions.get(sessionId);
        }

        const persona = session?.persona || 'tech_lead';

        // Prepare conversation history for more context-aware probing
        const conversationHistory = (session?.answers || []).map(ans => {
            const q = session.questions.find(q => q.questionId === ans.questionId);
            return {
                question: q?.text || 'Unknown question',
                answer: ans.userAnswer
            };
        });

        // Generate follow-up using the new dynamic brain [PHASE 6]
        const { generateConversationQuestion } = await import('../services/aiService.js');
        const nextQ = await generateConversationQuestion(
            {}, // No resume context passed here for simplicity, or we could fetch it
            conversationHistory,
            session?.jobDescription || '',
            persona
        );
        const followUpText = nextQ.text;

        const followUpQuestionData = {
            questionId: `followup-${Date.now()}`,
            text: followUpText,
            category: 'technical',
            difficulty: 'hard'
        }

        // Try to save to MongoDB
        try {
            const session = await InterviewSession.findOneAndUpdate(
                { _id: sessionId, userId: req.user.userId },
                {
                    $push: { questions: followUpQuestionData }
                },
                { new: true }
            )

            if (session) {
                return res.json({
                    success: true,
                    data: { followUp: followUpText, questionId: followUpQuestionData.questionId }
                })
            }
        } catch (dbError) {
            // Fallback to demo
        }

        // Demo fallback
        session = demoSessions.get(sessionId)
        if (session && session.userId === req.user.userId) {
            session.questions.push(followUpQuestionData)
            demoSessions.set(sessionId, session)
        }

        res.json({
            success: true,
            data: { followUp: followUpText, questionId: followUpQuestionData.questionId }
        })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
}

// Complete interview
export const completeInterview = async (req, res) => {
    try {
        let session = null
        let isDemo = false

        // Try MongoDB first
        try {
            session = await InterviewSession.findOneAndUpdate(
                { _id: req.params.id, userId: req.user.userId },
                {
                    status: 'completed',
                    completedAt: new Date(),
                },
                { new: true }
            ).populate('resumeId')
        } catch (dbError) {
            // MongoDB not available
        }

        // Fall back to in-memory
        if (!session) {
            session = demoSessions.get(req.params.id)
            if (session && session.userId === req.user.userId) {
                session.status = 'completed'
                session.completedAt = new Date()
                demoSessions.set(req.params.id, session)
                isDemo = true
            }
        }

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found',
            })
        }

        // Generate report with real scoring
        const { generateReport } = await import('../services/scoringService.js')

        const resumeData = session.resumeId?.parsedData || {}
        const reportData = await generateReport(session, resumeData)

        const reportDoc = {
            _id: `report-${Date.now()}`,
            sessionId: session._id,
            userId: req.user.userId,
            ...reportData,
            generatedAt: new Date(),
        }

        // Try to save report to MongoDB
        if (!isDemo) {
            try {
                const Report = (await import('../models/Report.js')).default
                const report = await Report.create(reportDoc)

                console.log(`📊 Generated report for session ${session._id}:`, {
                    overallScore: reportData.overallScore,
                    answersScored: reportData.feedback.length,
                })

                return res.json({
                    success: true,
                    data: {
                        session,
                        report,
                    },
                })
            } catch (dbError) {
                console.error('Failed to save report to MongoDB:', dbError)
                // Fall through to demo mode
            }
        }

        // Demo mode: store in memory
        console.log(`📊 Generated demo report for session ${session._id}:`, {
            overallScore: reportData.overallScore,
            answersScored: reportData.feedback.length,
        })

        demoReports.set(session._id, reportDoc)

        res.json({
            success: true,
            data: {
                session,
                report: reportDoc,
            },
        })
    } catch (error) {
        console.error('Complete interview error:', error)
        res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}

// Export demo storage for use in report controller
export { demoSessions, demoReports }
