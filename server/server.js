import 'dotenv/config'
import app from './src/app.js'
import connectDB from './src/config/db.js'

const PORT = process.env.PORT || 5000

// Connect to MongoDB and start server
const startServer = async () => {
    try {
        await connectDB()

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`)
            console.log(`📚 API docs: http://localhost:${PORT}/api`)
        })
    } catch (error) {
        console.error('Failed to start server:', error)
        process.exit(1)
    }
}

startServer()


