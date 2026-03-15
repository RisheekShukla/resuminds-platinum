import Report from '../models/Report.js'
import { demoReports } from '../services/demoStorage.js'

// Get report for a session
export const getReport = async (req, res) => {
    try {
        // Try MongoDB first
        try {
            const report = await Report.findOne({
                sessionId: req.params.sessionId,
                userId: req.user.userId,
            })

            if (report) {
                return res.json({
                    success: true,
                    data: report,
                })
            }
        } catch (dbError) {
            // MongoDB not available
        }

        // Fall back to in-memory demo storage
        const report = demoReports.get(req.params.sessionId)
        if (report && report.userId === req.user.userId) {
            return res.json({
                success: true,
                data: report,
            })
        }

        res.status(404).json({
            success: false,
            error: 'Report not found',
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}

// Get all reports for user
export const getReportHistory = async (req, res) => {
    try {
        // Try MongoDB first
        try {
            const reports = await Report.find({ userId: req.user.userId })
                .sort({ generatedAt: -1 })
                .populate('sessionId', 'type completedAt')

            if (reports.length > 0) {
                return res.json({
                    success: true,
                    data: reports,
                })
            }
        } catch (dbError) {
            // MongoDB not available
        }

        // Fall back to in-memory demo storage
        const userReports = Array.from(demoReports.values())
            .filter(r => r.userId === req.user.userId)
            .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))

        res.json({
            success: true,
            data: userReports,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}
