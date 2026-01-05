import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Logo from '../../components/common/Logo';
import StatusBadge from '../../components/common/StatusBadge';
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
  
  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Create & Draft Posts",
      description: "Start by creating content with our intuitive editor. Save as drafts and refine before submission.",
      imageColor: "from-blue-500 to-blue-700",
      steps: [
        { title: "Start Writing", icon: "✍️", description: "Use our rich text editor" },
        { title: "Add Media", icon: "🖼️", description: "Upload images and videos" },
        { title: "Save as Draft", icon: "💾", description: "Work at your own pace" }
      ],
      status: "draft"
    },
    {
      title: "Submit for Review",
      description: "Once ready, submit your post for review. Track its progress through the approval workflow.",
      imageColor: "from-yellow-500 to-orange-600",
      steps: [
        { title: "Submit Post", icon: "📤", description: "Send for approval" },
        { title: "Await Review", icon: "⏳", description: "Managers review content" },
        { title: "Receive Feedback", icon: "💬", description: "Get comments and suggestions" }
      ],
      status: "pending"
    },
    {
      title: "Publish & Monitor",
      description: "After approval, publish your content. Monitor performance and engagement metrics.",
      imageColor: "from-green-500 to-emerald-700",
      steps: [
        { title: "Get Approval", icon: "✅", description: "Post gets approved" },
        { title: "Schedule Publishing", icon: "📅", description: "Set publish date/time" },
        { title: "Monitor Analytics", icon: "📊", description: "Track views and engagement" }
      ],
      status: "published"
    }
  ];

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

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
      {/* ✅ LEFT SIDE - Three-Step Carousel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-8 text-white">
          <div className="w-full max-w-xl">
            {/* Logo */}
            <div className="mb-12">
              <Logo className="h-16 w-auto filter brightness-0 invert" />
              <h1 className="text-3xl font-bold mt-4">Post Management System</h1>
            </div>

            {/* Carousel Container */}
            <div className="relative h-[500px] overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-white/10">
              {/* Slides */}
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out transform ${
                    index === currentSlide
                      ? 'translate-x-0 opacity-100'
                      : index < currentSlide
                      ? '-translate-x-full opacity-0'
                      : 'translate-x-full opacity-0'
                  }`}
                >
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${slide.imageColor} opacity-20`}></div>
                  
                  {/* Content */}
                  <div className="relative z-10 p-8 h-full flex flex-col">
                    {/* Status Badge */}
                    <div className="mb-6">
                      <StatusBadge status={slide.status} size="lg" />
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl font-bold mb-4">{slide.title}</h2>
                    
                    {/* Description */}
                    <p className="text-gray-200 text-lg mb-8 leading-relaxed">
                      {slide.description}
                    </p>

                    {/* Steps Container */}
                    <div className="flex-1 flex flex-col justify-center">
                      {/* Top Step */}
                      <div className="flex justify-center mb-8">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 w-64 transform -rotate-2 hover:rotate-0 transition-transform duration-300 border border-white/20">
                          <div className="text-3xl mb-3">{slide.steps[0].icon}</div>
                          <h3 className="text-xl font-semibold mb-2">{slide.steps[0].title}</h3>
                          <p className="text-gray-300 text-sm">{slide.steps[0].description}</p>
                        </div>
                      </div>

                      {/* Middle Step - Centered */}
                      <div className="flex justify-center mb-8">
                        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6 w-72 transform scale-110 hover:scale-105 transition-transform duration-300 border border-white/30 shadow-lg">
                          <div className="text-4xl mb-4">{slide.steps[1].icon}</div>
                          <h3 className="text-2xl font-bold mb-2">{slide.steps[1].title}</h3>
                          <p className="text-gray-300">{slide.steps[1].description}</p>
                        </div>
                      </div>

                      {/* Bottom Step */}
                      <div className="flex justify-center">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 w-64 transform rotate-2 hover:rotate-0 transition-transform duration-300 border border-white/20">
                          <div className="text-3xl mb-3">{slide.steps[2].icon}</div>
                          <h3 className="text-xl font-semibold mb-2">{slide.steps[2].title}</h3>
                          <p className="text-gray-300 text-sm">{slide.steps[2].description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Step Indicator */}
                    <div className="mt-8 flex justify-center space-x-2">
                      {slides.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSlide(idx)}
                          className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            idx === currentSlide
                              ? 'bg-white w-8'
                              : 'bg-white/40 hover:bg-white/60'
                          }`}
                          aria-label={`Go to step ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Navigation Arrows */}
              <button
                onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 transition-all duration-300 border border-white/20"
                aria-label="Previous slide"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 transition-all duration-300 border border-white/20"
                aria-label="Next slide"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Carousel Progress */}
            <div className="mt-8 flex items-center justify-center text-gray-300">
              <span className="text-sm">
                Step {currentSlide + 1} of {slides.length}
              </span>
              <div className="ml-4 w-32 bg-gray-700 rounded-full h-1">
                <div 
                  className="bg-white h-full rounded-full transition-all duration-500"
                  style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
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

      {/* Animation styles */}
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