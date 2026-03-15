import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * useVoiceInput — Bullet-proof voice input hook (v3)
 *
 * Key principle: NEVER trust the browser to fire events reliably.
 * Uses a startTimeout to detect silent failures where start() doesn't 
 * throw but also never fires onstart/onerror.
 */
export function useVoiceInput(options = {}) {
    const {
        interimResults = true,
        language = 'en-US',
        onResult = () => {},
        onError = () => {},
    } = options

    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [interimTranscript, setInterimTranscript] = useState('')
    const [isSupported, setIsSupported] = useState(false)
    const [error, setError] = useState(null)
    const [lastResultTimestamp, setLastResultTimestamp] = useState(Date.now())

    const recognitionRef = useRef(null)
    const isListeningRef = useRef(false)
    const fatalErrorRef = useRef(false)
    const restartTimerRef = useRef(null)
    const startTimeoutRef = useRef(null)       // NEW: detects silent start failures
    const callbacksRef = useRef({ onResult, onError })
    const restartCountRef = useRef(0)

    useEffect(() => {
        callbacksRef.current = { onResult, onError }
    }, [onResult, onError])

    // One-time setup
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        setIsSupported(!!SpeechRecognition)

        if (!SpeechRecognition) {
            console.warn('[VoiceInput] SpeechRecognition not supported')
            setError('Voice input not supported in this browser. Use the text box to answer.')
            return
        }

        const createRecognition = () => {
            const recognition = new SpeechRecognition()
            recognition.continuous = false
            recognition.interimResults = interimResults
            recognition.lang = language
            recognition.maxAlternatives = 1

            recognition.onstart = () => {
                console.log('[VoiceInput] ✅ Recognition started')
                // Clear start timeout — we successfully started!
                if (startTimeoutRef.current) {
                    clearTimeout(startTimeoutRef.current)
                    startTimeoutRef.current = null
                }
                setIsListening(true)
                isListeningRef.current = true
                fatalErrorRef.current = false
                setLastResultTimestamp(Date.now())
                setError(null)
                restartCountRef.current = 0
            }

            recognition.onend = () => {
                console.log('[VoiceInput] Recognition ended. fatal:', fatalErrorRef.current, 'shouldListen:', isListeningRef.current)

                if (fatalErrorRef.current) {
                    setIsListening(false)
                    isListeningRef.current = false
                    return
                }

                if (isListeningRef.current) {
                    restartCountRef.current += 1
                    if (restartCountRef.current > 10) {
                        console.error('[VoiceInput] Too many restarts')
                        setIsListening(false)
                        isListeningRef.current = false
                        setError('Mic stopped responding. Use the text box or click mic to retry.')
                        return
                    }
                    const delay = Math.min(restartCountRef.current * 300, 2000)
                    if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
                    restartTimerRef.current = setTimeout(() => {
                        if (isListeningRef.current && recognitionRef.current && !fatalErrorRef.current) {
                            try {
                                recognitionRef.current.start()
                            } catch (err) {
                                if (!err.message?.includes('already started')) {
                                    console.error('[VoiceInput] Restart failed:', err.message)
                                    setIsListening(false)
                                    isListeningRef.current = false
                                    setError('Mic restart failed. Use the text box.')
                                }
                            }
                        }
                    }, delay)
                } else {
                    setIsListening(false)
                }
            }

            recognition.onerror = (event) => {
                console.error('[VoiceInput] Error:', event.error)
                if (startTimeoutRef.current) {
                    clearTimeout(startTimeoutRef.current)
                    startTimeoutRef.current = null
                }

                switch (event.error) {
                    case 'no-speech':
                        return  // Soft — onend will restart
                    case 'aborted':
                        return  // Normal stop()
                    case 'audio-capture':
                        setError('No microphone found. Check mic is connected.')
                        fatalErrorRef.current = true
                        break
                    case 'not-allowed':
                        setError('Mic access denied. Allow in browser settings.')
                        fatalErrorRef.current = true
                        break
                    case 'network':
                        console.warn('[VoiceInput] Network error (transient). Will attempt restart.')
                        setError('Speech service connection issue. Retrying...')
                        fatalErrorRef.current = false // Make non-fatal to allow onend to restart
                        break
                    default:
                        setError(`Speech error: ${event.error}. Use text box.`)
                        fatalErrorRef.current = true
                }

                setIsListening(false)
                isListeningRef.current = false
                callbacksRef.current.onError(event.error)
            }

            recognition.onresult = (event) => {
                let finalText = ''
                let interim = ''
                setLastResultTimestamp(Date.now())
                restartCountRef.current = 0

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i]
                    if (result.isFinal) {
                        finalText += result[0].transcript + ' '
                    } else {
                        interim += result[0].transcript
                    }
                }

                if (finalText) {
                    console.log('[VoiceInput] Final:', finalText.trim())
                    setTranscript(prev => prev + finalText)
                    callbacksRef.current.onResult(finalText.trim())
                }
                setInterimTranscript(interim)
            }

            return recognition
        }

        recognitionRef.current = createRecognition()

        return () => {
            if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
            if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current)
            isListeningRef.current = false
            if (recognitionRef.current) {
                try { recognitionRef.current.stop() } catch (e) { /* ignore */ }
            }
        }
    }, [interimResults, language])

    const startListening = useCallback(() => {
        if (!recognitionRef.current) {
            setError('Speech recognition not available. Use the text box.')
            return
        }

        console.log('[VoiceInput] startListening() called')
        fatalErrorRef.current = false
        setError(null)
        setInterimTranscript('')
        setLastResultTimestamp(Date.now())
        isListeningRef.current = true
        restartCountRef.current = 0

        try {
            recognitionRef.current.start()

            // ** SAFETY NET ** 
            // If onstart doesn't fire within 3 seconds, assume silent failure.
            // This catches cases where start() doesn't throw but also never triggers events.
            if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current)
            startTimeoutRef.current = setTimeout(() => {
                if (!fatalErrorRef.current && isListeningRef.current) {
                    // Check: did onstart ever fire? If isListening is still false, it didn't.
                    // But we can't read React state here, so check if recognition is actually active
                    console.warn('[VoiceInput] ⏰ Start timeout — mic may have failed silently')
                    fatalErrorRef.current = true
                    isListeningRef.current = false
                    setIsListening(false)
                    setError('Mic failed to start. Use the text box to type your answers.')
                    callbacksRef.current.onError('timeout')
                    try { recognitionRef.current.stop() } catch (e) { /* ignore */ }
                }
            }, 3000)

        } catch (err) {
            if (err.message?.includes('already started')) {
                setIsListening(true)
                return
            }
            console.error('[VoiceInput] Start error:', err)
            setError('Could not start mic. Use the text box.')
            isListeningRef.current = false
            fatalErrorRef.current = true
            callbacksRef.current.onError('start-failed')
        }
    }, [])

    const stopListening = useCallback(() => {
        console.log('[VoiceInput] stopListening() called')
        isListeningRef.current = false
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
        if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current)
        if (recognitionRef.current) {
            try { recognitionRef.current.stop() } catch (e) { /* ignore */ }
        }
        setIsListening(false)
        setInterimTranscript('')
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
        resetTranscript,
    }
}

export default useVoiceInput
