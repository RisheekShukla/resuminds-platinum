import { useState } from 'react'
import { Link } from 'react-router-dom'
import authService from '../services/authService'
import Navbar from '../components/common/Navbar'
import './AuthPages.css'

function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setMessage('')
        setLoading(true)

        try {
            await authService.forgotPassword(email)
            setMessage('Password reset link sent! Please check your email (or server logs for demo).')
        } catch (err) {
            setError(err.message || 'Failed to send reset link.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <Navbar />
            <div className="auth-container animate-slide-up">
                <div className="glass-card auth-card">
                    <div className="auth-header">
                        <h2 className="auth-title">Reset Password</h2>
                        <p className="auth-subtitle">Enter your email and we'll send you a link to get back into your account.</p>
                    </div>

                    {error && (
                        <div className="auth-alert error-alert animate-fade-in">
                            <span className="alert-icon">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {message && (
                        <div className="auth-alert success-alert animate-fade-in">
                            <span className="alert-icon">💡</span>
                            <span>{message}</span>
                        </div>
                    )}

                    {!message && (
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
                                />
                            </div>

                            <button type="submit" className="primary-button auth-submit" disabled={loading}>
                                {loading ? <span className="loading-spinner"></span> : 'Send Reset Link'}
                            </button>
                        </form>
                    )}

                    <p className="auth-footer">
                        Remember your password? <Link to="/login">Back to Login</Link>
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

export default ForgotPasswordPage
