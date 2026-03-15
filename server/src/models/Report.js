import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InterviewSession',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    overallScore: {
        type: Number,
        min: 0,
        max: 100,
    },
    categoryScores: {
        technical: { type: Number, min: 0, max: 100 },
        communication: { type: Number, min: 0, max: 100 },
        problemSolving: { type: Number, min: 0, max: 100 },
    },
    feedback: [{
        questionId: String,
        score: Number,
        strengths: [String],
        improvements: [String],
    }],
    summary: String,
}, {
    timestamps: { createdAt: 'generatedAt' },
})

const Report = mongoose.model('Report', reportSchema)

export default Report
