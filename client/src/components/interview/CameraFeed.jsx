import { useState, useEffect, useRef } from 'react'
import './CameraFeed.css'

/**
 * CameraFeed Component
 * Handles WebRTC camera access and provides a video stream for the user
 */
const CameraFeed = ({ isActive = true, showControls = true }) => {
    const videoRef = useRef(null)
    const [stream, setStream] = useState(null)
    const [error, setError] = useState(null)
    const [cameraOn, setCameraOn] = useState(isActive)
    const [isMirror, setIsMirror] = useState(true)

    useEffect(() => {
        if (cameraOn) {
            startCamera()
        } else {
            stopCamera()
        }

        return () => stopCamera()
    }, [cameraOn])

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            })

            setStream(mediaStream)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
            }
            setError(null)
        } catch (err) {
            console.error('Error accessing camera:', err)
            setError(err.name === 'NotAllowedError'
                ? 'Camera access denied. Please allow camera permissions.'
                : 'Could not connect to camera.')
            setCameraOn(false)
        }
    }

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null
        }
    }

    const toggleCamera = () => {
        setCameraOn(!cameraOn)
    }

    return (
        <div className="camera-feed-container">
            <div className={`camera-view ${isMirror ? 'mirror' : ''}`}>
                {cameraOn && !error ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="live-video"
                    />
                ) : (
                    <div className="camera-placeholder">
                        <span className="placeholder-icon">📷</span>
                        <p>{error || 'Camera is Off'}</p>
                    </div>
                )}

                {/* User Name Badge */}
                <div className="user-badge">You</div>
            </div>

            {showControls && (
                <div className="camera-controls">
                    <button
                        className={`control-btn ${!cameraOn ? 'off' : ''}`}
                        onClick={toggleCamera}
                        title={cameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
                    >
                        {cameraOn ? '📹' : '📵'}
                    </button>
                    <button
                        className="control-btn"
                        onClick={() => setIsMirror(!isMirror)}
                        title="Toggle Mirror View"
                    >
                        🔄
                    </button>
                </div>
            )}
        </div>
    )
}

export default CameraFeed
