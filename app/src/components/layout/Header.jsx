import React, { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import { toast } from 'react-hot-toast';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useSessionTimer } from '../../hooks/useSessionTimer';
import { useActivityMonitor } from '../../hooks/useActivityMonitor';
import { useAutoRefreshToken } from '../../hooks/useAutoRefreshToken';

// Constants
const MOBILE_BREAKPOINT = 768;
const TOKEN_REFRESH_THRESHOLD = 60; // seconds
const ACTIVITY_DEBOUNCE = 30000; // 30 seconds
const SESSION_WARNING_THRESHOLD = 60; // 1 minute

// Memoized components for performance
const MobileMenuIcon = memo(({ isOpen }) => (
  <svg 
    className="h-6 w-6 transition-transform duration-200" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
    aria-hidden="true"
  >
    {isOpen ? (
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M6 18L18 6M6 6l12 12" 
      />
    ) : (
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M4 6h16M4 12h16M4 18h16" 
      />
    )}
  </svg>
));

MobileMenuIcon.displayName = 'MobileMenuIcon';

const LogoutIcon = memo(() => (
  <svg 
    className="h-4 w-4" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
    aria-hidden="true"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
    />
  </svg>
));

LogoutIcon.displayName = 'LogoutIcon';

// Helper Components
const SessionTimer = memo(({ timeRemaining }) => {
  const isWarning = timeRemaining <= SESSION_WARNING_THRESHOLD;
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="flex items-center space-x-2" role="timer" aria-live="polite">
      <div className="text-xs text-gray-500 font-medium">Session:</div>
      <div
        className={`px-2 py-1 rounded text-xs font-mono transition-colors duration-300 ${
          isWarning 
            ? "bg-red-100 text-red-800 animate-pulse" 
            : "bg-green-100 text-green-800"
        }`}
      >
        {formatTime(timeRemaining)}
      </div>
    </div>
  );
});

SessionTimer.displayName = 'SessionTimer';

const UserInfo = memo(({ name, email, role, passwordReset }) => {
  const displayName = name || email || 'User';
  
  return (
    <div className="flex flex-col items-end" aria-label="User information">
      <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
        {displayName}
      </div>
      <div className="flex items-center space-x-2 mt-0.5">
        <div className="text-xs text-gray-500 capitalize">
          {role.toLowerCase()}
        </div>
        {passwordReset && (
          <span 
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 animate-pulse"
            aria-label="Password reset required"
          >
            Set Password
          </span>
        )}
      </div>
    </div>
  );
});

UserInfo.displayName = 'UserInfo';

