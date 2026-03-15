import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/common/Navbar'
import './AuthPages.css'

function RegisterPage() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { register } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            return setError('Passwords do not match.')
        }

        if (password.length < 6) {
            return setError('Password must be at least 6 characters.')
        }

        setLoading(true)

        try {
            await register({ name, email, password })
            navigate('/dashboard')
        } catch (err) {
            setError(err.message || 'Failed to create account.')
        } finally {
            setLoading(false)
        }
    }

    const handleSocialAuth = (provider) => {
        setLoading(true)
        setError('')
        // Simulate OAuth redirect and callback
        setTimeout(() => {
            alert(`${provider} registration simulation successful! Logging you in...`)
            navigate('/dashboard')
        }, 1500)
    }

    return (
        <div className="auth-page">
            <Navbar />
            <div className="auth-container animate-slide-up">
                <div className="glass-card auth-card">
                    <div className="auth-header">
                        <h2 className="auth-title">Create Account</h2>
                        <p className="auth-subtitle">Join ResuMinds and start practicing today</p>
                    </div>

                    {error && (
                        <div className="auth-alert error-alert animate-fade-in">
                            <span className="alert-icon">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min. 6 characters"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? '👁️‍🗨️' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? '👁️‍🗨️' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="primary-button auth-submit" disabled={loading}>
                            {loading ? (
                                <span className="loading-spinner"></span>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>or register with</span>
                    </div>

                    <div className="social-login">
                        <button type="button" className="social-button google-btn" onClick={() => handleSocialAuth('Google')}>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" />
                            Google
                        </button>
                        <button type="button" className="social-button github-btn" onClick={() => handleSocialAuth('GitHub')}>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg" alt="GitHub" />
                            GitHub
                        </button>
                    </div>

                    <p className="auth-footer">
                        Already have an account? <Link to="/login">Log in here</Link>
                    </p>
                </div>
            </div>

            <div className="auth-bg-elements">
                <div className="bg-glow glow-1"></div>
                <div className="bg-glow glow-2"></div>
            </div>
        </div>
    )
}

export default RegisterPage
