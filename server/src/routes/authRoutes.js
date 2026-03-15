import { Router } from 'express'
import { register, login, getMe, forgotPassword, resetPassword } from '../controllers/authController.js'
import auth from '../middleware/auth.js'

const router = Router()

// POST /api/auth/register
router.post('/register', register)

// POST /api/auth/login
router.post('/login', login)

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword)

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', resetPassword)

// GET /api/auth/me
router.get('/me', auth, getMe)

export default router
