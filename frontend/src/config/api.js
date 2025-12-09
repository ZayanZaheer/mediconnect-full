/**
 * Centralized API Configuration
 * 
 * Uses Vite environment variables (import.meta.env.VITE_API_URL)
 * Falls back to localhost for development if not set
 * 
 * IMPORTANT: On Vercel, set VITE_API_URL in Environment Variables!
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Debug logging in development
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    API_BASE_URL,
    mode: import.meta.env.MODE
  });
}

// Production warning if API URL not set
if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.warn('⚠️ WARNING: VITE_API_URL is not set! API calls will fail.');
  console.warn('👉 Set VITE_API_URL in Vercel Environment Variables');
}

export const API_CONFIG = {
  // Standard API base for most endpoints
  BASE_URL: `${API_BASE_URL}/api`,
  
  // Specialized paths for specific services
  MEDICAL_HISTORY: `${API_BASE_URL}/api/medical-history`,
  MEDICAL_RECORDS: `${API_BASE_URL}/api/medicalrecords`,
};

/**
 * Default headers for API requests
 * Includes ngrok-skip-browser-warning to bypass ngrok's browser warning page
 */
export const getDefaultHeaders = (token = null) => {
  const headers = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true"
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Helper function to construct full API URLs
 * @param {string} path - The API endpoint path
 * @returns {string} Full API URL
 */
export const getApiUrl = (path) => {
  // If path is already a full URL, return as-is
  if (path.startsWith('http')) return path;
  
  // Construct URL with base, ensuring single slash
  return `${API_CONFIG.BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};
