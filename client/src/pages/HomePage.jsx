import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/common/Navbar'
import './HomePage.css'

const HomePage = () => {
    const { user } = useAuth()
    const [scrolled, setScrolled] = useState(false)

    // Handle scroll effect for animations
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <div className="home-page">
            <Navbar />

            {/* Hero Section */}
            <main className="container">
                <section className="hero">
                    <div className="hero-grid">
                        <div className="hero-content animate-slide-up">
                            <div className="badge">
                                ✨ Powered by Advanced AI
                            </div>
                            <h1 className="hero-title">
                                Master Your Next <br />
                                <span className="gradient-text">Tech Interview</span>
                            </h1>
                            <p className="hero-description">
                                Experience ultra-realistic voice interviews tailored specifically to your resume and role. Get instant, actionable feedback to land your dream job.
                            </p>
                            <div className="hero-actions">
                                {user ? (
                                    <Link to="/dashboard" className="primary-button">
                                        Go to Dashboard
                                    </Link>
                                ) : (
                                    <Link to="/register" className="primary-button">
                                        Start Free Interview
                                    </Link>
                                )}
                                <a href="#how-it-works" className="secondary-button">
                                    See How It Works
                                </a>
                            </div>

                            <div className="hero-stats">
                                <div className="stat">
                                    <strong>10k+</strong>
                                    <span>Interviews Conducted</span>
                                </div>
                                <div className="stat">
                                    <strong>94%</strong>
                                    <span>Success Rate</span>
                                </div>
                                <div className="stat">
                                    <strong>24/7</strong>
                                    <span>Availability</span>
                                </div>
                            </div>
                        </div>

                        <div className="hero-visual animate-fade-in delay-1">
                            <div className="image-container">
                                <img
                                    src="https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                                    alt="Candidate in interview"
                                    className="floating-img"
                                />
                                <div className="glass-card overlay-card">
                                    <div className="card-header">
                                        <div className="card-dot"></div>
                                        <span className="analyzing">AI Analyzing Response...</span>
                                    </div>
                                    <div className="card-body">
                                        <p className="score">+15 Pts: Good use of STAR method</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section id="how-it-works" className="steps-section">
                    <h2 className="section-title">From Upload to Offer Letter</h2>
                    <div className="steps-container">
                        <div className="step-card glass">
                            <div className="step-number">1</div>
                            <h3>Upload Resume</h3>
                            <p>Drop your PDF or DOCX. Our AI extracts your skills, experience, and projects in seconds.</p>
                        </div>
                        <div className="step-connector"></div>
                        <div className="step-card glass">
                            <div className="step-number">2</div>
                            <h3>Live Voice Interview</h3>
                            <p>Talk naturally with an AI interviewer that asks deep, probing questions based on your background.</p>
                        </div>
                        <div className="step-connector"></div>
                        <div className="step-card glass">
                            <div className="step-number">3</div>
                            <h3>Get Actionable Feedback</h3>
                            <p>Receive a detailed scorecard highlighting strengths, weak points, and specific areas to improve.</p>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="features-section">
                    <h2 className="section-title">Why Top Candidates Use ResuMinds</h2>
                    <div className="features-grid">
                        <div className="feature-card glass">
                            <div className="feature-icon">🎙️</div>
                            <h3>Real Voice Interaction</h3>
                            <p>Practice speaking out loud. Your responses are transcribed and analyzed in real-time.</p>
                        </div>
                        <div className="feature-card glass">
                            <div className="feature-icon">🧠</div>
                            <h3>Adaptive Intelligence</h3>
                            <p>The AI dynamically changes questions based on your previous answers, just like a real human.</p>
                        </div>
                        <div className="feature-card glass">
                            <div className="feature-icon">📊</div>
                            <h3>Deep Analytics</h3>
                            <p>Track your progress over time with visual dashboards and comprehensive performance metrics.</p>
                        </div>
                    </div>
                </section>

                {/* Testimonial Section */}
                <section className="testimonial-section">
                    <div className="testimonial-card glass">
                        <div className="quote-icon">"</div>
                        <p className="quote-text">
                            "The AI asked me a follow-up question about my React project that was exactly what my Google interviewer asked me two weeks later. This tool is insane."
                        </p>
                        <div className="quote-author">
                            <strong>Sarah J.</strong>
                            <span>Frontend Engineer @ Google</span>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="footer-section">
                <div className="container footer-content">
                    <div className="footer-brand">
                        <h2>ResuMinds</h2>
                        <p>Your AI-powered bridge to your dream career.</p>
                    </div>
                    <div className="footer-links">
                        <div className="link-group">
                            <h3>Product</h3>
                            <Link to="/register">Features</Link>
                            <Link to="/register">Pricing</Link>
                            <Link to="/register">Use Cases</Link>
                        </div>
                        <div className="link-group">
                            <h3>Company</h3>
                            <a href="#">About</a>
                            <a href="#">Privacy Policy</a>
                            <a href="#">Terms of Service</a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} ResuMinds. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}

export default HomePage
