import mongoose from 'mongoose'

const resumeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    originalFile: {
        type: String,
        required: true,
    },
    parsedData: {
        name: String,
        skills: [String],
        experience: [{
            company: String,
            role: String,
            duration: String,
            highlights: [String],
        }],
        education: [{
            institution: String,
            degree: String,
            year: String,
        }],
        projects: [{
            name: String,
            description: String,
            tech: [String],
        }],
    },
    rawText: String,
}, {
    timestamps: { createdAt: 'uploadedAt' },
})

const Resume = mongoose.model('Resume', resumeSchema)

export default Resume
