import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import { toast } from 'react-hot-toast';

export default function Header() {
  const { user, logout, isAdmin, refreshToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const prevLocationRef = useRef(location);

  // Calculate time remaining from localStorage
  const calculateTimeRemaining = useCallback(() => {
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    if (tokenExpiry) {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, parseInt(tokenExpiry) - now);
      return remaining;
    }
    return 300; // Default 5 minutes
  }, []);

  // Safe refresh token function
  const refreshTokenSafely = useCallback(async () => {
    try {
      if (refreshToken && typeof refreshToken === 'function') {
        await refreshToken();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  }, [refreshToken]);

  // Token expiry countdown timer
  useEffect(() => {
    if (!user) return;

    // Update immediately
    setTimeRemaining(calculateTimeRemaining());

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      // Show warning at 60 seconds remaining
      if (remaining === 60) {
        toast.warning('Your session will expire in 1 minute. Activity will refresh your session.');
      }

      // Auto-logout when token expires
      if (remaining === 0) {
        toast.error('Session expired. Please login again.');
        logout();
        navigate('/login');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, logout, navigate, calculateTimeRemaining]);

  // Refresh token on route changes (using location change detection)
  useEffect(() => {
    if (!user) return;

    // Check if location changed
    if (prevLocationRef.current !== location) {
      refreshTokenSafely();
      prevLocationRef.current = location;
    }
  }, [location, user, refreshTokenSafely]);

  // Activity detection for token refresh
  useEffect(() => {
    if (!user) return;

    const handleActivity = async () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      
      // Refresh token if it's been more than 30 seconds since last activity
      // This prevents too frequent refresh calls
      if (timeSinceLastActivity > 30000) { // 30 seconds
        await refreshTokenSafely();
        setLastActivity(now);
      }
    };

    // Add event listeners for user activity
    const activities = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
    
    activities.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      activities.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user, lastActivity, refreshTokenSafely]);

  // Refresh token on component mount
  useEffect(() => {
    if (user) {
      refreshTokenSafely();
    }
  }, [user, refreshTokenSafely]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isActiveRoute = (path) => {
    if (path === '/admin' && location.pathname.startsWith('/admin')) return true;
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path === '/posts/create' && location.pathname === '/posts/create') return true;
    return location.pathname === path;
  };

  const getWelcomeMessage = () => {
    if (!user) return '';
    
    if (user.passwordReset) {
      return 'Please create your password';
    }
    
    return `Welcome, ${user.name || user.email}`;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div 
              className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
              title="Go to dashboard"
            >
              {import.meta.env.VITE_APP_NAME || 'Post Approval System'}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:ml-10 md:flex md:space-x-4">
              {isAdmin ? (
                <>
                  <button
                    onClick={() => navigate('/admin')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActiveRoute('/admin')
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Admin Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/admin?tab=users')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === '/admin' && location.search.includes('tab=users')
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Manage Users
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActiveRoute('/dashboard')
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    My Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/posts/create')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActiveRoute('/posts/create')
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Create Post
                  </button>
                  <button
                    onClick={() => navigate('/posts')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname.startsWith('/posts') && location.pathname !== '/posts/create'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    My Posts
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* User Info and Controls */}
          <div className="flex items-center space-x-4">
            {/* Session Timer - Desktop */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="text-xs text-gray-500">Session:</div>
              <div className={`px-2 py-1 rounded text-xs font-mono ${
                timeRemaining > 60 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {formatTime(timeRemaining)}
              </div>
            </div>

            {/* User Info */}
            <div className="flex flex-col items-end">
              <div className="text-sm font-medium text-gray-900">
                {getWelcomeMessage()}
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-xs text-gray-500">
                  {user?.role === 'ADMIN' ? 'Administrator' : 'User'}
                </div>
                {user?.passwordReset && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    Set Password
                  </span>
                )}
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Logout Button - Desktop */}
            <div className="hidden md:block">
              <Button 
                variant="secondary" 
                size="small"
                onClick={handleLogout}
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                }
              >
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden mt-3 pb-3 border-t border-gray-200 pt-3">
            {/* Session Timer - Mobile */}
            <div className="flex items-center justify-center mb-3">
              <div className="flex items-center space-x-2">
                <div className="text-xs text-gray-500">Session expires in:</div>
                <div className={`px-2 py-1 rounded text-xs font-mono ${
                  timeRemaining > 60 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {formatTime(timeRemaining)}
                </div>
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="space-y-1">
              {isAdmin ? (
                <>
                  <button
                    onClick={() => {
                      navigate('/admin');
                      setShowMobileMenu(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                      isActiveRoute('/admin')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Admin Dashboard
                  </button>
                  <button
                    onClick={() => {
                      navigate('/admin?tab=users');
                      setShowMobileMenu(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                      location.pathname === '/admin' && location.search.includes('tab=users')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Manage Users
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      navigate('/dashboard');
                      setShowMobileMenu(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                      isActiveRoute('/dashboard')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    My Dashboard
                  </button>
                  <button
                    onClick={() => {
                      navigate('/posts/create');
                      setShowMobileMenu(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                      isActiveRoute('/posts/create')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Create Post
                  </button>
                  <button
                    onClick={() => {
                      navigate('/posts');
                      setShowMobileMenu(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                      location.pathname.startsWith('/posts') && location.pathname !== '/posts/create'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    My Posts
                  </button>
                </>
              )}
            </div>

            {/* Mobile Logout Button */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <Button 
                variant="secondary" 
                size="small"
                onClick={handleLogout}
                fullWidth
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                }
              >
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}