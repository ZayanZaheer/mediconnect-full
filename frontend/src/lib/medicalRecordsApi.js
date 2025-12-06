// src/lib/medicalRecordsApi.js
const API_BASE = "http://100.26.176.5:5000/api/medicalrecords";

// ======================================================
// GET: Medical Records for a patient
// ======================================================
export async function fetchMedicalRecords(patientEmail) {
  const q = patientEmail ? `?patientEmail=${encodeURIComponent(patientEmail)}` : "";

  const res = await fetch(`${API_BASE}${q}`);

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.message || "Failed to load medical records");
  }

  return data;
}

// ======================================================
// POST: Create a medical record (metadata only)
// File upload is separate using uploadApi.js
// ======================================================
export async function createMedicalRecord(recordData) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(recordData),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.message || "Failed to create medical record");
  }

  return data;
}

// ======================================================
// DELETE: Delete a record
// ======================================================
export async function deleteMedicalRecord(id) {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!res.ok && res.status !== 204) {
    let data;
    try {
      data = await res.json();
      throw new Error(data?.message || "Failed to delete record");
    } catch {
      throw new Error("Failed to delete record");
    }
  }

  return true;
}
