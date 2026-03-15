import mongoose from 'mongoose'

const interviewSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    resumeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resume',
    },
    type: {
        type: String,
        enum: ['technical', 'behavioral', 'mixed'],
        default: 'mixed',
    },
    persona: {
        type: String,
        default: 'tech_lead',
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending',
    },
    questions: [{
        questionId: String,
        text: String,
        category: String,
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium',
        },
    }],
    answers: [{
        questionId: String,
        userAnswer: String,
        timeSpent: Number, // seconds
        timestamp: { type: Date, default: Date.now },
    }],
    startedAt: Date,
    completedAt: Date,
}, {
    timestamps: true,
})

const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema)

export default InterviewSession
