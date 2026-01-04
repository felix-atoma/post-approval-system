import React from 'react';
import { motion } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';
import Button from './Button';

export default function ErrorState({ 
  title = "Error Loading Data", 
  message, 
  onRetry, 
  onHome,
  className = '' 
}) {
  return (
    <motion.div 
      className={`min-h-[60vh] flex flex-col items-center justify-center p-4 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-md w-full">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center text-red-500"
        >
          <FiAlertTriangle className="w-10 h-10" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
            {title}
          </h3>
          <p className="text-gray-600 text-center mb-8">
            {message || "An unexpected error occurred. Please try again."}
          </p>
        </motion.div>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {onRetry && (
            <Button
              onClick={onRetry}
              className="flex-1"
              variant="primary"
              icon={<FiAlertTriangle className="w-4 h-4" />}
            >
              Retry
            </Button>
          )}
          {onHome && (
            <Button
              onClick={onHome}
              variant="outline"
              className="flex-1"
            >
              Go to Home
            </Button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}