import express from 'express'
import { getSessionHistory } from '../controllers/historyController.js'
import auth from '../middleware/auth.js'

const router = express.Router()

// All history routes are protected
router.use(auth)

router.get('/sessions', getSessionHistory)

export default router
