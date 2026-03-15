import Resume from '../models/Resume.js'
import { parseResume } from '../services/resumeParser.js'
import { demoResumes } from '../services/demoStorage.js'

// Upload and parse resume
export const uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded',
            })
        }

        console.log('📄 Parsing resume:', req.file.filename)
        // Parse the resume
        const parsedData = await parseResume(req.file.path)

        let resume;
        try {
            // Save to database
            resume = await Resume.create({
                userId: req.user.userId,
                originalFile: req.file.filename,
                parsedData,
                rawText: parsedData.rawText || '',
            })
        } catch (dbError) {
            console.log('⚠️ MongoDB save failed, using in-memory storage for demo')
            // Fallback for demo mode
            resume = {
                _id: `resume-${Date.now()}`,
                userId: req.user.userId,
                originalFile: req.file.filename,
                parsedData,
                rawText: parsedData.rawText || '',
                uploadedAt: new Date()
            }
            demoResumes.set(resume._id, resume)
        }

        res.status(201).json({
            success: true,
            data: resume,
        })
    } catch (error) {
        console.error('Upload error:', error)
        res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}

// Get resume by ID
export const getResume = async (req, res) => {
    try {
        let resume = null;
        try {
            resume = await Resume.findOne({
                _id: req.params.id,
                userId: req.user.userId,
            })
        } catch (dbError) {
            resume = demoResumes.get(req.params.id);
        }

        if (!resume && !req.params.id.startsWith('resume-')) {
            // Try demo storage even if DB didn't throw but returned null
            resume = demoResumes.get(req.params.id);
        }

        if (!resume) {
            return res.status(404).json({
                success: false,
                error: 'Resume not found',
            })
        }

        res.json({
            success: true,
            data: resume,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}

// Get all resumes for user
export const getUserResumes = async (req, res) => {
    try {
        const resumes = await Resume.find({ userId: req.user.userId })
            .sort({ uploadedAt: -1 })

        res.json({
            success: true,
            data: resumes,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}
