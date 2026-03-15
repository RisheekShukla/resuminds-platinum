import InterviewSession from '../models/InterviewSession.js'
import Report from '../models/Report.js'
import { demoSessions, demoReports } from '../services/demoStorage.js'

// Get all interview sessions for the logged-in user with their reports
export const getSessionHistory = async (req, res) => {
    try {
        const userId = req.user.userId
        let sessions = []

        // Try to fetch from MongoDB
        try {
            sessions = await InterviewSession.find({ userId })
                .sort({ startedAt: -1 })
                .lean()

            // Attach reports to sessions
            for (let session of sessions) {
                const report = await Report.findOne({ sessionId: session._id }).lean()
                session.report = report
            }
        } catch (dbError) {
            console.log('MongoDB not available for history, checking demo storage')
        }

        // Merge with demo storage if needed or if empty
        if (sessions.length === 0) {
            demoSessions.forEach((session, id) => {
                if (session.userId === userId) {
                    const report = demoReports.get(id)
                    sessions.push({ ...session, report })
                }
            })
            sessions.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
        }

        // Calculate stats
        const completedSessions = sessions.filter(s => s.report)
        const totalInterviews = completedSessions.length
        const totalScore = completedSessions.reduce((sum, s) => sum + (s.report.overallScore || 0), 0)
        const averageScore = totalInterviews > 0 ? Math.round(totalScore / totalInterviews) : 0

        // Find top category
        const categories = { technical: 0, communication: 0, problemSolving: 0 }
        completedSessions.forEach(s => {
            if (s.report.categoryScores) {
                categories.technical += s.report.categoryScores.technical || 0
                categories.communication += s.report.categoryScores.communication || 0
                categories.problemSolving += s.report.categoryScores.problemSolving || 0
            }
        })

        let topCategory = 'N/A'
        if (totalInterviews > 0) {
            const maxScore = Math.max(categories.technical, categories.communication, categories.problemSolving)
            if (maxScore === categories.technical) topCategory = 'Technical'
            else if (maxScore === categories.communication) topCategory = 'Communication'
            else topCategory = 'System Design'
        }

        res.json({
            success: true,
            data: {
                sessions,
                stats: {
                    totalInterviews,
                    averageScore,
                    topCategory,
                    avgTechnical: totalInterviews > 0 ? Math.round(categories.technical / totalInterviews) : 0,
                    avgCommunication: totalInterviews > 0 ? Math.round(categories.communication / totalInterviews) : 0,
                    avgProblemSolving: totalInterviews > 0 ? Math.round(categories.problemSolving / totalInterviews) : 0
                }
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
}
