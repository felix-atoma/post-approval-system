import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Logo from '../../components/common/Logo';
import SearchBar from '../../components/common/SearchBar';
import FilterDropdown from '../../components/common/FilterDropdown';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import { toast } from 'react-hot-toast';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, authError, clearAuthError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clear errors when form changes
  useEffect(() => {
    if (authError) {
      clearAuthError();
    }
    setErrors({});
  }, [formData.email, formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await login(formData.email, formData.password);
      
      // ✅ CHECK FOR PASSWORD SETUP REQUIRED
      if (response?.passwordReset === true || response?.data?.passwordReset === true) {
        const userId = response?.userId || response?.data?.userId;
        const userEmail = response?.user?.email || formData.email;
        
        sessionStorage.setItem('setupUserId', userId);
        sessionStorage.setItem('setupEmail', userEmail);
        
        toast.success('Please create your permanent password');
        navigate('/create-password');
        return;
      }
      
      toast.success('Login successful!');
      
    } catch (error) {
      if (error.response?.data?.passwordReset || error.response?.data?.code === 'PASSWORD_RESET_REQUIRED') {
        const userId = error.response?.data?.userId;
        const userEmail = formData.email;
        
        sessionStorage.setItem('setupUserId', userId);
        sessionStorage.setItem('setupEmail', userEmail);
        
        toast.info('Please create your permanent password');
        navigate('/create-password');
        return;
      }
      
      if (error.response?.data?.error?.message) {
        toast.error(error.response.data.error.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Login failed. Please try again.');
      }
      
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (email, password) => {
    setFormData({ email, password });
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setIsSubmitting(true);
    try {
      const response = await login(email, password);
      
      if (response?.passwordReset === true || response?.data?.passwordReset === true) {
        const userId = response?.userId || response?.data?.userId;
        const userEmail = response?.user?.email || email;
        
        sessionStorage.setItem('setupUserId', userId);
        sessionStorage.setItem('setupEmail', userEmail);
        
        toast.success('Please create your permanent password');
        navigate('/create-password');
        return;
      }
      
      toast.success('Demo login successful!');
      
    } catch (error) {
      if (error.response?.data?.passwordReset || error.response?.data?.code === 'PASSWORD_RESET_REQUIRED') {
        const userId = error.response?.data?.userId;
        const userEmail = email;
        
        sessionStorage.setItem('setupUserId', userId);
        sessionStorage.setItem('setupEmail', userEmail);
        
        toast.info('Please create your permanent password');
        navigate('/create-password');
        return;
      }
      
      if (error.response?.data?.error?.message) {
        toast.error(error.response.data.error.message);
      } else {
        toast.error('Demo login failed');
      }
      
      console.error('Demo login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const LoginIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 013 3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
    </svg>
  );

  return (
    <div className="min-h-screen flex">
      {/* ✅ LEFT SIDE - Image/Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-40 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 text-white">
          <div className="max-w-md">
            <div className="mb-8">
              <Logo className="h-16 w-auto filter brightness-0 invert" />
            </div>
            
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Welcome to Post Management System
            </h1>
            
            <p className="text-lg text-blue-100 mb-8">
              Streamline your content workflow with our powerful post approval system. 
              Create, review, and manage posts with ease.
            </p>
            
            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Easy Collaboration</h3>
                  <p className="text-blue-100">Work together with your team seamlessly</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Powerful Admin Tools</h3>
                  <p className="text-blue-100">Comprehensive user and post management</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Secure & Reliable</h3>
                  <p className="text-blue-100">Enterprise-grade security for your content</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">10K+</div>
                <div className="text-sm text-blue-200">Posts Managed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm text-blue-200">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">99.9%</div>
                <div className="text-sm text-blue-200">Uptime</div>
              </div>
            </div>

            {/* Status Badge Examples */}
            <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <h4 className="text-lg font-semibold mb-3">Post Status System</h4>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status="pending" size="sm" showIcon={false} />
                <StatusBadge status="approved" size="sm" showIcon={false} />
                <StatusBadge status="rejected" size="sm" showIcon={false} />
                <StatusBadge status="draft" size="sm" showIcon={false} />
                <StatusBadge status="published" size="sm" showIcon={false} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ RIGHT SIDE - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-gray-50">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <Logo className="h-12 w-auto" />
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your account to continue
            </p>
          </div>

          <div className="mt-8">
            {/* Error Alert */}
            {authError && (
              <Alert
                type="error"
                title="Authentication Failed"
                message={authError}
                onClose={clearAuthError}
                className="mb-6"
              />
            )}

            {/* New User Instructions */}
            <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-100">
              <p className="text-sm text-blue-800">
                <strong className="font-semibold">New users:</strong> Enter your email and any temporary password. 
                You'll set your permanent password next.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              <div>
                <Input
                  label="Email address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  error={errors.email}
                  disabled={isSubmitting}
                  leftIcon={
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                />
              </div>

              <div>
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  error={errors.password}
                  disabled={isSubmitting}
                  leftIcon={
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                      disabled={isSubmitting}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                    Forgot password?
                  </a>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  variant="primary"
                  size="large"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  className="w-full"
                  leftIcon={!isSubmitting && <LoginIcon />}
                  animateHover
                >
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </Button>
              </div>
            </form>

            {/* Demo Accounts */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500 font-medium">Demo Accounts</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => !isSubmitting && handleDemoLogin('admin@example.com', 'Admin123')}
                  className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 transition-all hover:bg-blue-100 cursor-pointer text-left group"
                  disabled={isSubmitting}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status="approved" size="sm" showText={false} />
                        <p className="text-sm font-semibold text-blue-800">Admin Account</p>
                      </div>
                      <p className="text-xs text-blue-600 mt-1 ml-6">Full system access & post approvals</p>
                    </div>
                    <svg className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                <button
                  onClick={() => !isSubmitting && handleDemoLogin('user@example.com', 'User123')}
                  className="w-full bg-green-50 border border-green-200 rounded-lg p-3 transition-all hover:bg-green-100 cursor-pointer text-left group"
                  disabled={isSubmitting}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status="pending" size="sm" showText={false} />
                        <p className="text-sm font-semibold text-green-800">User Account</p>
                      </div>
                      <p className="text-xs text-green-600 mt-1 ml-6">Create & manage personal posts</p>
                    </div>
                    <svg className="h-5 w-5 text-green-600 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="/register" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Request access
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add blob animation styles */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 20s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}