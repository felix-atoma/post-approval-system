// app/src/components/SessionWarningModal.jsx
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const SessionWarningModal = () => {
  const { inactivityWarning, extendSession, logout } = useAuth();
  const [countdown, setCountdown] = React.useState(60);

  useEffect(() => {
    if (inactivityWarning) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            logout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setCountdown(60);
    }
  }, [inactivityWarning, logout]);

  if (!inactivityWarning) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Session About to Expire</h2>
        <p className="text-gray-600 mb-4">
          Your session will expire in <span className="font-bold">{countdown}</span> seconds 
          due to inactivity.
        </p>
        <p className="text-gray-600 mb-6">
          Do you want to continue your session?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={logout}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Log Out
          </button>
          <button
            onClick={extendSession}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionWarningModal;