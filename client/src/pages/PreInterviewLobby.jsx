import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CameraFeed from '../components/interview/CameraFeed'
import './PreInterviewLobby.css'

const personaMap = {
    'tech_lead': { name: 'Alex', role: 'Engineering Lead', avatar: '💻' },
    'mentor': { name: 'Maya', role: 'Senior Mentor', avatar: '🌱' },
    'hr_specialist': { name: 'Jordan', role: 'HR Director', avatar: '🤝' },
    'founder': { name: 'Sam', role: 'Startup Founder', avatar: '🚀' }
}

function PreInterviewLobby() {
    const { sessionId } = useParams()
    const navigate = useNavigate()

    const [micLevel, setMicLevel] = useState(0)
    const [stream, setStream] = useState(null)
    const [micOk, setMicOk] = useState(false)
    const [cameraOk, setCameraOk] = useState(false)
    const audioContextRef = useRef(null)
    const analyzerRef = useRef(null)
    const animationFrameRef = useRef(null)

    // Fetch session info (persona etc.)
    const [sessionData, setSessionData] = useState(null)
    useEffect(() => {
        fetchSession()
    }, [sessionId])

    const fetchSession = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/interview/${sessionId}`)
            if (res.ok) {
                const data = await res.json()
                if (data.success) setSessionData(data.data)
            }
        } catch (e) { /* ignore */ }
    }

    useEffect(() => {
        setupEquipment()
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
            if (audioContextRef.current) audioContextRef.current.close()
            if (stream) stream.getTracks().forEach(track => track.stop())
        }
    }, [])

    const setupEquipment = async () => {
        try {
            const userStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            })
            setStream(userStream)
            setCameraOk(true)
            setupMicLevel(userStream)
        } catch (err) {
            console.error('Equipment access denied:', err)
        }
    }

    const setupMicLevel = (stream) => {
        try {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
            const source = audioContextRef.current.createMediaStreamSource(stream)
            analyzerRef.current = audioContextRef.current.createAnalyser()
            analyzerRef.current.fftSize = 256
            source.connect(analyzerRef.current)

            const updateLevel = () => {
                const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount)
                analyzerRef.current.getByteFrequencyData(dataArray)
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length
                setMicLevel(average)
                if (average > 5) setMicOk(true)
                animationFrameRef.current = requestAnimationFrame(updateLevel)
            }
            updateLevel()
        } catch (err) {
            console.error('Mic level visualization failed:', err)
        }
    }

    const persona = personaMap[sessionData?.persona] || personaMap.tech_lead

    return (
        <div className="lobby-page">
            <div className="lobby-layout">
                {/* Camera Preview — large, left side */}
                <div className="camera-preview-section">
                    <div className="camera-box">
                        <CameraFeed isActive={true} />
                        <div className="mic-overlay">
                            <div className="mic-bars">
                                {[...Array(8)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`m-bar ${micLevel > (i * 8) ? 'lit' : ''}`}
                                    />
                                ))}
                            </div>
                            <span className="mic-label-text">
                                {micOk ? '🎤 Mic working' : '🎤 Speak to test mic'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right side — join info */}
                <div className="join-info-section">
                    <div className="join-card">
                        <h1 className="join-title">Ready to join?</h1>
                        <p className="join-subtitle">Your interview is ready. Check your setup below.</p>

                        {/* Interviewer preview */}
                        <div className="interviewer-preview">
                            <div className="interviewer-avatar-circle">
                                <span>{persona.avatar}</span>
                            </div>
                            <div className="interviewer-info">
                                <span className="interviewer-name">{persona.name}</span>
                                <span className="interviewer-role">{persona.role}</span>
                            </div>
                            <span className="in-call-badge">In the call</span>
                        </div>

                        {/* Equipment checks */}
                        <div className="equip-checks">
                            <div className={`equip-row ${cameraOk ? 'ok' : 'pending'}`}>
                                <span className="equip-icon">📷</span>
                                <span className="equip-text">Camera</span>
                                <span className="equip-status">{cameraOk ? '✓ Ready' : '— Waiting'}</span>
                            </div>
                            <div className={`equip-row ${micOk ? 'ok' : 'pending'}`}>
                                <span className="equip-icon">🎤</span>
                                <span className="equip-text">Microphone</span>
                                <span className="equip-status">{micOk ? '✓ Ready' : '— Speak to test'}</span>
                            </div>
                            <div className="equip-row ok">
                                <span className="equip-icon">🔊</span>
                                <span className="equip-text">Speakers</span>
                                <span className="equip-status">✓ Ready</span>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="lobby-tips">
                            <p>💡 Treat this like a real interview — speak naturally and take your time.</p>
                        </div>

                        {/* Join button */}
                        <button
                            className="join-now-btn"
                            onClick={() => navigate(`/interview/${sessionId}`)}
                        >
                            Join now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PreInterviewLobby
