import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Hide navbar during interview for full immersion
    if (location.pathname.startsWith('/interview/')) {
        return null;
    }

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to={isAuthenticated ? "/dashboard" : "/"} className="navbar-logo">
                    <span className="logo-sparkle">✨</span>
                    <span className="logo-text">Resuminds</span>
                </Link>

                <div className="navbar-links">
                    {isAuthenticated ? (
                        <>
                            <Link to="/dashboard" className="nav-link">Dashboard</Link>
                            <Link to="/upload" className="nav-link">Practice</Link>
                            <div className="user-profile">
                                <span className="user-name">Hi, {user?.name?.split(' ')?.[0] || 'User'}</span>
                                <button onClick={handleLogout} className="logout-button">
                                    Logout
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link">Login</Link>
                            <Link to="/register" className="nav-link btn-signup">
                                Sign Up Free
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
