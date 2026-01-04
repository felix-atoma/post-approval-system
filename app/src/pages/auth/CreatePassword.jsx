import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Change this from default import to named import
import { authService } from '../../services/auth.service'; // <-- Changed this line
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';

export default function CreatePassword() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('setupUserId');
    const storedEmail = sessionStorage.getItem('setupEmail');
    
    if (!storedUserId || !storedEmail) {
      toast.error('Invalid password setup session');
      navigate('/login');
      return;
    }
    
    setUserId(storedUserId);
    setEmail(storedEmail);
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      toast.error('Password must contain uppercase, lowercase, and number');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      // Call the backend - it returns tokens!
      const response = await authService.createPassword(userId, password);
      
      // Clear session storage
      sessionStorage.removeItem('setupUserId');
      sessionStorage.removeItem('setupEmail');
      
      // The backend returns tokens, so we can log the user in directly
      // Access response data properly based on your API structure
      if (response.data?.accessToken && response.data?.refreshToken) {
        // Store tokens
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        
        toast.success('Password created! Welcome!');
        
        // Redirect to dashboard
        navigate('/dashboard');
        window.location.reload(); // Reload to update auth state
      } else if (response.accessToken && response.refreshToken) {
        // Alternative: if tokens are in the root of response
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        
        toast.success('Password created! Welcome!');
        navigate('/dashboard');
        window.location.reload();
      } else {
        toast.success('Password created! Please login.');
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to create password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Create Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome! Set your password for <span className="font-semibold">{email}</span>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            helpText="At least 8 characters with uppercase, lowercase, and number"
          />
          
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
          />
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating Password...' : 'Create Password & Login'}
          </Button>
        </form>
      </div>
    </div>
  );
}