import { Router } from 'express'
import { uploadResume, getResume, getUserResumes } from '../controllers/resumeController.js'
import auth from '../middleware/auth.js'
import upload from '../middleware/upload.js'

const router = Router()

// POST /api/resume/upload
router.post('/upload', auth, upload.single('resume'), uploadResume)

// GET /api/resume/:id
router.get('/:id', auth, getResume)

// GET /api/resume/user
router.get('/user', auth, getUserResumes)

export default router
