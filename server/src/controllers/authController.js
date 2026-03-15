import jwt from 'jsonwebtoken'
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
