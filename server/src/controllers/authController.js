import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../models/User.js'

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: '7d' }
    )
}

// Register new user
export const register = async (req, res) => {
    try {
        const { email, password, name } = req.body

        // Robust Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ success: false, error: 'Please provide a valid email address' })
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' })
        }
        if (!name || name.trim().length < 2) {
            return res.status(400).json({ success: false, error: 'Please provide a valid name' })
        }

        // Check if user exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Email already registered',
            })
        }

        // Create user
        const user = await User.create({ email, password, name })
        const token = generateToken(user._id)

        res.status(201).json({
            success: true,
            data: { user, token },
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}

// Login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Please provide email and password' })
        }

        // Find user
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
            })
        }

        // Check password
        const isMatch = await user.comparePassword(password)
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
            })
        }

        const token = generateToken(user._id)

        res.json({
            success: true,
            data: { user, token },
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}

// Forgot Password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).json({ success: false, error: 'No user found with that email' })
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex')
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000 // 10 minutes

        await user.save()

        // In a real app, send email. For now, log to console.
        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`
        console.log(`\n🔑 [AUTH] Password reset requested for ${email}`)
        console.log(`🔗 Reset URL: ${resetUrl}\n`)

        res.json({ success: true, message: 'Password reset link sent (check server logs for demo)' })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
}

// Reset Password
export const resetPassword = async (req, res) => {
    try {
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpires: { $gt: Date.now() }
        })

        if (!user) {
            return res.status(400).json({ success: false, error: 'Invalid or expired reset token' })
        }

        // Set new password
        user.password = req.body.password
        user.resetPasswordToken = undefined
        user.resetPasswordExpires = undefined

        await user.save()

        res.json({ success: true, message: 'Password reset successful. You can now log in.' })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
}

// Get current user
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            })
        }

        res.json({
            success: true,
            data: {
                ...user.toJSON(),
                isGuest: false
            },
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}
