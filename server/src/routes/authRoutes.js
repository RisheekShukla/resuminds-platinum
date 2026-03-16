import { Router } from 'express'
import { register, login, getMe, forgotPassword, resetPassword, socialAuthSuccess } from '../controllers/authController.js'
import auth from '../middleware/auth.js'
import passport from '../config/passport.js'

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

// ─── Social Auth Routes ───

// Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
router.get('/google/callback', 
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    socialAuthSuccess
)

// GitHub
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }))
router.get('/github/callback', 
    passport.authenticate('github', { session: false, failureRedirect: '/login' }),
    socialAuthSuccess
)

export default router
