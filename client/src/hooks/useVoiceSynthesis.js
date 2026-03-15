import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Custom hook for AI voice synthesis using Web Speech API
 * 
 * KNOWN BROWSER BUG FIX:
 * Chrome/Chromium pauses speechSynthesis after ~15s of continuous speech.
 * We use a keepalive interval that calls synth.resume() every 10s to prevent this.
 * This is why some questions were getting "cut off" mid-sentence.
 */
export function useVoiceSynthesis() {
    const [speaking, setSpeaking] = useState(false)
    const [supported, setSupported] = useState(false)
    const [voices, setVoices] = useState([])
    const synthRef = useRef(window.speechSynthesis)
    const utteranceRef = useRef(null)
    const keepAliveRef = useRef(null)
    const safetyTimeoutRef = useRef(null)

    // Load voices
    useEffect(() => {
        if (!window.speechSynthesis) return

        setSupported(true)

        const updateVoices = () => {
            const availableVoices = synthRef.current.getVoices()
            setVoices(availableVoices)
            if (availableVoices.length > 0) {
                console.log('🔊 Available voices:', availableVoices.map(v => `${v.name} (${v.lang})`).join(', '))
            }
        }

        updateVoices()
        if (synthRef.current.onvoiceschanged !== undefined) {
            synthRef.current.onvoiceschanged = updateVoices
        }

        return () => {
            if (synthRef.current.onvoiceschanged !== undefined) {
                synthRef.current.onvoiceschanged = null
            }
            if (keepAliveRef.current) clearInterval(keepAliveRef.current)
            if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current)
        }
    }, [])

    /**
     * Start the keepalive interval to prevent Chrome from pausing speech.
     * This is the fix for the "reads only half the question" bug.
     */
    const startKeepAlive = useCallback(() => {
        if (keepAliveRef.current) clearInterval(keepAliveRef.current)
        keepAliveRef.current = setInterval(() => {
            if (synthRef.current.speaking) {
                synthRef.current.pause()
                synthRef.current.resume()
            }
        }, 10000) // every 10 seconds
    }, [])

    const stopKeepAlive = useCallback(() => {
        if (keepAliveRef.current) {
            clearInterval(keepAliveRef.current)
            keepAliveRef.current = null
        }
    }, [])

    const speak = useCallback((text, options = {}) => {
        if (!supported || !text || !text.trim()) return

        // Cancel previous speaking if there is any (unconditional cancel breaks Safari)
        if (synthRef.current.speaking || synthRef.current.pending) {
            synthRef.current.cancel()
        }
        stopKeepAlive()
        if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current)

        const {
            rate = 1.0,
            pitch = 1.0,
            volume = 1,
        } = options

        const utterance = new SpeechSynthesisUtterance(text.trim())
        utterance.rate = rate
        utterance.pitch = pitch
        utterance.volume = volume

        // Voice selection — prioritize sweet/natural sounding voices
        const preferredVoices = [
            'Samantha',                // macOS — sweet, natural female
            'Karen',                   // macOS — Australian female
            'Daniel',                  // macOS — British male
            'Microsoft Aria Online',   // Windows — high quality female
            'Google US English',       // Chrome — standard neural
            'Microsoft Neerja Online', // Premium Indian
        ]

        const availableVoices = synthRef.current.getVoices()

        // 1. Exact match from preferred list
        let selectedVoice = availableVoices.find(v =>
            preferredVoices.some(p => v.name.includes(p)) && v.lang.startsWith('en')
        )

        // 2. Any premium/neural voice
        if (!selectedVoice) {
            selectedVoice = availableVoices.find(v =>
                (v.name.includes('Online') || v.name.includes('Premium') || v.name.includes('Neural') || v.name.includes('Enhanced')) &&
                v.lang.startsWith('en')
            )
        }

        // 3. Any English voice
        if (!selectedVoice) {
            selectedVoice = availableVoices.find(v => v.lang.startsWith('en'))
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice
            console.log(`🔊 Speaking with voice: ${selectedVoice.name} (${selectedVoice.lang})`)
        }

        // Event handlers
        utterance.onstart = () => {
            console.log('🔊 Speech started (onstart)')
            setSpeaking(true) // Ensure it's true
            startKeepAlive()
        }
        utterance.onend = () => {
            console.log('🔊 Speech finished (onend)')
            setSpeaking(false)
            stopKeepAlive()
            if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current)
        }
        utterance.onerror = (e) => {
            if (e.error !== 'interrupted') {
                console.warn('🔊 Speech error:', e.error)
            }
            setSpeaking(false)
            stopKeepAlive()
            if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current)
        }

        // Safety timeout: if onend never fires, force-reset speaking state
        // Estimate ~100ms per character at rate 1.0, with 3s buffer
        const estimatedDuration = Math.max((text.length * 100) / rate + 3000, 5000)
        safetyTimeoutRef.current = setTimeout(() => {
            if (synthRef.current.speaking || speaking) {
                console.warn('🔊 Safety timeout: forcing speech end')
                synthRef.current.cancel()
            }
            setSpeaking(false)
            stopKeepAlive()
        }, estimatedDuration)

        utteranceRef.current = utterance
        
        // **SYNCHRONOUS STATE UPDATE**
        // Some browsers delay or drop `onstart` even with user interaction.
        // We set speaking to true immediately so the mic doesn't auto-start
        // before the voice has a chance to begin.
        setSpeaking(true)
        synthRef.current.speak(utterance)
        
        // If synthesis is broken and doesn't actually start speaking within 1s,
        // we should fallback the state so it doesn't get stuck forever.
        setTimeout(() => {
            if (!synthRef.current.speaking && !synthRef.current.pending) {
                console.warn('🔊 Speech API failed to initialize after 1s. Clearing state.');
                setSpeaking(false);
            }
        }, 1500); // Give it a generous 1.5s
    }, [supported, startKeepAlive, stopKeepAlive])

    const stop = useCallback(() => {
        synthRef.current.cancel()
        setSpeaking(false)
        stopKeepAlive()
    }, [stopKeepAlive])

    return {
        speak,
        stop,
        speaking,
        supported,
        voices
    }
}

export default useVoiceSynthesis