const NavButton = memo(({ onClick, isActive, label, mobile = false }) => {
  const baseStyles = mobile 
    ? "block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors"
    : "px-3 py-2 rounded-md text-sm font-medium transition-colors";
  
  const activeStyles = mobile
    ? "bg-blue-50 text-blue-700"
    : "bg-blue-100 text-blue-700";
  
  const inactiveStyles = "text-gray-600 hover:text-gray-900 hover:bg-gray-50";
  
  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${isActive ? activeStyles : inactiveStyles}`}
      aria-current={isActive ? "page" : undefined}
    >
      {label}
    </button>
  );
});

NavButton.displayName = 'NavButton';

// Main Component
export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const prevLocationRef = useRef(location.pathname + location.search);

  // Custom hooks for separation of concerns
  const { timeRemaining } = useSessionTimer({
    onWarning: useCallback((seconds) => {
      if (seconds === SESSION_WARNING_THRESHOLD) {
        toast.warning('Your session will expire in 1 minute. Activity will refresh your session.');
      }
    }, []),
    onExpired: useCallback(() => {
      toast.error('Session expired. Please login again.');
      logout();
      navigate('/login');
    }, [logout, navigate]),
  });

  const { refreshTokenSafely } = useAutoRefreshToken({
    refreshThreshold: TOKEN_REFRESH_THRESHOLD,
  });

  useActivityMonitor({
    enabled: !!user,
    debounceTime: ACTIVITY_DEBOUNCE,
    onActivity: refreshTokenSafely,
  });

  // Navigation configuration
  const navItems = useMemo(() => {
    if (!user) return [];

    const baseItems = isAdmin
      ? [
          {
            path: '/admin',
            label: 'Admin Dashboard',
            adminOnly: true,
          },
          {
            path: '/admin?tab=users',
            label: 'Manage Users',
            adminOnly: true,
          },
        ]
      : [
          {
            path: '/dashboard',
            label: 'My Dashboard',
            userOnly: true,
          },
          {
            path: '/posts/create',
            label: 'Create Post',
            userOnly: true,
          },
          {
            path: '/posts',
            label: 'My Posts',
            userOnly: true,
          },
        ];

    return baseItems.map(item => ({
      ...item,
      isActive: checkActiveRoute(item.path, location),
    }));
  }, [isAdmin, user, location]);

  // Effects
  useEffect(() => {
    // Close mobile menu when route changes
    if (showMobileMenu) {
      setShowMobileMenu(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    // Refresh token on significant route changes
    const currentPath = location.pathname + location.search;
    if (prevLocationRef.current !== currentPath && user) {
      refreshTokenSafely();
      prevLocationRef.current = currentPath;
    }
  }, [location, user, refreshTokenSafely]);

  // Handlers
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout. Please try again.');
    }
  }, [logout, navigate]);

  const handleNavigate = useCallback((path) => {
    navigate(path);
    if (isMobile) {
      setShowMobileMenu(false);
    }
  }, [navigate, isMobile]);

  const getWelcomeMessage = useCallback(() => {
    if (!user) return '';
    
    if (user.passwordReset) {
      return 'Please create your password';
    }
    
    return `Welcome, ${user.name || user.email}`;
  }, [user]);

  // Render nothing if no user
  if (!user) {
    return null;
  }

  return (
    <header 
      className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50"
      role="banner"
      aria-label="Main navigation"
    >
      <div className="px-4 py-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center flex-shrink-0">
            <button
              onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
              className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              aria-label="Go to dashboard"
            >
              <div className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                {import.meta.env.VITE_APP_NAME || 'Post Approval System'}
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav 
              className="hidden md:ml-8 md:flex md:space-x-1"
              aria-label="Main navigation"
            >
              {navItems.map((item) => (
                <NavButton
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  isActive={item.isActive || false}
                  label={item.label}
                />
              ))}
            </nav>
          </div>

          {/* User Info and Controls */}
          <div className="flex items-center space-x-4">
            {/* Session Timer - Desktop */}
            <div className="hidden md:block">
              <SessionTimer timeRemaining={timeRemaining} />
            </div>

            {/* User Info */}
            <UserInfo
              name={user.name}
              email={user.email}
              role={user.role}
              passwordReset={user.passwordReset}
            />

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={showMobileMenu ? "Close menu" : "Open menu"}
              aria-expanded={showMobileMenu}
              aria-controls="mobile-menu"
            >
              <MobileMenuIcon isOpen={showMobileMenu} />
            </button>

            {/* Logout Button - Desktop */}
            <div className="hidden md:block">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                leftIcon={<LogoutIcon />}
                aria-label="Logout"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div 
            id="mobile-menu"
            className="md:hidden mt-3 pb-3 border-t border-gray-200 pt-3 animate-slide-down"
            role="menu"
          >
            {/* Session Timer - Mobile */}
            <div className="flex items-center justify-center mb-3">
              <SessionTimer timeRemaining={timeRemaining} />
            </div>

            {/* Mobile Navigation */}
            <div className="space-y-1" role="menubar">
              {navItems.map((item) => (
                <NavButton
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  isActive={item.isActive || false}
                  label={item.label}
                  mobile
                />
              ))}
            </div>

            {/* Mobile Logout Button */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                fullWidth
                leftIcon={<LogoutIcon />}
                aria-label="Logout"
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

// Helper Functions
function checkActiveRoute(path, location) {
  if (path.includes('?')) {
    const [basePath, query] = path.split('?');
    return location.pathname === basePath && location.search.includes(query);
  }
  
  if (path === '/admin' && location.pathname.startsWith('/admin')) {
    return true;
  }
  
  if (path === '/posts' && location.pathname.startsWith('/posts')) {
    return location.pathname !== '/posts/create';
  }
  
  return location.pathname === path;
}