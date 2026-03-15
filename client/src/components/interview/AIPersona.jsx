import React, { useState, useEffect, useRef } from 'react'
import './AIPersona.css'

/**
 * AIPersona - A high-fidelity procedural avatar with lip-sync and life-like animations.
 * @param {string} type - The persona type (tech_lead, mentor, hr_specialist, founder)
 * @param {boolean} isSpeaking - Whether the AI is currently talking
 */
const AIPersona = ({ type = 'tech_lead', isSpeaking = false }) => {
    const [mouthState, setMouthState] = useState(0) // 0: closed, 1: small-mid, 2: wide
    const [blink, setBlink] = useState(false)
    const mouthIntervalRef = useRef(null)

    // Lip sync simulation
    useEffect(() => {
        if (isSpeaking) {
            mouthIntervalRef.current = setInterval(() => {
                setMouthState(Math.floor(Math.random() * 3))
            }, 120)
        } else {
            if (mouthIntervalRef.current) clearInterval(mouthIntervalRef.current)
            setMouthState(0)
        }
        return () => {
            if (mouthIntervalRef.current) clearInterval(mouthIntervalRef.current)
        }
    }, [isSpeaking])

    // Blinking eye simulation
    useEffect(() => {
        const triggerBlink = () => {
            setBlink(true)
            setTimeout(() => setBlink(false), 150)
            const nextBlink = 2000 + Math.random() * 5000
            setTimeout(triggerBlink, nextBlink)
        }
        const timer = setTimeout(triggerBlink, 3000)
        return () => clearTimeout(timer)
    }, [])

    // Get persona colors and features
    const getPersonaConfig = () => {
        switch (type) {
            case 'tech_lead':
                return { skin: '#eec1ad', hair: '#4a3728', accent: '#6366f1', glassColor: 'rgba(255,255,255,0.2)' }
            case 'mentor':
                return { skin: '#d8a48f', hair: '#7c7c7c', accent: '#10b981', glassColor: 'none' }
            case 'hr_specialist':
                return { skin: '#f3d6c1', hair: '#b5835a', accent: '#ec4899', glassColor: 'none' }
            case 'founder':
                return { skin: '#c89673', hair: '#2d2d2d', accent: '#f59e0b', glassColor: 'none' }
            default:
                return { skin: '#eec1ad', hair: '#4a3728', accent: '#6366f1', glassColor: 'none' }
        }
    }

    const config = getPersonaConfig()

    return (
        <div className={`persona-container ${isSpeaking ? 'is-speaking' : ''}`}>
            <svg viewBox="0 0 200 240" className="persona-svg">
                {/* Hair - Back */}
                <path d="M50,100 Q100,20 150,100" fill={config.hair} />

                {/* Shoulders / Torso */}
                <path d="M40,240 Q40,180 100,180 Q160,180 160,240 Z" fill="#2a2a3e" />

                {/* Neck */}
                <rect x="85" y="165" width="30" height="20" fill={config.skin} />

                {/* Face Shape */}
                <path d="M60,100 Q60,180 100,180 Q140,180 140,100 Q140,40 100,40 Q60,40 60,100" fill={config.skin} />

                {/* Hair - Front */}
                <path d="M60,70 Q100,30 140,70 L140,45 Q100,10 60,45 Z" fill={config.hair} />

                {/* Eyes */}
                <g className="eyes">
                    {blink ? (
                        <g>
                            <line x1="75" y1="95" x2="90" y2="95" stroke="#333" strokeWidth="2" />
                            <line x1="110" y1="95" x2="125" y2="95" stroke="#333" strokeWidth="2" />
                        </g>
                    ) : (
                        <g>
                            <circle cx="82" cy="95" r="4" fill="#333" />
                            <circle cx="118" cy="95" r="4" fill="#333" />
                        </g>
                    )}
                </g>

                {/* Glasses (if applicable) */}
                {config.glassColor !== 'none' && (
                    <g className="glasses">
                        <rect x="70" y="85" width="25" height="20" rx="4" fill={config.glassColor} stroke="#333" strokeWidth="1.5" />
                        <rect x="105" y="85" width="25" height="20" rx="4" fill={config.glassColor} stroke="#333" strokeWidth="1.5" />
                        <line x1="95" y1="95" x2="105" y2="95" stroke="#333" strokeWidth="1" />
                    </g>
                )}

                {/* Mouth - The Critical Lip-Sync Part */}
                <g className="mouth">
                    {mouthState === 0 && <path d="M85,145 Q100,147 115,145" stroke="#8b5a41" strokeWidth="2" fill="none" />}
                    {mouthState === 1 && <path d="M85,145 Q100,155 115,145" fill="#8b5a41" opacity="0.8" />}
                    {mouthState === 2 && <ellipse cx="100" cy="150" rx="12" ry="8" fill="#5a3a2a" />}
                </g>

                {/* Pulsing ring while speaking */}
                {isSpeaking && (
                    <circle cx="100" cy="100" r="85" stroke={config.accent} strokeWidth="2" fill="none" opacity="0.3">
                        <animate attributeName="r" from="85" to="95" dur="1s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.3" to="0" dur="1s" repeatCount="indefinite" />
                    </circle>
                )}
            </svg>
        </div>
    )
}

export default AIPersona
