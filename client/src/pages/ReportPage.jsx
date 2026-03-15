import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import './ReportPage.css'

const personaMap = {
    'tech_lead': { name: 'Tech Lead', icon: '💻', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.1)' },
    'mentor': { name: 'Mentor', icon: '🌱', color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)' },
    'hr_specialist': { name: 'HR Lead', icon: '🤝', color: '#f472b6', bg: 'rgba(244, 114, 182, 0.1)' },
    'founder': { name: 'Founder', icon: '🚀', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.1)' }
}

const metricLabels = {
    technicalAccuracy: { label: 'Technical Accuracy', icon: '🎯', desc: 'Correctness of concepts' },
    depthOfKnowledge: { label: 'Depth of Knowledge', icon: '🔬', desc: 'Detail and exploration' },
    resumeAlignment: { label: 'Resume Alignment', icon: '📄', desc: 'Matches your experience' },
    closenessToJobDescription: { label: 'JD Relevance', icon: '🎪', desc: 'Fits target role' },
    communicationEfficiency: { label: 'Communication', icon: '💬', desc: 'Clarity and structure' }
}

function ReportPage() {
    const { sessionId } = useParams()
    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [animateScores, setAnimateScores] = useState(false)

    useEffect(() => {
        fetchReport()
    }, [sessionId])

    useEffect(() => {
        if (report) {
            const timer = setTimeout(() => setAnimateScores(true), 300)
            return () => clearTimeout(timer)
        }
    }, [report])

    const fetchReport = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/report/${sessionId}`)
            if (response.ok) {
                const data = await response.json()
                if (data.success && data.data) {
                    setReport(data.data)
                    setLoading(false)
                    return
                }
            }
            setError('Report not found or interview incomplete.')
            setLoading(false)
        } catch (err) {
            console.error('Error fetching report:', err)
            setError('Unable to load report. Please try again later.')
            setLoading(false)
        }
    }

    const getScoreCategory = (score) => {
        if (score >= 80) return { class: 'excellent', label: 'Excellent', emoji: '🏆', color: '#34d399' }
        if (score >= 60) return { class: 'good', label: 'Good', emoji: '👍', color: '#60a5fa' }
        if (score >= 40) return { class: 'fair', label: 'Fair', emoji: '📈', color: '#fbbf24' }
        return { class: 'needs-work', label: 'Needs Work', emoji: '💪', color: '#f87171' }
    }

    const cleanText = (text) => {
        if (!text) return ''
        return text.replace(/```json|```|\*\*/g, '').trim()
    }

    const getMetrics = () => {
        if (report.metrics) return report.metrics
        // Fallback for old databases
        return {
            technicalAccuracy: report.categoryScores?.technical || 0,
            depthOfKnowledge: report.categoryScores?.problemSolving || 0,
            communicationEfficiency: report.categoryScores?.communication || 0,
            resumeAlignment: 0,
            closenessToJobDescription: 0
        }
    }

    if (loading) {
        return (
            <div className="report-page bg-grid">
                <Navbar />
                <div className="report-loader-container">
                    <div className="fancy-spinner">
                        <div className="spin-ring"></div>
                        <div className="spin-ring spin-reverse"></div>
                    </div>
                    <h2>Crunching the numbers</h2>
                    <p>Generating your personalized feedback across 5 dimensions...</p>
                </div>
            </div>
        )
    }

    if (error || !report) {
        return (
            <div className="report-page bg-grid">
                <Navbar />
                <div className="report-error-container">
                    <div className="error-icon">📉</div>
                    <h2>Report Unavailable</h2>
                    <p>{error}</p>
                    <Link to="/dashboard" className="primary-button">Back to Dashboard</Link>
                </div>
            </div>
        )
    }

    const metrics = getMetrics()
    const persona = personaMap[report.persona] || personaMap.tech_lead
    const overallMeta = getScoreCategory(report.overallScore || 0)

    return (
        <div className="report-page bg-grid">
            <Navbar />
            
            <main className="report-container">
                {/* Header */}
                <header className="report-header animate-slide-up">
                    <div className="report-breadcrumbs">
                        <Link to="/dashboard">Dashboard</Link>
                        <span>/</span>
                        <span>Session Report</span>
                    </div>
                    
                    <div className="report-title-row">
                        <h1 className="report-title">Interview Analysis</h1>
                        <div className="persona-badge" style={{ background: persona.bg, borderColor: persona.color }}>
                            <span className="pb-icon">{persona.icon}</span>
                            <span className="pb-text" style={{ color: persona.color }}>Evaluated by {persona.name}</span>
                        </div>
                    </div>
                    <p className="report-date">Conducted on {new Date(report.createdAt || Date.now()).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </header>

                <div className="report-top-grid animate-slide-up delay-1">
                    
                    {/* Overall Score Card */}
                    <div className="overall-score-card glass-panel">
                        <h2>Overall Performance</h2>
                        <div className="score-circle-wrapper">
                            <svg viewBox="0 0 160 160" className="score-svg">
                                <circle cx="80" cy="80" r="70" className="score-track" />
                                <circle
                                    cx="80" cy="80" r="70"
                                    className={`score-fill ${overallMeta.class}`}
                                    strokeDasharray={`${((report.overallScore || 0) / 100) * 439.8} 439.8`}
                                    style={{ 
                                        opacity: animateScores ? 1 : 0, 
                                        transition: 'stroke-dasharray 1.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s',
                                        stroke: overallMeta.color
                                    }}
                                />
                            </svg>
                            <div className="score-content">
                                <span className="score-value">{report.overallScore || 0}</span>
                                <span className="score-total">/100</span>
                            </div>
                        </div>
                        <div className="score-meta">
                            <div className="score-verdict" style={{ color: overallMeta.color }}>
                                {overallMeta.emoji} {overallMeta.label}
                            </div>
                            <p>{report.feedback?.length || 0} questions evaluated</p>
                        </div>
                    </div>

                    {/* Dimensions Grid */}
                    <div className="dimensions-panel glass-panel">
                        <h2>Detailed Dimensions</h2>
                        <div className="dimensions-list">
                            {Object.entries(metrics).map(([key, value], i) => {
                                const meta = metricLabels[key]
                                if (!meta) return null
                                const valMeta = getScoreCategory(value)
                                
                                return (
                                    <div key={key} className="dimension-row" style={{ animationDelay: `${i * 0.1}s` }}>
                                        <div className="dim-icon">{meta.icon}</div>
                                        <div className="dim-info">
                                            <div className="dim-head">
                                                <span className="dim-name">{meta.label}</span>
                                                <span className="dim-value" style={{ color: valMeta.color }}>{value}%</span>
                                            </div>
                                            <div className="dim-bar-bg">
                                                <div 
                                                    className="dim-bar-fill" 
                                                    style={{ 
                                                        width: animateScores ? `${value}%` : '0%',
                                                        backgroundColor: valMeta.color
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Executive Summary */}
                <section className="report-summary animate-slide-up delay-2">
                    <div className="summary-glass glass-panel">
                        <div className="section-head">
                            <span className="sec-icon">📝</span>
                            <h2>Executive Summary</h2>
                        </div>
                        <p>{cleanText(report.summary)}</p>
                    </div>
                </section>

                {/* Question by Question Details */}
                <section className="feedback-section animate-slide-up delay-3">
                    <div className="section-head mb-lg">
                        <span className="sec-icon">🔬</span>
                        <h2>Question-by-Question Analysis</h2>
                    </div>

                    <div className="feedback-cards">
                        {report.feedback && report.feedback.length > 0 ? (
                            report.feedback.map((item, index) => {
                                const qMeta = getScoreCategory(item.score || 0)
                                return (
                                    <div key={index} className="qa-card glass-panel">
                                        <div className="qa-header">
                                            <div className="qa-number">Q{index + 1}</div>
                                            <div className="qa-question">{cleanText(item.question)}</div>
                                            <div className="qa-score" style={{ color: qMeta.color, borderColor: qMeta.color }}>
                                                {item.score || 0}%
                                            </div>
                                        </div>

                                        <div className="qa-body">
                                            {item.strengths && item.strengths.length > 0 && (
                                                <div className="feedback-col strengths-col">
                                                    <h4><span className="indicator success"></span> What went well</h4>
                                                    <ul>
                                                        {item.strengths.map((s, i) => <li key={i}>{cleanText(s)}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                            {item.improvements && item.improvements.length > 0 && (
                                                <div className="feedback-col improvements-col">
                                                    <h4><span className="indicator warning"></span> Areas to focus on</h4>
                                                    <ul>
                                                        {item.improvements.map((s, i) => <li key={i}>{cleanText(s)}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="empty-feedback glass-panel">
                                <p>No detailed feedback recorded for this session.</p>
                            </div>
                        )}
                    </div>
                </section>

            </main>
        </div>
    )
}

export default ReportPage
