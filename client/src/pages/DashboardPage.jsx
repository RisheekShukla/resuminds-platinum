import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/common/Navbar'
import './DashboardPage.css'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    RadialLinearScale,
    Filler
} from 'chart.js'
import { Line, Radar } from 'react-chartjs-2'

// Register ChartJS
ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, RadialLinearScale, Filler
)

const rawApiUrl = import.meta.env.VITE_API_URL || '';
const API_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;

function DashboardPage() {
    const { user } = useAuth()
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalInterviews: 0,
        averageScore: 0,
        topCategory: 'N/A',
        practiceStreak: 0
    })

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        setLoading(true)
        try {
            const response = await fetch(`${API_URL}/history/sessions`)
            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    setSessions(data.data.sessions || [])
                    
                    // If new user, set demo stats for psychological motivation
                    if (!data.data.sessions || data.data.sessions.length === 0) {
                        setStats({
                            totalInterviews: 0,
                            averageScore: 0,
                            topCategory: 'Pending',
                            practiceStreak: 0,
                            isDemo: true
                        })
                    } else {
                        const streak = calculateStreak(data.data.sessions || [])
                        setStats({ ...data.data.stats, practiceStreak: streak })
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch history:', error)
        } finally {
            setLoading(false)
        }
    }

    const calculateStreak = (history) => {
        if (!history || history.length === 0) return 0
        const sortedDates = [...new Set(history.map(s => 
            new Date(s.startedAt).setHours(0,0,0,0)
        ))].sort((a,b) => b - a)

        let streak = 0
        let currentDate = new Date().setHours(0,0,0,0)

        for (let idx = 0; idx < sortedDates.length; idx++) {
            const diffDays = Math.round((currentDate - sortedDates[idx]) / (1000 * 60 * 60 * 24))
            if (diffDays === 0 || diffDays === 1) {
                streak++
                currentDate = sortedDates[idx]
            } else if (diffDays > 1 && idx === 0) {
                return 0 // Streak broken
            } else {
                break
            }
        }
        return streak
    }

    // Chart Data
    const completedSessions = [...sessions].filter(s => s.report).reverse()

    const lineChartData = {
        labels: completedSessions.length > 0 
            ? completedSessions.map(s => new Date(s.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))
            : ['Goal 1', 'Goal 2', 'Goal 3', 'Goal 4', 'Goal 5'],
        datasets: [{
            label: completedSessions.length > 0 ? 'Overall Performance %' : 'Growth Potential',
            data: completedSessions.length > 0 
                ? completedSessions.map(s => s.report.overallScore)
                : [65, 72, 78, 85, 92],
            borderColor: '#818cf8',
            backgroundColor: 'rgba(129, 140, 248, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#818cf8',
            pointBorderColor: '#fff',
            pointRadius: 4,
            pointHoverRadius: 6
        }]
    }

    const radarChartData = {
        labels: ['Technical', 'Communication', 'Problem Solving', 'Resume Focus', 'Job Fit'],
        datasets: [{
            label: completedSessions.length > 0 ? 'Current Mastery' : 'Demo Profile',
            data: completedSessions.length > 0 ? [
                stats?.avgTechnical || 0,
                stats?.avgCommunication || 0,
                stats?.avgProblemSolving || 0,
                stats?.avgResumeAlignment || 0,
                stats?.avgClosenessToJobDescription || 0
            ] : [85, 75, 90, 80, 70],
            backgroundColor: 'rgba(52, 211, 153, 0.2)',
            borderColor: '#34d399',
            borderWidth: 2,
            pointBackgroundColor: '#34d399',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#34d399'
        }]
    }

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#f8fafc',
                bodyColor: '#e2e8f0',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                displayColors: false
            }
        },
        scales: {
            y: { display: false, min: 0, max: 100 },
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        }
    }

    return (
        <div className="dashboard-page">
            <Navbar />
            
            <main className="dashboard-container">
                <header className="dashboard-header animate-fade-in">
                    <div className="welcome-section">
                        <h1 className="welcome-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span>Welcome back, {(user?.name?.split(' ')?.[0] || 'Explorer').slice(0, 15)}{(user?.name?.split(' ')?.[0]?.length > 15 ? '...' : '')}</span>
                            <span style={{ flexShrink: 0 }}>👋</span>
                        </h1>
                        <p className="welcome-subtitle">Here is an overview of your interview progress.</p>
                    </div>
                    <div className="header-actions">
                        <Link to="/upload" className="primary-button new-interview-btn">
                            <span className="btn-icon">+</span> Start New Interview
                        </Link>
                    </div>
                </header>

                {/* Quick Actions (New) */}
                <div className="quick-actions-bar animate-slide-up delay-1">
                    <Link to="/upload" className="quick-action-card">
                        <div className="qa-icon blue">📄</div>
                        <div className="qa-text">
                            <h4>Upload Resume</h4>
                            <p>Update your base profile</p>
                        </div>
                    </Link>
                    <Link to="/upload" className="quick-action-card">
                        <div className="qa-icon green">🎯</div>
                        <div className="qa-text">
                            <h4>Target Role</h4>
                            <p>Practice specific JD</p>
                        </div>
                    </Link>
                    {completedSessions[0] && (
                        <Link to={`/report/${completedSessions[completedSessions.length-1]?._id}`} className="quick-action-card">
                            <div className="qa-icon purple">📊</div>
                            <div className="qa-text">
                                <h4>Last Report</h4>
                                <p>Review previous feedback</p>
                            </div>
                        </Link>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="stats-grid animate-slide-up delay-2">
                    <div className="stat-card glass-panel">
                        <div className="stat-header">
                            <span className="stat-icon">🎤</span>
                            <span className="stat-label">Total Interviews</span>
                        </div>
                        <span className="stat-value">{stats?.totalInterviews || 0}</span>
                    </div>
                    <div className="stat-card glass-panel">
                        <div className="stat-header">
                            <span className="stat-icon">⭐</span>
                            <span className="stat-label">{stats?.isDemo ? 'Target Score' : 'Avg. Score'}</span>
                        </div>
                        <span className="stat-value">{stats?.isDemo ? 85 : stats?.averageScore || 0}<span className="stat-unit">%</span></span>
                    </div>
                    <div className="stat-card glass-panel">
                        <div className="stat-header">
                            <span className="stat-icon">🔥</span>
                            <span className="stat-label">Practice Streak</span>
                        </div>
                        <span className="stat-value">{stats?.practiceStreak || 0}<span className="stat-unit"> d</span></span>
                    </div>
                    <div className="stat-card glass-panel highlight-card">
                        <div className="stat-header">
                            <span className="stat-icon">🏆</span>
                            <span className="stat-label">{stats?.isDemo ? 'Goal Area' : 'Strongest Area'}</span>
                        </div>
                        <span className="stat-value text-md">{stats?.isDemo ? 'Technical' : stats?.topCategory || 'N/A'}</span>
                    </div>
                </div>

                <div className="dashboard-content animate-slide-up delay-3">
                    
                    {/* Main Analytics Area */}
                    <div className="analytics-column">
                        <div className="chart-panel glass-panel">
                            <div className="panel-header">
                                <h3>{completedSessions.length > 0 ? 'Performance Trend' : 'Growth Path (Example)'}</h3>
                                <select className="glass-select">
                                    <option>Last 30 Days</option>
                                    <option>All Time</option>
                                </select>
                            </div>
                            <div className="chart-wrapper">
                                <Line data={lineChartData} options={chartOptions} />
                            </div>
                            {completedSessions.length === 0 && (
                                <div className="demo-overlay-text">
                                    <p>Start your first interview to see real data!</p>
                                </div>
                            )}
                        </div>

                        <div className="chart-panel glass-panel">
                            <div className="panel-header">
                                <h3>{completedSessions.length > 0 ? 'Skill Mastery Radar' : 'Target Skills (Example)'}</h3>
                            </div>
                            <div className="chart-wrapper auto-height">
                                <Radar
                                    data={radarChartData}
                                    options={{
                                        ...chartOptions,
                                        scales: {
                                            r: {
                                                angleLines: { color: 'rgba(255, 255, 255, 0.05)' },
                                                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                                pointLabels: { color: '#94a3b8', font: { size: 12 } },
                                                ticks: { display: false },
                                                suggestedMin: 0,
                                                suggestedMax: 100
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* History Sidebar */}
                    <div className="history-column">
                        <div className="history-panel glass-panel">
                            <div className="panel-header">
                                <h3>Recent Sessions</h3>
                                {sessions.length > 0 && <button className="text-button">View All</button>}
                            </div>

                            <div className="history-list">
                                {loading ? (
                                    <>
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="skeleton-card skeleton-pulse">
                                                <div className="skel-icon"></div>
                                                <div className="skel-details">
                                                    <div className="skel-line w-3/4"></div>
                                                    <div className="skel-line w-1/2"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                ) : sessions.length > 0 ? (
                                    sessions.slice(0, 5).map((session) => (
                                        <div key={session._id} className="history-card">
                                            <div className={`status-indicator ${session.status === 'completed' ? 'success' : 'pending'}`}></div>
                                            <div className="history-details">
                                                <h4>{session.type.charAt(0).toUpperCase() + session.type.slice(1)} Interview</h4>
                                                <p>{new Date(session.startedAt).toLocaleDateString()} • {session.questions?.length || 0} Qs</p>
                                            </div>
                                            {session.status === 'completed' ? (
                                                <div className="history-score">
                                                    <strong>{session.report?.overallScore || 0}</strong>
                                                    <span>Score</span>
                                                </div>
                                            ) : (
                                                <span className="badge-pending">Incomplete</span>
                                            )}
                                            {session.status === 'completed' && (
                                                <Link to={`/report/${session._id}`} className="view-link">→</Link>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-history">
                                        <p>No past interviews found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default DashboardPage
