import { useState, useEffect } from 'react'

/**
 * A component that renders text with a typewriter effect
 */
export function TypewriterText({ text, speed = 30, onFinish = () => { } }) {
    const [displayedText, setDisplayedText] = useState('')
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        // Reset if text changes
        setDisplayedText('')
        setCurrentIndex(0)
    }, [text])

    useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(prev => prev + text[currentIndex])
                setCurrentIndex(prev => prev + 1)
            }, speed)

            return () => clearTimeout(timeout)
        } else if (text.length > 0) {
            onFinish()
        }
    }, [currentIndex, text, speed, onFinish])

    return <span>{displayedText}</span>
}

export default TypewriterText
