import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * useVoiceInput — v5 "Continuous" Engine
 *
 * Root-cause fix for the "network" error loop:
 *   continuous = false → Chrome opens a fresh WebSocket per session.
 *   When there is silence the server drops the socket immediately and fires
 *   onerror("network"). The rapid open/close cycle then gets throttled by
 *   Chrome which makes it worse.
 *
 *   continuous = true → One long-lived WebSocket. The session stays open until
 *   we explicitly call stop(). No idle-timeout kills, no network spam.
 *
 * Other fixes:
 *   - pendingStartRef: guards against double-start BEFORE onstart fires
 *     (isRunningRef alone wasn't enough — two callers could both see it false
 *     in the same tick before the first onstart arrived)
 *   - resumeAfterTTS: goes through safeStart() with a 400 ms hardware-release
 *     delay instead of calling startListening() directly
 *   - networkErrorCountRef: after 5 consecutive network errors → fatal fallback
 *     to text mode instead of looping forever
 */
export function useVoiceInput(options = {}) {
    const {
        interimResults = true,
        language = 'en-US',
        onResult = () => {},
        onError = () => {},
    } = options

    // --- State: Drives the UI ---
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [interimTranscript, setInterimTranscript] = useState('')
    const [isSupported, setIsSupported] = useState(false)
    const [error, setError] = useState(null)
    const [lastResultTimestamp, setLastResultTimestamp] = useState(Date.now())

    // --- Refs: Engine Logic ---
    const recognitionRef = useRef(null)
    const shouldListenRef = useRef(false)       // User intent
    const isSpeakingRef = useRef(false)         // TTS lock
    const fatalErrorRef = useRef(false)         // Permanent stop
    const restartTimerRef = useRef(null)        // Scheduler
    const startTimeoutRef = useRef(null)        // Safety net for silent starts
    const startAckedRef = useRef(false)         // onstart has fired (for safety net)
    const pendingStartRef = useRef(false)       // start() called but onstart not yet fired
    const isRunningRef = useRef(false)          // Between onstart and onend
    const networkErrorCountRef = useRef(0)      // Consecutive network errors
    const sessionStartTimeRef = useRef(null)    // Diagnostic timing
    const callbacksRef = useRef({ onResult, onError })

    useEffect(() => {
        callbacksRef.current = { onResult, onError }
    }, [onResult, onError])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            shouldListenRef.current = false
            cleanupTimers()
            if (recognitionRef.current) {
                try { recognitionRef.current.abort() } catch (e) {}
            }
        }
    }, [])

    const cleanupTimers = () => {
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
        if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current)
    }

    const handleFatalError = (message, code) => {
        console.error(`[VoiceInput] Fatal Error: ${code} - ${message}`)
        setError(message)
        fatalErrorRef.current = true
        shouldListenRef.current = false
        pendingStartRef.current = false
        isRunningRef.current = false
        setIsListening(false)
        cleanupTimers()
        try { recognitionRef.current?.abort() } catch (e) {}
        callbacksRef.current.onError(code)
    }

    // Central start guard — the only place that calls recognition.start()
    const safeStart = () => {
        if (!recognitionRef.current || fatalErrorRef.current) return
        if (isRunningRef.current || pendingStartRef.current) {
            console.log('[VoiceInput] safeStart skipped: already running or pending')
            return
        }
        pendingStartRef.current = true
        startAckedRef.current = false
        try {
            recognitionRef.current.start()
            if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current)
            startTimeoutRef.current = setTimeout(() => {
                if (shouldListenRef.current && !startAckedRef.current) {
                    console.warn('[VoiceInput] ⏰ Mic failed to respond to start()')
                    handleFatalError('Mic initialization timed out.', 'timeout')
                }
            }, 3500)
        } catch (err) {
            pendingStartRef.current = false
            if (!err.message?.includes('already started')) {
                console.warn('[VoiceInput] start() threw:', err.message)
            }
        }
    }

    // One-time Engine Setup
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        setIsSupported(!!SpeechRecognition)

        if (!SpeechRecognition) {
            setError('Voice input not supported in this browser.')
            return
        }

        const createRecognition = () => {
            const recognition = new SpeechRecognition()
            // continuous = true: one long-lived WebSocket instead of rapid open/close cycles
            recognition.continuous = true
            recognition.interimResults = interimResults
            recognition.lang = language
            recognition.maxAlternatives = 1

            recognition.onstart = () => {
                sessionStartTimeRef.current = Date.now()  // Diagnostic
                startAckedRef.current = true
                pendingStartRef.current = false
                isRunningRef.current = true
                networkErrorCountRef.current = 0
                console.log('[VoiceInput] ✅ Service Connected')
                if (startTimeoutRef.current) {
                    clearTimeout(startTimeoutRef.current)
                    startTimeoutRef.current = null
                }
                fatalErrorRef.current = false
                setError(null)
                setLastResultTimestamp(Date.now())
            }

            recognition.onend = () => {
                isRunningRef.current = false
                pendingStartRef.current = false
                const shouldRestart = shouldListenRef.current && !isSpeakingRef.current && !fatalErrorRef.current
                console.log(`[VoiceInput] Session Ended. Should Restart: ${shouldRestart}`)

                if (shouldRestart) {
                    if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
                    // Back off harder when we've been seeing network errors
                    const delay = networkErrorCountRef.current > 0
                        ? Math.min(networkErrorCountRef.current * 800, 3000)
                        : 150
                    restartTimerRef.current = setTimeout(() => {
                        if (shouldListenRef.current && !isSpeakingRef.current && !fatalErrorRef.current) {
                            safeStart()
                        }
                    }, delay)
                }
            }

            recognition.onerror = (event) => {
                // Diagnostic: time from onstart to onerror
                if (sessionStartTimeRef.current != null) {
                    const ms = Date.now() - sessionStartTimeRef.current
                    console.warn(`[VoiceInput] 🔬 DIAG: onerror("${event.error}") ${ms}ms after onstart`)
                    sessionStartTimeRef.current = null
                }
                if (startTimeoutRef.current) {
                    clearTimeout(startTimeoutRef.current)
                    startTimeoutRef.current = null
                }
                pendingStartRef.current = false

                console.warn(`[VoiceInput] Engine Error: ${event.error}`)

                switch (event.error) {
                    case 'no-speech':
                        // With continuous = true this rarely fires; non-fatal anyway
                        return
                    case 'audio-capture':
                        handleFatalError('Mic not found.', 'audio-capture')
                        break
                    case 'not-allowed':
                        handleFatalError('Mic access denied.', 'not-allowed')
                        break
                    case 'network':
                    case 'service-not-allowed':
                        networkErrorCountRef.current += 1
                        if (networkErrorCountRef.current >= 5) {
                            handleFatalError(
                                'Speech service unavailable. Please type your answers.',
                                'network'
                            )
                        } else {
                            setError(`Speech service issue (${networkErrorCountRef.current}/5). Retrying…`)
                        }
                        break
                    case 'aborted':
                        // Expected: we called stop() or abort() ourselves
                        break
                    default:
                        networkErrorCountRef.current += 1
                        if (networkErrorCountRef.current >= 3) {
                            handleFatalError('Speech service error. Please type answers.', event.error)
                        }
                }
            }

            recognition.onresult = (event) => {
                let finalText = ''
                let interim = ''
                setLastResultTimestamp(Date.now())
                networkErrorCountRef.current = 0  // Any real result resets the error counter

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i]
                    if (result.isFinal) {
                        finalText += result[0].transcript + ' '
                    } else {
                        interim += result[0].transcript
                    }
                }

                if (finalText) {
                    setTranscript(prev => prev + finalText)
                    callbacksRef.current.onResult(finalText.trim())
                }
                setInterimTranscript(interim)
            }

            return recognition
        }

        recognitionRef.current = createRecognition()

        return () => {
            cleanupTimers()
            if (recognitionRef.current) {
                try { recognitionRef.current.abort() } catch (e) {}
            }
        }
    }, [interimResults, language])

    // --- Exposed Actions ---

    const startListening = useCallback(() => {
        if (!recognitionRef.current || fatalErrorRef.current) return
        console.log('[VoiceInput] User Intent: START')
        shouldListenRef.current = true
        setIsListening(true)
        setError(null)
        setInterimTranscript('')
        safeStart()
    }, [])

    const stopListening = useCallback(() => {
        console.log('[VoiceInput] User Intent: STOP')
        shouldListenRef.current = false
        setIsListening(false)
        cleanupTimers()
        isRunningRef.current = false
        pendingStartRef.current = false
        if (recognitionRef.current) {
            try { recognitionRef.current.stop() } catch (e) {}
        }
    }, [])

    const pauseForTTS = useCallback(() => {
        console.log('[VoiceInput] TTS Lock: ON')
        isSpeakingRef.current = true
        cleanupTimers()
        isRunningRef.current = false
        pendingStartRef.current = false
        if (recognitionRef.current) {
            try { recognitionRef.current.stop() } catch (e) {}
        }
    }, [])

    const resumeAfterTTS = useCallback(() => {
        console.log('[VoiceInput] TTS Lock: OFF')
        isSpeakingRef.current = false
        if (shouldListenRef.current && !fatalErrorRef.current) {
            // 400 ms delay lets audio hardware fully release after TTS finishes
            if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
            restartTimerRef.current = setTimeout(() => {
                if (shouldListenRef.current && !isSpeakingRef.current && !fatalErrorRef.current) {
                    safeStart()
                }
            }, 400)
        }
    }, [])

    const resetTranscript = useCallback(() => {
        setTranscript('')
        setInterimTranscript('')
        setLastResultTimestamp(Date.now())
    }, [])

    return {
        isListening,
        isSupported,
        transcript,
        interimTranscript,
        lastResultTimestamp,
        error,
        startListening,
        stopListening,
        pauseForTTS,
        resumeAfterTTS,
        resetTranscript
    }
}

export default useVoiceInput
