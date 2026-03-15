import { useState, useEffect } from 'react';
import './LoadingOverlay.css';

const INTERVIEW_STEPS = [
    { id: 'parse', text: 'Scanning Resume Architecture', icon: '🔍' },
    { id: 'persona', text: 'Calibrating AI Persona', icon: '🤖' },
    { id: 'scenarios', text: 'Synthesizing Interview Scenarios', icon: '⚡' },
    { id: 'ready', text: 'Ready for Launch', icon: '🚀' }
];

const ANALYSIS_STEPS = [
    { id: 'harvest', text: 'Collecting Response Data', icon: '📊' },
    { id: 'sentiment', text: 'Analyzing Sentiment & Tone', icon: '🧠' },
    { id: 'scoring', text: 'Benchmarking Against Standards', icon: '📈' },
    { id: 'report', text: 'Finalizing Performance Report', icon: '📄' }
];

function LoadingOverlay({ isVisible, type = 'interview' }) {
    const STEPS = type === 'interview' ? INTERVIEW_STEPS : ANALYSIS_STEPS;
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (!isVisible) {
            setCurrentStep(0);
            return;
        }

        const interval = setInterval(() => {
            setCurrentStep(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
        }, 2000);

        return () => clearInterval(interval);
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <div className="loading-overlay">
            <div className="loading-content animate-slide-up">
                <div className="ai-brain-container">
                    <div className="brain-core"></div>
                    <div className="brain-ring ring-1"></div>
                    <div className="brain-ring ring-2"></div>
                    <div className="brain-ring ring-3"></div>
                </div>

                <h2 className="loading-title">
                    {type === 'interview' ? 'Initializing Interview' : 'Analyzing Performance'}
                </h2>

                <div className="loading-steps">
                    {STEPS.map((step, index) => (
                        <div
                            key={step.id}
                            className={`loading-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                        >
                            <span className="step-icon">{index < currentStep ? '✅' : step.icon}</span>
                            <span className="step-text">{step.text}</span>
                            {index === currentStep && <div className="step-pulse"></div>}
                        </div>
                    ))}
                </div>

                <div className="loading-progress-bar">
                    <div
                        className="loading-progress-fill"
                        style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
}

export default LoadingOverlay;
