/**
 * Centralized API Configuration for Dual-Backend Architecture
 * 
 * VITE_API_URL: Main ASP.NET Core backend (EC2/ngrok) - uses /api/* route prefixes
 *   - All application endpoints (appointments, doctors, users, medical records, etc.)
 *   - Example: https://backend.example.com/api/appointments
 * 
 * VITE_LAMBDA_API_URL: AWS Lambda via API Gateway - direct endpoints (no /api prefix)
 *   - Auth endpoints: /login, /register
 *   - Upload endpoint: /upload-medical-record
 *   - Example: https://xxx.execute-api.us-east-1.amazonaws.com/prod/login
 */

// Main backend URL (ASP.NET Core on EC2/Express)
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Main backend URL with /api prefix (all non-Lambda endpoints)
const API_API_BASE_URL = `${API_BASE_URL}/api`;

// Lambda API Gateway URL (auth & upload only)
const LAMBDA_API_BASE_URL = import.meta.env.VITE_LAMBDA_API_URL;

// Runtime validation - throw errors if environment variables are not defined
if (!API_BASE_URL) {
  throw new Error(
    '❌ VITE_API_URL is not defined! Add it to your .env.local file.\n' +
    'Example: VITE_API_URL=https://your-backend.ngrok-free.dev'
  );
}

if (!LAMBDA_API_BASE_URL) {
  throw new Error(
    '❌ VITE_LAMBDA_API_URL is not defined! Add it to your .env.local file.\n' +
    'Example: VITE_LAMBDA_API_URL=https://xxx.execute-api.us-east-1.amazonaws.com/prod'
  );
}

// Debug logging in development
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration (Dual-Backend Architecture):', {
    API_BASE_URL,
    API_API_BASE_URL,
    LAMBDA_API_BASE_URL,
    mode: import.meta.env.MODE
  });
}

// Export base URLs for direct use if needed
export { API_BASE_URL, LAMBDA_API_BASE_URL };

export const API_CONFIG = {
  // Main backend URL (ASP.NET Core)
  BASE_URL: API_API_BASE_URL,
  
  // Lambda API Gateway URL (auth & upload only)
  LAMBDA_BASE_URL: LAMBDA_API_BASE_URL,
  
  // Auth endpoints (Lambda functions - no /api prefix)
  AUTH: {
    LOGIN: `${LAMBDA_API_BASE_URL}/login`,
    REGISTER: `${LAMBDA_API_BASE_URL}/register`,
  },
  
  // Medical records upload (Lambda function - no /api prefix)
  UPLOAD: {
    MEDICAL_RECORD: `${LAMBDA_API_BASE_URL}/upload-medical-record`,
  },
  
  // Medical history endpoints (Backend - uses /api prefix with dash)
  MEDICAL_HISTORY: `${API_API_BASE_URL}/medical-history`,
  
  // Medical records endpoints (Backend - uses /api prefix)
  MEDICAL_RECORDS: `${API_API_BASE_URL}/medicalrecords`,
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
