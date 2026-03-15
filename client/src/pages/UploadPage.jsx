import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import LoadingOverlay from '../components/common/LoadingOverlay'
import './UploadPage.css'

function UploadPage() {
    const [file, setFile] = useState(null)
    const [dragActive, setDragActive] = useState(false)
    const [jobDescription, setJobDescription] = useState('')
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState('')
    const [interviewType, setInterviewType] = useState('mixed')
    const [interviewerPersona, setInterviewerPersona] = useState('tech_lead')
    const navigate = useNavigate()

    const personas = [
        { id: 'tech_lead', name: 'Tech Lead', icon: '💻', desc: 'Strict, technical trade-offs' },
        { id: 'mentor', name: 'Mentor', icon: '🌱', desc: 'Friendly, growth-focused' },
        { id: 'hr_specialist', name: 'HR Lead', icon: '🤝', desc: 'Behavioral & culture' },
        { id: 'founder', name: 'Founder', icon: '🚀', desc: 'Big picture & impact' }
    ]

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0])
        }
    }

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0])
        }
    }

    const validateAndSetFile = (selectedFile) => {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.txt']
        const ext = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'))

        if (!allowedTypes.includes(ext)) {
            alert('Please upload a PDF, DOC, DOCX, or TXT file')
            return
        }

        if (selectedFile.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB')
            return
        }

        setFile(selectedFile)
    }

    const handleUpload = async () => {
        if (!file) return

        setUploading(true)
        setUploadProgress('Uploading resume...')

        try {
            const formData = new FormData()
            formData.append('resume', file)

            setUploadProgress('Analyzing your resume...')

            const uploadResponse = await fetch(`${import.meta.env.VITE_API_URL || ''}/resume/upload`, {
                method: 'POST',
                body: formData,
            })

            let resumeId = null

            if (uploadResponse.ok) {
                const uploadData = await uploadResponse.json()
                if (uploadData.success && uploadData.data) {
                    resumeId = uploadData.data._id
                    setUploadProgress('Generating personalized questions...')
                }
            }

            setUploadProgress('Starting your interview...')

            const startResponse = await fetch(`${import.meta.env.VITE_API_URL || ''}/interview/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resumeId,
                    type: interviewType,
                    jobDescription: jobDescription,
                    persona: interviewerPersona,
                }),
            })

            if (startResponse.ok) {
                const startData = await startResponse.json()
                if (startData.success && startData.data?._id) {
                    navigate(`/lobby/${startData.data._id}`)
                    return
                }
            }

            // Fallback
            console.log('API not available, starting demo session')
            navigate(`/lobby/demo-${Date.now()}`)

        } catch (error) {
            console.error('Upload error:', error)
            navigate(`/lobby/demo-${Date.now()}`)
        } finally {
            setUploading(false)
        }
    }

    const handleQuickStart = async () => {
        setUploading(true)
        setUploadProgress('Starting quick interview...')

        try {
            const startResponse = await fetch(`${import.meta.env.VITE_API_URL || ''}/interview/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: interviewType,
                    jobDescription: jobDescription,
                    persona: interviewerPersona,
                }),
            })

            if (startResponse.ok) {
                const startData = await startResponse.json()
                if (startData.success && startData.data?._id) {
                    navigate(`/lobby/${startData.data._id}`)
                    return
                }
            }
            alert('Unable to start interview. Please try again.')
        } catch (error) {
            console.error('Quick start error:', error)
            alert('Unable to start interview. Please try again.')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="upload-page">
            <Navbar />
            <div className="upload-container animate-slide-up">
                
                <div className="upload-header">
                    <h1 className="upload-title">Configure Interview</h1>
                    <p className="upload-subtitle">Customize the scenario to match your actual job application.</p>
                </div>

                <div className="upload-grid">
                    
                    {/* Left Column: Resume & JD */}
                    <div className="upload-column">
                        <div className="upload-section">
                            <h3 className="section-title">1. Upload Resume</h3>
                            <div
                                className={`drop-zone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <input
                                    type="file"
                                    id="resume-upload"
                                    accept=".pdf,.doc,.docx,.txt"
                                    onChange={handleChange}
                                    hidden
                                />

                                {file ? (
                                    <div className="file-preview">
                                        <div className="file-icon-wrapper">
                                            <span className="file-icon">📄</span>
                                        </div>
                                        <div className="file-info">
                                            <span className="file-name">{file.name}</span>
                                            <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                        <button className="remove-file" onClick={(e) => { e.preventDefault(); setFile(null) }}>✕</button>
                                    </div>
                                ) : (
                                    <label htmlFor="resume-upload" className="drop-content">
                                        <div className="upload-icon-wrapper">
                                            <span className="upload-icon">📁</span>
                                        </div>
                                        <span className="drop-text">
                                            Drag & drop your resume, or <span className="browse-link">browse</span>
                                        </span>
                                        <span className="file-types">PDF, DOC, DOCX, TXT (Max 5MB)</span>
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="upload-section mt-4">
                            <h3 className="section-title">2. Target Job Description <span className="optional-tag">Optional</span></h3>
                            <textarea
                                className="jd-textarea glass-input"
                                placeholder="Paste the exact job description here. The AI will map your resume skills against these requirements."
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Right Column: Persona & Type */}
                    <div className="upload-column">
                        <div className="upload-section">
                            <h3 className="section-title">3. Select Interviewer</h3>
                            <div className="persona-grid">
                                {personas.map((p) => (
                                    <div
                                        key={p.id}
                                        className={`persona-card ${interviewerPersona === p.id ? 'active' : ''}`}
                                        onClick={() => setInterviewerPersona(p.id)}
                                    >
                                        <div className="persona-icon-wrapper">
                                            <span className="persona-icon">{p.icon}</span>
                                        </div>
                                        <div className="persona-info">
                                            <span className="persona-name">{p.name}</span>
                                            <span className="persona-desc">{p.desc}</span>
                                        </div>
                                        {interviewerPersona === p.id && <div className="active-indicator"></div>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="upload-section mt-4">
                            <h3 className="section-title">4. Question Mix</h3>
                            <div className="type-options">
                                <button
                                    className={`type-option ${interviewType === 'mixed' ? 'active' : ''}`}
                                    onClick={() => setInterviewType('mixed')}
                                >
                                    🎯 Mixed (Standard)
                                </button>
                                <button
                                    className={`type-option ${interviewType === 'technical' ? 'active' : ''}`}
                                    onClick={() => setInterviewType('technical')}
                                >
                                    💻 Technical Focus
                                </button>
                                <button
                                    className={`type-option ${interviewType === 'behavioral' ? 'active' : ''}`}
                                    onClick={() => setInterviewType('behavioral')}
                                >
                                    💬 Behavioral Focus
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Actions */}
                <div className="upload-actions">
                    <button
                        className="quick-start-button"
                        onClick={handleQuickStart}
                        disabled={uploading}
                    >
                        Skip Resume (Demo)
                    </button>
                    
                    <button
                        className="primary-button start-interview-button"
                        onClick={handleUpload}
                        disabled={!file || uploading}
                    >
                        {uploading ? (
                            <span className="loading-state">
                                <span className="mini-spinner"></span> {uploadProgress}
                            </span>
                        ) : 'Start Interview'}
                    </button>
                </div>

                <LoadingOverlay isVisible={uploading} message={uploadProgress} />
            </div>
        </div>
    )
}

export default UploadPage
