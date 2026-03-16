import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'
import routes from './routes/index.js'
import errorHandler from './middleware/errorHandler.js'

const app = express()

// ─── Security ───
app.use(helmet({
    contentSecurityPolicy: false, // Allow inline scripts for React dev
    crossOriginEmbedderPolicy: false,
}))

// ─── CORS ───
const corsOrigin = process.env.CORS_ORIGIN || '*'
app.use(cors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(','),
    credentials: true,
}))

// ─── Compression ───
app.use(compression())

// ─── Logging ───
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
}

// ─── Rate Limiting ───
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,            // 100 requests per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' },
})

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,                  // Relaxed for testing (was 20)
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many auth attempts, please try again later.' },
})

app.use('/api', apiLimiter)
app.use('/api/auth', authLimiter)

// ─── Body Parser ───
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))

// ─── API Routes ───
app.use('/api', routes)

// ─── Health Check ───
app.get('/health', async (req, res) => {
    const { checkOllamaHealth } = await import('./services/aiService.js')
    const aiHealthy = await checkOllamaHealth()

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        services: {
            ai: aiHealthy ? 'connected' : 'disconnected',
        },
    })
})

// ─── Error Handling ───
app.use(errorHandler)

export default app
