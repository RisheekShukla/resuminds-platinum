const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Authentication Service
 * Handles all API calls related to user accounts
 */
const authService = {
    /**
     * Register a new user
     */
    register: async (userData) => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Registration failed');

        if (data.data.token) {
            localStorage.setItem('resuminds_token', data.data.token);
        }

        return data.data;
    },

    /**
     * Login user
     */
    login: async (credentials) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Login failed');

        if (data.data.token) {
            localStorage.setItem('resuminds_token', data.data.token);
        }

        return data.data;
    },

    /**
     * Get current user profile
     */
    getMe: async () => {
        const token = localStorage.getItem('resuminds_token');
        if (!token) return null;

        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (!data.success) {
            localStorage.removeItem('resuminds_token');
            return null;
        }

        return data.data;
    },

    /**
     * Logout user
     */
    logout: () => {
        localStorage.removeItem('resuminds_token');
    },

    /**
     * Get token from storage
     */
    getToken: () => localStorage.getItem('resuminds_token'),

    /**
     * Forgot Password
     */
    forgotPassword: async (email) => {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Failed to send reset link');
        return data;
    },

    /**
     * Reset Password
     */
    resetPassword: async (token, password) => {
        const response = await fetch(`${API_URL}/auth/reset-password/${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Failed to reset password');
        return data;
    }
};

export default authService;
