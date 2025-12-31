// src/main.jsx
import React from 'react';  // Add this
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Make React globally available as a temporary fix
if (!window.React) {
  window.React = React;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);