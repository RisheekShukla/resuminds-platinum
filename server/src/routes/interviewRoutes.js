import { Router } from 'express'
import {
    startInterview,
    getSession,
    submitAnswer,
    completeInterview,
    askFollowUp
} from '../controllers/interviewController.js'
import auth from '../middleware/auth.js'

const router = Router()

// POST /api/interview/start
router.post('/start', auth, startInterview)

// GET /api/interview/:id
router.get('/:id', auth, getSession)

// POST /api/interview/:id/answer
router.post('/:id/answer', auth, submitAnswer)

// POST /api/interview/:id/follow-up
router.post('/:id/follow-up', auth, askFollowUp)

// POST /api/interview/:id/complete
router.post('/:id/complete', auth, completeInterview)

export default router
