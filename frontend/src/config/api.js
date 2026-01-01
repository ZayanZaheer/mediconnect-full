/**
 * Centralized API Configuration
 * 
 * Uses Vite environment variables (import.meta.env.VITE_API_URL)
 * Falls back to localhost for development if not set
 * 
 * IMPORTANT: On Vercel, set VITE_LAMBDA_API_URL for Login/Register/Upload!
 */

// Only fallback to localhost in development, not production
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:5000' : '');

// Lambda function URLs (AWS API Gateway endpoints)
const LAMBDA_BASE_URL = import.meta.env.VITE_LAMBDA_API_URL || '';

// Debug logging in development
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_LAMBDA_API_URL: import.meta.env.VITE_LAMBDA_API_URL,
    API_BASE_URL,
    LAMBDA_BASE_URL,
    mode: import.meta.env.MODE
  });
}

// Production warnings
if (import.meta.env.PROD) {
  if (!import.meta.env.VITE_LAMBDA_API_URL) {
    console.error('❌ CRITICAL: VITE_LAMBDA_API_URL is not set! Login/Register will fail.');
    console.error('👉 Set VITE_LAMBDA_API_URL in Vercel Environment Variables');
  }
  if (!import.meta.env.VITE_API_URL) {
    console.warn('⚠️ INFO: VITE_API_URL not set. Other API calls (if any) will fail.');
  }
}

export const API_CONFIG = {
  // Standard API base for most endpoints
  BASE_URL: `${API_BASE_URL}/api`,
  
  // Specialized paths for specific services
  MEDICAL_HISTORY: `${API_BASE_URL}/api/medical-history`,
  MEDICAL_RECORDS: `${API_BASE_URL}/api/medicalrecords`,
  
  // Lambda function endpoints (use these when Lambda URLs are available)
  LAMBDA: {
    LOGIN: LAMBDA_BASE_URL ? `${LAMBDA_BASE_URL}/login` : null,
    REGISTER: LAMBDA_BASE_URL ? `${LAMBDA_BASE_URL}/register` : null,
    UPLOAD_MEDICAL_RECORD: LAMBDA_BASE_URL ? `${LAMBDA_BASE_URL}/upload-medical-record` : null,
  }
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
