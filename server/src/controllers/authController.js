import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../models/User.js'
import sendEmail from '../utils/sendEmail.js'

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

        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`
        
        const message = `You are receiving this email because you (or someone else) have requested the reset of a password. Please click on the following link, or paste this into your browser to complete the process: \n\n ${resetUrl}`
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #6366f1;">Reset Your Password</h2>
                <p>You requested a password reset for your ResuMinds Platinum account.</p>
                <p>Click the button below to set a new password. This link is valid for 10 minutes.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                </div>
                <p style="color: #64748b; font-size: 14px;">If you didn't request this, please ignore this email.</p>
            </div>
        `

        try {
            await sendEmail({
                email: user.email,
                subject: 'ResuMinds Password Reset',
                message,
                html
            })
            res.json({ success: true, message: 'Password reset link sent to your email.' })
        } catch (err) {
            console.error('Email error:', err)
            user.resetPasswordToken = undefined
            user.resetPasswordExpires = undefined
            await user.save()
            return res.status(500).json({ success: false, error: 'Email could not be sent' })
        }
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
// Social Auth Success Redirect
export const socialAuthSuccess = (req, res) => {
    const token = generateToken(req.user._id)
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
    
    // Redirect back to frontend with token
    res.redirect(`${clientUrl}/login?token=${token}`)
}
