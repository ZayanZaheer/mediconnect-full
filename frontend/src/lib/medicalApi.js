import { API_CONFIG } from '../config/api.js';

const API_BASE = API_CONFIG.MEDICAL_HISTORY;

// ======================================================
// GET: Full medical history for a patient
// ======================================================
export async function fetchMedicalHistory(patientEmail) {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(patientEmail)}`, {
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true"
    }
  });

  if (!res.ok) {
    const contentType = res.headers.get('content-type');
    let errorMessage = `Failed to load medical history (${res.status})`;
    
    if (contentType?.includes('application/json')) {
      const errorData = await res.json().catch(() => ({}));
      errorMessage = errorData.message || errorMessage;
    } else {
      const text = await res.text();
      console.error('Non-JSON response:', text.substring(0, 200));
    }
    
    throw new Error(errorMessage);
  }

  const contentType = res.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    const text = await res.text();
    console.error('Expected JSON but got:', text.substring(0, 200));
    throw new Error('Server returned non-JSON response');
  }

  return await res.json();
}

// ======================================================
// GET: A single note/prescription entry
// ======================================================
export async function fetchMedicalEntry(id) {
  const res = await fetch(`${API_BASE}/entry/${encodeURIComponent(id)}`, {
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true"
    }
  });

  if (!res.ok) {
    const contentType = res.headers.get('content-type');
    let errorMessage = `Failed to load entry (${res.status})`;
    
    if (contentType?.includes('application/json')) {
      const errorData = await res.json().catch(() => ({}));
      errorMessage = errorData.message || errorMessage;
    } else {
      const text = await res.text();
      console.error('Non-JSON response:', text.substring(0, 200));
    }
    
    throw new Error(errorMessage);
  }

  const contentType = res.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    const text = await res.text();
    console.error('Expected JSON but got:', text.substring(0, 200));
    throw new Error('Server returned non-JSON response');
  }

  return await res.json();
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
      "ngrok-skip-browser-warning": "true"
    },
    body: JSON.stringify(entryData),
  });

  if (!res.ok) {
    const contentType = res.headers.get('content-type');
    let errorMessage = `Failed to create entry (${res.status})`;
    
    if (contentType?.includes('application/json')) {
      const errorData = await res.json().catch(() => ({}));
      errorMessage = errorData.message || errorMessage;
    } else {
      const text = await res.text();
      console.error('Non-JSON response:', text.substring(0, 200));
    }
    
    throw new Error(errorMessage);
  }

  const contentType = res.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    const text = await res.text();
    console.error('Expected JSON but got:', text.substring(0, 200));
    throw new Error('Server returned non-JSON response');
  }

  return await res.json();
}
