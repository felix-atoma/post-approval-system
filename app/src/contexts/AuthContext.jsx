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
  /* =========================
   TOKEN REFRESH (SINGLE)
========================== */
const refreshToken = useCallback(async () => {
  // ✅ ADD: Prevent multiple simultaneous refresh attempts
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
    console.log('🔄 Refreshing token...'); // ✅ ADD: Debug log

    const res = await api.post('/auth/refresh-token', {
      refreshToken: storedRefreshToken
    });

    const { accessToken, refreshToken: newRefreshToken } = res.data;

    // ✅ ADD: Check if we got a valid response
    if (!accessToken) {
      console.error('❌ No access token in response');
      return false;
    }

    localStorage.setItem('token', accessToken);
    
    // ✅ CRITICAL: Store the NEW refresh token
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
      console.log('✅ New refresh token stored'); // ✅ ADD: Debug log
    }

    const decoded = jwtDecode(accessToken);
    setTokenExpiry(decoded.exp);

    // ✅ CHANGE: Don't update user state - prevents unnecessary re-renders
    // const storedUser = localStorage.getItem('user');
    // if (storedUser) {
    //   setUser(JSON.parse(storedUser));
    // }

    console.log('✅ Token refresh successful'); // ✅ ADD: Debug log

    return true;
  } catch (err) {
    console.error('❌ Refresh token failed:', err);
    return false;
  } finally {
    refreshInProgress.current = false;
  }
}, []);

/* =========================
   AUTO REFRESH BEFORE EXPIRY
========================== */
useEffect(() => {
  if (!tokenExpiry) return;

  const interval = setInterval(async () => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = tokenExpiry - now;
    
    // ✅ ADD: Better logging and check
    if (timeLeft < 120 && timeLeft > 0) {
      console.log(`⏰ Token expiring in ${timeLeft}s, refreshing...`);
      await refreshToken();
    }
  }, 30000); // Check every 30 seconds

  return () => clearInterval(interval);
}, [tokenExpiry, refreshToken]);

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

          if (decoded.exp < now) {
            const refreshed = await refreshToken();
            if (!refreshed) {
              logout();
              return;
            }
          }

          setUser(JSON.parse(storedUser));
          setTokenExpiry(decoded.exp);
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
      if (tokenExpiry - now < 120) {
        await refreshToken();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [tokenExpiry, refreshToken]);

  /* =========================
     LOGIN
  ========================== */
  const login = async (email, password) => {
    try {
      setAuthError(null);

      const cleanEmail = email.trim().toLowerCase();

      const res = await api.post('/auth/login', {
        email: cleanEmail,
        password
      });

      // Password reset flow
      if (res.data.passwordReset || res.data.code === 'PASSWORD_RESET_REQUIRED') {
        localStorage.setItem('pendingUserId', res.data.userId);
        localStorage.setItem('pendingUser', JSON.stringify(res.data.user || {}));
        navigate('/create-password');
        toast.info('Please set your password');
        return;
      }

      const { accessToken, refreshToken, user } = res.data;

      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      const decoded = jwtDecode(accessToken);
      setTokenExpiry(decoded.exp);
      setUser(user);

      toast.success('Login successful');

      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }

      return res.data;
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.message ||
        'Login failed';

      setAuthError(msg);
      toast.error(msg);
      throw err;
    }
  };

  /* =========================
     CREATE PASSWORD
  ========================== */
  const createPassword = async (password) => {
    try {
      const userId = localStorage.getItem('pendingUserId');
      if (!userId) throw new Error('No pending password setup');

      const res = await api.post('/auth/create-password', {
        userId,
        password
      });

      const { accessToken, refreshToken, user } = res.data;

      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      const decoded = jwtDecode(accessToken);
      setTokenExpiry(decoded.exp);
      setUser(user);

      localStorage.removeItem('pendingUserId');
      localStorage.removeItem('pendingUser');

      toast.success('Password set successfully');

      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to set password');
      throw err;
    }
  };

  /* =========================
     LOGOUT
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
      localStorage.clear();
      setUser(null);
      setTokenExpiry(null);
      setAuthError(null);
      navigate('/login');
    }
  };

  const value = {
    user,
    loading,
    authError,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    login,
    createPassword,
    logout,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
