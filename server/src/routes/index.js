import { Router } from 'express'
import authRoutes from './authRoutes.js'
import resumeRoutes from './resumeRoutes.js'
import interviewRoutes from './interviewRoutes.js'
import reportRoutes from './reportRoutes.js'
import historyRoutes from './historyRoutes.js'

const router = Router()

// API info
router.get('/', (req, res) => {
    res.json({
        name: 'Resuminds API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            resume: '/api/resume',
            interview: '/api/interview',
            report: '/api/report',
            history: '/api/history',
        },
    })
})

// Mount routes
router.use('/auth', authRoutes)
router.use('/resume', resumeRoutes)
router.use('/interview', interviewRoutes)
router.use('/report', reportRoutes)
router.use('/history', historyRoutes)

export default router
