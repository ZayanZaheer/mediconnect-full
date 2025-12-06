const API_BASE = "/api";

// ------------ PATIENT (User table only) ----------------
export async function fetchPatientProfile(email) {
  const res = await fetch(`${API_BASE}/profile?email=${email}`);
  if (!res.ok) throw new Error("Failed to fetch patient profile");
  return await res.json();
}

export async function updatePatientProfile(email, data) {
  const res = await fetch(`${API_BASE}/profile?email=${email}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update patient profile");
  return await res.json();
}

// ------------ DOCTOR ----------------------------------
export async function fetchDoctorProfile(email) {
  const res = await fetch(`${API_BASE}/doctors/${email}/profile`);
  if (!res.ok) throw new Error("Failed to fetch doctor profile");
  return await res.json();
}

export async function updateDoctorProfile(email, data) {
  const res = await fetch(`${API_BASE}/doctors/${email}/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update doctor profile");
  return await res.json();
}

// ------------ RECEPTIONIST -----------------------------
export async function fetchReceptionistProfile(email) {
  const res = await fetch(`${API_BASE}/receptionists/${email}/profile`);
  if (!res.ok) throw new Error("Failed to fetch receptionist profile");
  return await res.json();
}

export async function updateReceptionistProfile(email, data) {
  const res = await fetch(`${API_BASE}/receptionists/${email}/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update receptionist profile");
  return await res.json();
}

// ------------ ADMIN ------------------------------------
export async function fetchAdminProfile(email) {
  const res = await fetch(`${API_BASE}/admins/${email}/profile`);
  if (!res.ok) throw new Error("Failed to fetch admin profile");
  return await res.json();
}

export async function updateAdminProfile(email, data) {
  const res = await fetch(`${API_BASE}/admins/${email}/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
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

