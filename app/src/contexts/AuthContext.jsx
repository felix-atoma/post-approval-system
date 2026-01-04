import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tokenExpiry, setTokenExpiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const navigate = useNavigate();
  const refreshInProgress = useRef(false);

  /* =========================
     TOKEN REFRESH (SINGLE)
  ========================== */
  const refreshToken = useCallback(async () => {
    // Prevent multiple simultaneous refresh attempts
    if (refreshInProgress.current) {
      console.log('⏳ Refresh already in progress, skipping...');
      return true;
    }

    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) {
      console.log('❌ No refresh token found');
      return false;
    }

    try {
      refreshInProgress.current = true;
      console.log('🔄 Refreshing token...');

      const res = await api.post('/auth/refresh-token', {
        refreshToken: storedRefreshToken
      });

      const { accessToken, refreshToken: newRefreshToken } = res.data;

      // Check if we got a valid response
      if (!accessToken) {
        console.error('❌ No access token in response');
        return false;
      }

      // Store tokens
      localStorage.setItem('token', accessToken);
      
      // Store the NEW refresh token if provided
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
        console.log('✅ New refresh token stored');
      }

      // Update token expiry
      const decoded = jwtDecode(accessToken);
      setTokenExpiry(decoded.exp);

      console.log('✅ Token refresh successful');
      return true;
    } catch (err) {
      console.error('❌ Refresh token failed:', err);
      
      // If refresh token is invalid, logout
      if (err.response?.status === 401) {
        logout();
      }
      
      return false;
    } finally {
      refreshInProgress.current = false;
    }
  }, []);

  /* =========================
     INIT AUTH ON APP LOAD
  ========================== */
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const decoded = jwtDecode(token);
          const now = Date.now() / 1000;

          // If token is expired, try to refresh
          if (decoded.exp < now) {
            const refreshed = await refreshToken();
            if (!refreshed) {
              logout();
              return;
            }
          } else {
            // Token is valid, set state
            setUser(JSON.parse(storedUser));
            setTokenExpiry(decoded.exp);
          }
        } catch (err) {
          console.error('Auth init failed:', err);
          logout();
          return;
        }
      }

      setLoading(false);
    };

    initAuth();
  }, [refreshToken]);

  /* =========================
     AUTO REFRESH BEFORE EXPIRY
  ========================== */
  useEffect(() => {
    if (!tokenExpiry) return;

    const interval = setInterval(async () => {
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = tokenExpiry - now;
      
      // Refresh if token expires in less than 2 minutes
      if (timeLeft < 120 && timeLeft > 0) {
        console.log(`⏰ Token expiring in ${timeLeft}s, refreshing...`);
        await refreshToken();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [tokenExpiry, refreshToken]);

  /* =========================
     LOGIN FUNCTION
  ========================== */
  const login = async (email, password) => {
    try {
      setLoading(true);
      setAuthError(null);

      const cleanEmail = email.trim().toLowerCase();

      const res = await api.post('/auth/login', {
        email: cleanEmail,
        password
      });

      // ✅ Check for password reset flow
      if (res.data?.passwordReset === true || res.data?.code === 'PASSWORD_RESET_REQUIRED') {
        // Store user info for password creation
        const userId = res.data?.userId || res.data?.user?.id;
        const userEmail = cleanEmail;
        
        // Store in sessionStorage (more secure than localStorage for this)
        sessionStorage.setItem('setupUserId', userId);
        sessionStorage.setItem('setupEmail', userEmail);
        
        // Use toast() instead of toast.info()
        toast('Please create your permanent password');
        navigate('/create-password');
        return res.data;
      }

      const { accessToken, refreshToken, user } = res.data;

      // Store tokens and user info
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      // Update state
      const decoded = jwtDecode(accessToken);
      setTokenExpiry(decoded.exp);
      setUser(user);
      setLoading(false);

      toast.success('Login successful');

      // Navigate based on role
      if (user.role === 'ADMIN' || user.role === 'EDITOR') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }

      return res.data;
    } catch (err) {
      setLoading(false);
      
      // Check if it's a password reset error from backend
      if (err.response?.data?.passwordReset === true) {
        // Store user info for password creation
        const userId = err.response?.data?.userId;
        const userEmail = email;
        
        sessionStorage.setItem('setupUserId', userId);
        sessionStorage.setItem('setupEmail', userEmail);
        
        toast('Please create your permanent password');
        navigate('/create-password');
        return;
      }

      const msg = err.response?.data?.error?.message ||
                  err.response?.data?.message ||
                  err.message ||
                  'Login failed';

      setAuthError(msg);
      toast.error(msg);
      throw err;
    }
  };

  /* =========================
     CREATE PASSWORD FUNCTION
  ========================== */
  const createPassword = async (userId, password) => {
    try {
      setLoading(true);
      
      // Use the provided userId or get from sessionStorage
      const finalUserId = userId || sessionStorage.getItem('setupUserId');
      
      if (!finalUserId) {
        throw new Error('No user ID found for password setup');
      }

      const res = await api.post('/auth/create-password', {
        userId: finalUserId,
        password
      });

      const { accessToken, refreshToken, user } = res.data;

      // Store tokens and user info
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      // Clear session storage
      sessionStorage.removeItem('setupUserId');
      sessionStorage.removeItem('setupEmail');

      // Update state
      const decoded = jwtDecode(accessToken);
      setTokenExpiry(decoded.exp);
      setUser(user);
      setLoading(false);

      toast.success('Password created successfully! Welcome!');

      // Navigate based on role
      if (user.role === 'ADMIN' || user.role === 'EDITOR') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }

      return res.data;
    } catch (err) {
      setLoading(false);
      
      const msg = err.response?.data?.error?.message ||
                  err.response?.data?.message ||
                  err.message ||
                  'Failed to create password';
      
      toast.error(msg);
      throw err;
    }
  };

  /* =========================
     LOGOUT FUNCTION
  ========================== */
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Reset state
      setUser(null);
      setTokenExpiry(null);
      setAuthError(null);
      setLoading(false);
      
      // Navigate to login
      navigate('/login');
    }
  };

  /* =========================
     CLEAR AUTH ERROR
  ========================== */
  const clearAuthError = () => {
    setAuthError(null);
  };

  const value = {
    user,
    loading,
    authError,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isEditor: user?.role === 'EDITOR',
    login,
    createPassword,
    logout,
    refreshToken,
    clearAuthError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};