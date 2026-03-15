import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import UploadPage from './pages/UploadPage'
import InterviewPage from './pages/InterviewPage'
import PreInterviewLobby from './pages/PreInterviewLobby'
import ReportPage from './pages/ReportPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import Navbar from './components/common/Navbar'
import { useAuth } from './context/AuthContext'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) return <div>Loading...</div>;
    if (!isAuthenticated) return <Navigate to="/login" />;

    return children;
};

function AppRoutes() {
    const { isAuthenticated } = useAuth();
    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={
                    isAuthenticated ? <Navigate to="/dashboard" /> : <HomePage />
                } />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                } />
                <Route path="/upload" element={
                    <ProtectedRoute>
                        <UploadPage />
                    </ProtectedRoute>
                } />
                <Route path="/lobby/:sessionId" element={
                    <ProtectedRoute>
                        <PreInterviewLobby />
                    </ProtectedRoute>
                } />
                <Route path="/interview/:sessionId" element={
                    <ProtectedRoute>
                        <InterviewPage />
                    </ProtectedRoute>
                } />
                <Route path="/report/:sessionId" element={
                    <ProtectedRoute>
                        <ReportPage />
                    </ProtectedRoute>
                } />
            </Routes>
        </>
    )
}

export default AppRoutes
