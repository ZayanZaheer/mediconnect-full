/**
 * Centralized API Configuration
 * 
 * Uses Vite environment variables (import.meta.env.VITE_API_URL)
 * Falls back to localhost for development if not set
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_CONFIG = {
  // Standard API base for most endpoints
  BASE_URL: `${API_BASE_URL}/api`,
  
  // Specialized paths for specific services
  MEDICAL_HISTORY: `${API_BASE_URL}/api/medical-history`,
  MEDICAL_RECORDS: `${API_BASE_URL}/api/medicalrecords`,
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
