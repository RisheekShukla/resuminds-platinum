import { Router } from 'express'
import { register, login, getMe } from '../controllers/authController.js'
import auth from '../middleware/auth.js'

const router = Router()

// POST /api/auth/register
router.post('/register', register)

// POST /api/auth/login
router.post('/login', login)

// GET /api/auth/me
router.get('/me', auth, getMe)

export default router
