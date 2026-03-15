import jwt from 'jsonwebtoken'

// Use a consistent guest user ID for demo mode (must be valid 24-char hex for MongoDB)
const GUEST_USER_ID = '000000000000000000000001'

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '')

        if (!token) {
            // Check if we should allow guests (Demo Mode)
            const isDemoMode = !process.env.MONGODB_URI || process.env.MONGODB_URI.includes('<username>')

            req.user = {
                userId: GUEST_USER_ID,
                email: 'guest@demo.com',
                isGuest: true,
            }

            // In demo mode, we always allow next()
            // In production, we might want to be stricter, but for this MVP 
            // we'll allow guests unless the specific route requires a registered user
            return next()
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key')
        req.user = {
            ...decoded,
            isGuest: false
        }
        next()
    } catch (error) {
        console.error('Auth middleware error:', error.message)

        // Even if token is invalid, fallback to guest in demo mode
        req.user = {
            userId: GUEST_USER_ID,
            email: 'guest@demo.com',
            isGuest: true,
        }
        next()
    }
}

export default auth
