import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useVoiceInput from '../hooks/useVoiceInput'
import useVoiceSynthesis from '../hooks/useVoiceSynthesis'
import CameraFeed from '../components/interview/CameraFeed'
import AIPersona from '../components/interview/AIPersona'
import LoadingOverlay from '../components/common/LoadingOverlay'
import './InterviewPage.css'

const personaMap = {
    'tech_lead': { name: 'Alex', role: 'Engineering Lead' },
    'mentor': { name: 'Maya', role: 'Senior Mentor' },
    'hr_specialist': { name: 'Jordan', role: 'HR Director' },
    'founder': { name: 'Sam', role: 'Startup Founder' }
}

function InterviewPage() {
    const { sessionId } = useParams()
    const navigate = useNavigate()
    const isSubmittingRef = useRef(false)
    const elapsedRef = useRef(0)
    const elapsedTimerRef = useRef(null)
    const interviewEndedRef = useRef(false)   // <-- prevents background activity after leave

    // Interview state
    const [questions, setQuestions] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [sessionInfo, setSessionInfo] = useState(null)
    const [answers, setAnswers] = useState({})
    const [currentAnswer, setCurrentAnswer] = useState('')
    const [loading, setLoading] = useState(true)
    const [interviewStarted, setInterviewStarted] = useState(false) // User must click to start
    const [finishing, setFinishing] = useState(false)
    const [error, setError] = useState(null)
    const [elapsed, setElapsed] = useState('0:00')
    const [showLeaveModal, setShowLeaveModal] = useState(false)
    const [leaving, setLeaving] = useState(false)
    const [micFailed, setMicFailed] = useState(false) // permanent text-mode flag
    const [submitting, setSubmitting] = useState(false) // visible loading state for Send btn

    // Elapsed timer — starts once loading finishes, stops when interview ends
    useEffect(() => {
        if (interviewStarted && !interviewEndedRef.current) {
            // Clear any existing timer first
            if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current)
            elapsedTimerRef.current = setInterval(() => {
                if (!interviewEndedRef.current) {
                    elapsedRef.current += 1
                    const m = Math.floor(elapsedRef.current / 60)
                    const s = elapsedRef.current % 60
                    setElapsed(`${m}:${s.toString().padStart(2, '0')}`)
                }
            }, 1000)
        }
        return () => {
            if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current)
        }
    }, [interviewStarted])

    const onVoiceResult = useCallback((text) => {
        if (interviewEndedRef.current) return
        setCurrentAnswer(prev => {
            const trimmed = prev.trim()
            let processed = text
            if (trimmed.match(/[.!?]$/) && processed.length > 0) {
                processed = processed.charAt(0).toUpperCase() + processed.slice(1)
            }
            return trimmed ? `${trimmed} ${processed}` : processed
        })
    }, [])

    const onVoiceError = useCallback((err) => {
        // If we get a fatal mic error, switch to text mode permanently
        if (['network', 'not-allowed', 'audio-capture'].includes(err)) {
            console.log('[InterviewPage] Mic fatal error, switching to text mode')
            setMicFailed(true)
        }
    }, [])

    const {
        isListening,
        interimTranscript,
        lastResultTimestamp,
        error: voiceError,
        startListening,
        stopListening,
        resetTranscript,
    } = useVoiceInput({
        onResult: onVoiceResult,
        onError: onVoiceError,
    })

    const {
        speak,
        stop: stopSpeaking,
        speaking: aiSpeaking,
    } = useVoiceSynthesis()

    const currentQuestion = questions[currentIndex]
    const persona = personaMap[sessionInfo?.persona] || personaMap.tech_lead

    // ----- CLEANUP HELPER -----
    const killEverything = useCallback(() => {
        interviewEndedRef.current = true
        if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current)
        stopListening()
        stopSpeaking()
    }, [stopListening, stopSpeaking])

    // Fetch questions on mount
    useEffect(() => {
        // Strict mode fix: reset the ref since React might run setup->cleanup->setup
        interviewEndedRef.current = false
        fetchQuestions()
        
        // Cleanup when component unmounts
        return () => { killEverything() }
    }, [sessionId])

    // Auto-speak subsequent questions (index > 0)
    useEffect(() => {
        if (interviewStarted && currentQuestion && !interviewEndedRef.current && currentIndex > 0) {
            if (isListening) stopListening()
            const timer = setTimeout(() => {
                if (!interviewEndedRef.current) {
                    speak(cleanText(currentQuestion.text))
                }
            }, 600)
            return () => clearTimeout(timer)
        }
    }, [currentIndex, questions, interviewStarted])

    // Auto-start mic after AI finishes speaking
    // ONLY if: mic hasn't fatally failed AND interview is still active
    useEffect(() => {
        if (!interviewStarted || interviewEndedRef.current || micFailed) return

        if (!aiSpeaking && !finishing && !showLeaveModal && currentQuestion && !voiceError) {
            const timer = setTimeout(() => {
                if (!isListening && !interviewEndedRef.current && !micFailed) {
                    startListening()
                }
            }, 500)
            return () => clearTimeout(timer)
        } else if (aiSpeaking && isListening) {
            stopListening()
        }
    }, [aiSpeaking, finishing, showLeaveModal, currentQuestion, isListening, micFailed, voiceError, interviewStarted])

    // Silence detection: auto-submit after 4s of silence (voice mode only)
    useEffect(() => {
        if (!micFailed && isListening && currentAnswer.trim() && !aiSpeaking && !loading && !finishing && !isSubmittingRef.current && !interviewEndedRef.current) {
            const timer = setTimeout(() => {
                const idleTime = Date.now() - lastResultTimestamp
                if (idleTime >= 4000) {
                    handleSubmitAnswer()
                }
            }, 4100)
            return () => clearTimeout(timer)
        }
    }, [lastResultTimestamp, isListening, currentAnswer, aiSpeaking, loading, finishing, micFailed])

    const fetchQuestions = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/interview/${sessionId}`)
            if (response.ok) {
                const data = await response.json()
                if (data.success && data.data?.questions?.length > 0) {
                    setQuestions(data.data.questions)
                    setSessionInfo(data.data)
                    setLoading(false)
                    return
                }
            }
            const startResponse = await fetch('/api/interview/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'mixed' }),
            })
            if (startResponse.ok) {
                const startData = await startResponse.json()
                if (startData.success && startData.data?.questions?.length > 0) {
                    setQuestions(startData.data.questions)
                    setSessionInfo(startData.data)
                    setLoading(false)
                    return
                }
            }
            setQuestions(getDemoQuestions())
            setLoading(false)
        } catch (err) {
            console.error('Error fetching questions:', err)
            setQuestions(getDemoQuestions())
            setLoading(false)
        }
    }

    const getDemoQuestions = () => [
        { questionId: 'demo-1', text: "Hey, welcome! To kick things off, could you tell me a bit about yourself and what you've been working on lately?", category: "behavioral", difficulty: "easy" }
    ]

    // ---- SUBMIT ANSWER (used by both voice auto-submit AND text fallback) ----
    const handleSubmitAnswer = async () => {
        if (isSubmittingRef.current || interviewEndedRef.current) return
        isSubmittingRef.current = true
        setSubmitting(true)

        if (isListening) stopListening()
        stopSpeaking()

        const answerText = currentAnswer.trim()
        if (!answerText) {
            isSubmittingRef.current = false
            setSubmitting(false)
            return
        }

        if (!currentQuestion) {
            console.error('[InterviewPage] No currentQuestion to submit against')
            isSubmittingRef.current = false
            setSubmitting(false)
            return
        }

        try {
            console.log(`[InterviewPage] Submitting answer for Q: ${currentQuestion.questionId}`)
            const response = await fetch(`/api/interview/${sessionId}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionId: currentQuestion.questionId,
                    userAnswer: answerText,
                    timeSpent: elapsedRef.current
                }),
            })

            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    const session = data.data
                    setAnswers(prev => ({ ...prev, [currentQuestion.questionId]: { answer: answerText } }))

                    const nextIndex = currentIndex + 1
                    if (session.questions && session.questions[nextIndex]) {
                        setQuestions(session.questions)
                        setCurrentIndex(nextIndex)
                        setCurrentAnswer('')
                        resetTranscript()
                    } else {
                        // Last question — finish the interview
                        await finishInterview()
                    }
                } else {
                    console.error('[InterviewPage] API returned success: false')
                }
            } else {
                console.error('[InterviewPage] API response not OK:', response.status)
            }
        } catch (err) {
            console.error('[InterviewPage] Submit answer error:', err)
        }

        isSubmittingRef.current = false
        setSubmitting(false)
    }

    const finishInterview = async () => {
        killEverything()
        setFinishing(true)
        try {
            await fetch(`/api/interview/${sessionId}/complete`, { method: 'POST' })
            setTimeout(() => navigate(`/report/${sessionId}`), 4000)
        } catch (err) {
            console.error('Error completing interview:', err)
            navigate(`/report/${sessionId}`)
        }
    }

    // ---- LEAVE MEETING ----
    const handleLeaveClick = () => {
        stopListening()
        stopSpeaking()
        setShowLeaveModal(true)
    }

    const handleReturnToCall = () => {
        setShowLeaveModal(false)
        if (currentQuestion && !aiSpeaking && !finishing && !micFailed && !voiceError) {
            setTimeout(() => startListening(), 300)
        }
    }

    const handleLeaveInterview = async () => {
        setLeaving(true)
        killEverything()  // <-- stop EVERYTHING immediately

        try {
            // Submit current partial answer if any
            const answerText = currentAnswer.trim()
            if (answerText && currentQuestion) {
                await fetch(`/api/interview/${sessionId}/answer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        questionId: currentQuestion.questionId,
                        userAnswer: answerText,
                        timeSpent: elapsedRef.current
                    }),
                })
            }
            await fetch(`/api/interview/${sessionId}/complete`, { method: 'POST' })
        } catch (err) {
            console.error('Error completing interview on leave:', err)
        }
        navigate(`/report/${sessionId}`)
    }

    const cleanText = (text) => {
        if (!text) return ''
        return text.replace(/```json|```/g, '').trim()
    }

    // Show text input if mic has failed OR there's a current voice error
    const showTextInput = micFailed || !!voiceError

    // ---- RENDER ----

    if (loading) {
        return (
            <div className="interview-page loading-state">
                <div className="loader">
                    <div className="spinner"></div>
                    <p>Connecting to your interviewer...</p>
                </div>
            </div>
        )
    }

    if (error || (questions && questions.length === 0)) {
        return (
            <div className="interview-page error-state">
                <h2>Unable to connect</h2>
                <p>{error || 'Something went wrong.'}</p>
                <button onClick={() => navigate('/upload')}>Go Back</button>
            </div>
        )
    }

    return (
        <div className="interview-page video-call-mode">
            <LoadingOverlay isVisible={finishing} type="analysis" />

            {!interviewStarted && !loading && !error && currentQuestion && (
                <div className="ready-overlay" style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                    zIndex: 1000, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', textAlign: 'center'
                }}>
                    <div style={{
                        background: '#1a1a2e', padding: '40px', borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.1)', maxWidth: '450px'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>👋</div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Your Interviewer is Ready</h2>
                        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '30px', lineHeight: '1.5' }}>
                            {persona.name} will ask the first question when you're ready. Ensure your microphone is nearby.
                        </p>
                        <button 
                            style={{
                                background: 'linear-gradient(45deg, #6366f1, #3b82f6)',
                                color: 'white', border: 'none', padding: '14px 28px',
                                borderRadius: '8px', fontSize: '1.1rem', fontWeight: '600',
                                cursor: 'pointer', transition: 'all 0.2s', width: '100%',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                            }}
                            onClick={() => {
                                setInterviewStarted(true)
                                // Chrome STRICT POLICY: The first speech Synthesis MUST be triggered
                                // directly in the call stack of a user click.
                                if (currentQuestion) {
                                    speak(cleanText(currentQuestion.text))
                                }
                            }}
                        >
                            Start Interview
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="call-header">
                <div className="call-header-left">
                    <span className="rec-dot"></span>
                    <span className="call-elapsed">{elapsed}</span>
                </div>
                <div className="call-header-center">
                    <span className="call-title">Interview Session</span>
                </div>
                <div className="call-header-right">
                    <span className="call-interviewer">{persona.name} · {persona.role}</span>
                </div>
            </header>

            {/* Video grid */}
            <div className="video-conference-grid">
                <div className="video-participant user-stream">
                    <CameraFeed isActive={true} />
                </div>

                <div className="video-participant ai-stream">
                    <div className={`ai-video-placeholder ${aiSpeaking ? 'speaking' : ''}`}>
                        <div className="video-overlay-tint"></div>
                        <div className="ai-avatar-large">
                            <AIPersona type={sessionInfo?.persona} isSpeaking={aiSpeaking} />
                        </div>
                        <div className="participant-name">{persona.name}</div>

                        {aiSpeaking && (
                            <div className="ai-waveform-container">
                                <div className="bar"></div>
                                <div className="bar"></div>
                                <div className="bar"></div>
                                <div className="bar"></div>
                                <div className="bar"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Live captions */}
            <div className={`live-captions ${aiSpeaking || currentQuestion ? 'active' : ''}`}>
                <div className="caption-scroll">
                    {/* ALWAYS show the question text so the user knows what to answer */}
                    {currentQuestion && interviewStarted && (
                        <div className="caption-question" style={{
                            fontSize: '1rem',
                            color: '#e2e8f0',
                            marginBottom: '12px',
                            fontWeight: '500',
                            paddingBottom: '12px',
                            borderBottom: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <span className="caption-speaker" style={{ color: '#94a3b8' }}>{persona.name}: </span>
                            {cleanText(currentQuestion.text)}
                        </div>
                    )}
                    <p className="caption-text">
                        {aiSpeaking && <span className="caption-speaker">{persona.name}: </span>}
                        {!aiSpeaking && isListening && <span className="caption-speaker">You: </span>}
                        {!aiSpeaking && showTextInput && !isListening && <span className="caption-speaker">You (typing): </span>}
                        {aiSpeaking
                            ? <span style={{ opacity: 0.7 }}>🔊 (Speaking...)</span>
                            : (interimTranscript || currentAnswer || '(waiting for your answer...)')
                        }
                    </p>
                </div>

                {/* TEXT INPUT — always visible when AI is not speaking so user can always type */}
                {!aiSpeaking && currentQuestion && !finishing && (
                    <div className="fallback-input-container">
                        <input
                            type="text"
                            className="fallback-input"
                            placeholder={showTextInput ? "Mic unavailable — type your answer here..." : "Speak or type your answer here..."}
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && currentAnswer.trim() && !submitting) {
                                    handleSubmitAnswer()
                                }
                            }}
                            disabled={submitting}
                        />
                        <button
                            className="fallback-submit"
                            onClick={handleSubmitAnswer}
                            disabled={!currentAnswer.trim() || submitting}
                        >
                            {submitting ? '⏳ Processing...' : 'Send ↵'}
                        </button>
                    </div>
                )}
            </div>

            {/* Leave Meeting Modal */}
            {showLeaveModal && (
                <div className="leave-modal-overlay">
                    <div className="leave-modal">
                        <div className="leave-modal-icon">📞</div>
                        <h2>Leave this interview?</h2>
                        <p>
                            {Object.keys(answers).length > 0
                                ? `You've answered ${Object.keys(answers).length} question${Object.keys(answers).length !== 1 ? 's' : ''}. Your progress will be saved and a report will be generated.`
                                : "You haven't answered any questions yet. Are you sure you want to leave?"
                            }
                        </p>
                        <div className="leave-modal-actions">
                            <button
                                className="leave-btn return"
                                onClick={handleReturnToCall}
                                disabled={leaving}
                            >
                                Return to call
                            </button>
                            <button
                                className="leave-btn leave"
                                onClick={handleLeaveInterview}
                                disabled={leaving}
                            >
                                {leaving ? 'Ending...' : 'Leave meeting'}
                            </button>
                        </div>
                        <span className="leave-modal-hint">
                            Duration: {elapsed}
                        </span>
                    </div>
                </div>
            )}

            {/* Bottom bar */}
            <div className="call-controls">
                <div className="control-left">
                    {isListening && !aiSpeaking && !voiceError && (
                        <div className="mic-live">
                            <span className="mic-live-dot"></span>
                            Mic on
                        </div>
                    )}
                    {showTextInput && (
                        <div className="mic-error" onClick={() => {
                            setMicFailed(false)
                            startListening()
                        }}>
                            <span className="mic-error-dot">⚠</span>
                            <span className="mic-error-text">Typing mode</span>
                            <span className="mic-retry">Retry Mic</span>
                        </div>
                    )}
                </div>
                <div className="control-center">
                    <button
                        className={`control-btn mic-btn ${isListening && !aiSpeaking ? 'active' : ''}`}
                        title={showTextInput ? 'Retry microphone' : (isListening ? 'Mute' : 'Unmute')}
                        onClick={() => {
                            if (isListening) {
                                stopListening()
                            } else {
                                setMicFailed(false)
                                startListening()
                            }
                        }}
                    >
                        {isListening && !aiSpeaking ? '🎤' : '🔇'}
                    </button>
                    <button
                        className="control-btn end-call-btn"
                        onClick={handleLeaveClick}
                        title="Leave interview"
                    >
                        📞
                    </button>
                    <button
                        className="control-btn captions-btn"
                        onClick={() => speak(cleanText(currentQuestion?.text))}
                        title="Replay last question"
                    >
                        CC
                    </button>
                </div>
                <div className="control-right" />
            </div>
        </div>
    )
}

export default InterviewPage
