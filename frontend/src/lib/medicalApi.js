const API_BASE = "http://100.26.176.5:5000/api/medical-history";

// ======================================================
// GET: Full medical history for a patient
// ======================================================
export async function fetchMedicalHistory(patientEmail) {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(patientEmail)}`);

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.message || "Failed to load medical history");
  }

  return data;
}

// ======================================================
// GET: A single note/prescription entry
// ======================================================
export async function fetchMedicalEntry(id) {
  const res = await fetch(`${API_BASE}/entry/${encodeURIComponent(id)}`);

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.message || "Failed to load entry");
  }

  return data;
}

// ======================================================
// POST: Create NOTE or PRESCRIPTION
// Backend determines:
//   - /notes → Note
//   - /prescriptions → Prescription
// ======================================================
export async function createMedicalEntry(entryData) {
  const endpoint = entryData.type === "Note" ? "notes" : "prescriptions";

  const res = await fetch(`${API_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(entryData),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.message || "Failed to create entry");
  }

  return data;
}
