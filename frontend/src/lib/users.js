import { API_CONFIG } from '../config/api.js';

const API_BASE = API_CONFIG.BASE_URL;

// Note: These functions are deprecated and kept only for backward compatibility
// All user data should now come from the backend API

export async function getRegisteredUsers() {
  try {
    const response = await fetch(`${API_BASE}/admin/users`, {
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch users:', response.status);
      return [];
    }
    
    const users = await response.json();
    return users.filter(u => u.role === "Patient");
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function searchRegisteredUsers(keyword) {
  if (!keyword) return [];
  const normalized = keyword.trim();
  if (!normalized) return [];
  
  try {
    const response = await fetch(`${API_BASE}/users/search?q=${encodeURIComponent(normalized)}`, {
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      }
    });
    
    if (!response.ok) {
      console.error('Failed to search users:', response.status);
      return [];
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

export async function upsertRegisteredUser(user) {
  // This function is deprecated - user updates should go through profile API
  console.warn('upsertRegisteredUser is deprecated. Use profile API instead.');
  if (!user?.email) return;
  
  try {
    const response = await fetch(`${API_BASE}/profile?email=${encodeURIComponent(user.email)}`, {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify(user)
    });
    
    if (!response.ok) {
      console.error('Failed to update user:', response.status);
    }
  } catch (error) {
    console.error('Error updating user:', error);
  }
}

export async function findRegisteredUser(email) {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  
  try {
    const response = await fetch(`${API_BASE}/profile?email=${encodeURIComponent(normalized)}`, {
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}
