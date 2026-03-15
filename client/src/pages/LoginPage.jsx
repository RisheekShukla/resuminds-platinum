import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/common/Navbar'
import './AuthPages.css'

function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await login({ email, password })
            navigate('/dashboard')
        } catch (err) {
            setError(err.message || 'Failed to login. Please check your credentials.')
        } finally {
            setLoading(false)
        }
    }

    const handleSocialAuth = (provider) => {
        setLoading(true)
        setError('')
        // Simulate OAuth redirect and callback
        setTimeout(() => {
            alert(`${provider} login simulation successful! Logging you in...`)
            // In a real app, this would redirect to backend OAuth route
            // For now, let's just use the demo login if it fails in production
            navigate('/dashboard')
        }, 1500)
    }

    return (
        <div className="auth-page">
            <Navbar />
            <div className="auth-container animate-slide-up">
                <div className="glass-card auth-card">
                    <div className="auth-header">
                        <h2 className="auth-title">Welcome Back</h2>
                        <p className="auth-subtitle">Log in to continue your interview practice</p>
                    </div>

                    {error && (
                        <div className="auth-alert error-alert animate-fade-in">
                            <span className="alert-icon">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                required
                                className={error ? 'input-error' : ''}
                            />
                        </div>

                        <div className="form-group">
                            <div className="label-row">
                                <label htmlFor="password">Password</label>
                                <a href="#forgot" className="forgot-link">Forgot password?</a>
                            </div>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className={error ? 'input-error' : ''}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? '👁️‍🗨️' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="primary-button auth-submit" disabled={loading}>
                            {loading ? (
                                <span className="loading-spinner"></span>
                            ) : (
                                'Log In'
                            )}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>or continue with</span>
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
                        Don't have an account? <Link to="/register">Sign up for free</Link>
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

export default LoginPage
