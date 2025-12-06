import { API_CONFIG } from '../config/api.js';

const API_BASE = API_CONFIG.BASE_URL;

// ------------ PATIENT (User table only) ----------------
export async function fetchPatientProfile(email, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  const res = await fetch(`${API_BASE}/profile?email=${email}`, { headers });
  if (!res.ok) throw new Error("Failed to fetch patient profile");
  return await res.json();
}

export async function updatePatientProfile(email, data, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  const res = await fetch(`${API_BASE}/profile?email=${email}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update patient profile");
  return await res.json();
}

// ------------ DOCTOR ----------------------------------
export async function fetchDoctorProfile(email, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  const res = await fetch(`${API_BASE}/doctors/${email}/profile`, { headers });
  if (!res.ok) throw new Error("Failed to fetch doctor profile");
  return await res.json();
}

export async function updateDoctorProfile(email, data, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  const res = await fetch(`${API_BASE}/doctors/${email}/profile`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update doctor profile");
  return await res.json();
}

// ------------ RECEPTIONIST -----------------------------
export async function fetchReceptionistProfile(email, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  const res = await fetch(`${API_BASE}/receptionists/${email}/profile`, { headers });
  if (!res.ok) throw new Error("Failed to fetch receptionist profile");
  return await res.json();
}

export async function updateReceptionistProfile(email, data, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  const res = await fetch(`${API_BASE}/receptionists/${email}/profile`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update receptionist profile");
  return await res.json();
}

// ------------ ADMIN ------------------------------------
export async function fetchAdminProfile(email, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  const res = await fetch(`${API_BASE}/admins/${email}/profile`, { headers });
  if (!res.ok) throw new Error("Failed to fetch admin profile");
  return await res.json();
}

export async function updateAdminProfile(email, data, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  const res = await fetch(`${API_BASE}/admins/${email}/profile`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      FirstName: data.firstName,
      LastName: data.lastName,
      Phone: data.phone,
      PhoneCountryCode: data.phoneCountryCode,
      RoleTitle: data.roleTitle,
      EscalationCountryCode: data.escalationCountryCode,
      EscalationPhone: data.escalationPhone,
      Bio: data.bio,
    }),
  });

  if (!res.ok) throw new Error("Failed to update admin profile");
  return await res.json();
}

