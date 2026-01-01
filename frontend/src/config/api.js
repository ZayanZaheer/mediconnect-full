/**
 * Centralized API Configuration for AWS Lambda via API Gateway
 * 
 * IMPORTANT: Set VITE_API_URL to your AWS API Gateway base URL
 * Example: https://ayvlc6aa4c.execute-api.us-east-1.amazonaws.com/prod
 * 
 * All endpoints are accessed directly without /api prefix
 */

// AWS API Gateway base URL (from environment variable or fallback)
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'https://ayvlc6aa4c.execute-api.us-east-1.amazonaws.com/prod' : '');

// Debug logging in development
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration (AWS Lambda via API Gateway):', {
    API_BASE_URL,
    mode: import.meta.env.MODE
  });
}

// Production validation
if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.error('❌ CRITICAL: VITE_API_URL is not set! API calls will fail.');
  console.error('👉 Set VITE_API_URL in Vercel Environment Variables');
  console.error('Example: https://ayvlc6aa4c.execute-api.us-east-1.amazonaws.com/prod');
}

export const API_CONFIG = {
  // Base URL for all API calls (AWS API Gateway)
  BASE_URL: API_BASE_URL,
  
  // Auth endpoints (Lambda functions)
  AUTH: {
    LOGIN: `${API_BASE_URL}/login`,
    REGISTER: `${API_BASE_URL}/register`,
  },
  
  // Medical records upload (Lambda function)
  UPLOAD: {
    MEDICAL_RECORD: `${API_BASE_URL}/upload-medical-record`,
  }
};

/**
 * Default headers for API requests
 */
export const getDefaultHeaders = (token = null) => {
  const headers = {
    "Content-Type": "application/json",
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
