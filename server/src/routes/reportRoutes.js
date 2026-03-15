import { Router } from 'express'
import { getReport, getReportHistory } from '../controllers/reportController.js'
import auth from '../middleware/auth.js'

const router = Router()

// GET /api/report/:sessionId
router.get('/:sessionId', auth, getReport)

// GET /api/report/history
router.get('/history', auth, getReportHistory)

export default router
