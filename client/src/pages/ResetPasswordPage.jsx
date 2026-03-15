import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import authService from '../services/authService'
import Navbar from '../components/common/Navbar'
import './AuthPages.css'

function ResetPasswordPage() {
    const { token } = useParams()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
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
            await authService.resetPassword(token, password)
            setSuccess(true)
            setTimeout(() => navigate('/login'), 3000)
        } catch (err) {
            setError(err.message || 'Failed to reset password. Link may be expired.')
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
                        <h2 className="auth-title">Set New Password</h2>
                        <p className="auth-subtitle">Create a strong password to secure your account.</p>
                    </div>

                    {error && (
                        <div className="auth-alert error-alert animate-fade-in">
                            <span className="alert-icon">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {success ? (
                        <div className="auth-alert success-alert animate-fade-in">
                            <span className="alert-icon">✅</span>
                            <span>Password reset successful! Redirecting to login...</span>
                        </div>
                    ) : (
                        <form className="auth-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="password">New Password</label>
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
                                <label htmlFor="confirmPassword">Confirm New Password</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter password"
                                    required
                                />
                            </div>

                            <button type="submit" className="primary-button auth-submit" disabled={loading}>
                                {loading ? <span className="loading-spinner"></span> : 'Update Password'}
                            </button>
                        </form>
                    )}

                    <p className="auth-footer">
                        <Link to="/login">Back to Login</Link>
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

export default ResetPasswordPage
