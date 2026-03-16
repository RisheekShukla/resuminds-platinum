import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * useVoiceInput — Bullet-proof voice input hook (v4)
 * 
 * Major Architecture Update:
 * 1. Intent-Based UI: State tracks whether the user *wants* to listen.
 * 2. Exponential Backoff Scheduler: Dampens rapid restart loops.
 * 3. TTS Locking: Explicit preventions for restart during AI speech.
 * 4. Silent Failure Detection: Combined start-timeout and dead-result detection.
 */
export function useVoiceInput(options = {}) {
    const {
        interimResults = true,
        language = 'en-US',
        onResult = () => {},
        onError = () => {},
    } = options

    // --- State: Drives the UI ---
    const [isListening, setIsListening] = useState(false) // This now represents "Intent/UI State"
    const [transcript, setTranscript] = useState('')
    const [interimTranscript, setInterimTranscript] = useState('')
    const [isSupported, setIsSupported] = useState(false)
    const [error, setError] = useState(null)
    const [lastResultTimestamp, setLastResultTimestamp] = useState(Date.now())

    // --- Refs: Engine Logic ---
    const recognitionRef = useRef(null)
    const shouldListenRef = useRef(false)  // Intent
    const isSpeakingRef = useRef(false)    // TTS Lock
    const fatalErrorRef = useRef(false)    // Permanent blockage
    const restartTimerRef = useRef(null)   // Scheduler
    const startTimeoutRef = useRef(null)   // Detects silent starts
    const restartDelayRef = useRef(300)    // Backoff state
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
        setIsListening(false)
        cleanupTimers()
        try { recognitionRef.current.stop() } catch (e) {}
        callbacksRef.current.onError(code)
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
            recognition.continuous = false
            recognition.interimResults = interimResults
            recognition.lang = language
            recognition.maxAlternatives = 1

            recognition.onstart = () => {
                console.log('[VoiceInput] ✅ Service Connected')
                if (startTimeoutRef.current) {
                    clearTimeout(startTimeoutRef.current)
                    startTimeoutRef.current = null
                }
                // Only on success do we reset the restart delay
                restartDelayRef.current = 300 
                fatalErrorRef.current = false
                setError(null)
                setLastResultTimestamp(Date.now())
            }

            recognition.onend = () => {
                const shouldRestart = shouldListenRef.current && !isSpeakingRef.current && !fatalErrorRef.current
                console.log(`[VoiceInput] Session Ended. Should Restart: ${shouldRestart}`)

                if (shouldRestart) {
                    // Centralized Scheduler with Backoff
                    if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
                    
                    restartTimerRef.current = setTimeout(() => {
                        if (shouldListenRef.current && !isSpeakingRef.current && recognitionRef.current) {
                            try {
                                recognitionRef.current.start()
                                // Update backoff for next time
                                restartDelayRef.current = Math.min(restartDelayRef.current * 1.5, 2000)
                            } catch (err) {
                                if (!err.message?.includes('already started')) {
                                    console.warn('[VoiceInput] Buffered restart skipped:', err.message)
                                }
                            }
                        }
                    }, restartDelayRef.current)
                }
            }

            recognition.onerror = (event) => {
                if (startTimeoutRef.current) {
                    clearTimeout(startTimeoutRef.current)
                    startTimeoutRef.current = null
                }

                console.warn(`[VoiceInput] Engine Error: ${event.error}`)

                switch (event.error) {
                    case 'no-speech':
                        // Non-fatal, let onend handle the loop
                        return
                    case 'audio-capture':
                        handleFatalError('Mic not found.', 'audio-capture')
                        break
                    case 'not-allowed':
                        handleFatalError('Mic access denied.', 'not-allowed')
                        break
                    case 'network':
                        // Transient in v4: we don't kill the loop, let it backoff
                        setError('Speech service connection issue. Retrying...')
                        restartDelayRef.current = 2000 // Force long backoff
                        break
                    case 'aborted':
                        // Result of manual stop()
                        break
                    default:
                        // Other errors: allow 1 retry then force fatal if immediate
                        if (restartDelayRef.current > 1500) {
                            handleFatalError('Speech service error. Please type answers.', event.error)
                        }
                }
            }

            recognition.onresult = (event) => {
                let finalText = ''
                let interim = ''
                setLastResultTimestamp(Date.now())
                
                // Decay backoff on results
                restartDelayRef.current = Math.max(300, restartDelayRef.current - 200)

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
                try { recognitionRef.current.stop() } catch (e) {}
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

        try {
            recognitionRef.current.start()

            // Safety Net for Silent Failures
            if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current)
            startTimeoutRef.current = setTimeout(() => {
                if (shouldListenRef.current && !isListening) {
                   console.warn('[VoiceInput] ⏰ Mic failed to respond to start()')
                   handleFatalError('Mic initialization timed out.', 'timeout')
                }
            }, 3500)
        } catch (err) {
            if (!err.message?.includes('already started')) {
                console.error('[VoiceInput] Manual Start Error:', err)
            }
        }
    }, [isListening])

    const stopListening = useCallback(() => {
        console.log('[VoiceInput] User Intent: STOP')
        shouldListenRef.current = false
        setIsListening(false)
        cleanupTimers()
        if (recognitionRef.current) {
            try { recognitionRef.current.stop() } catch (e) {}
        }
    }, [])

    const pauseForTTS = useCallback(() => {
        console.log('[VoiceInput] TTS Lock: ON')
        isSpeakingRef.current = true
        if (recognitionRef.current) {
            try { recognitionRef.current.stop() } catch (e) {}
        }
    }, [])

    const resumeAfterTTS = useCallback(() => {
        console.log('[VoiceInput] TTS Lock: OFF')
        isSpeakingRef.current = false
        if (shouldListenRef.current) {
            startListening()
        }
    }, [startListening])

    const resetTranscript = useCallback(() => {
        setTranscript('')
        setInterimTranscript('')
        setLastResultTimestamp(Date.now())
    }, [])

    return {
        isListening,    // Intent-based
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
