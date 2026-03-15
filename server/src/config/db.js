import mongoose from 'mongoose'

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI

        if (!mongoUri || mongoUri.includes('<username>')) {
            console.log('⚠️  MongoDB URI not configured. Running in demo mode.')
            console.log('   Set MONGODB_URI in .env to enable database features.')
            return null
        }

        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
        })

        console.log(`✅ MongoDB connected: ${conn.connection.host}`)
        return conn
    } catch (error) {
        console.error('⚠️  MongoDB connection failed:', error.message)
        console.log('   Server will run in demo mode without database.')
        return null
    }
}

export default connectDB
