// src/lib/medicalRecordsApi.js
import { API_CONFIG } from '../config/api.js';

const API_BASE = API_CONFIG.MEDICAL_RECORDS;

// ======================================================
// GET: Medical Records for a patient
// ======================================================
export async function fetchMedicalRecords(patientEmail) {
  const q = patientEmail ? `?patientEmail=${encodeURIComponent(patientEmail)}` : "";
  const url = `${API_BASE}${q}`;
  
  console.log('🔍 Fetching medical records:', {
    url,
    patientEmail,
    API_BASE
  });

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true"
    }
  });

  console.log('📡 Response received:', {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok,
    contentType: res.headers.get('content-type'),
    url: res.url
  });

  if (!res.ok) {
    const contentType = res.headers.get('content-type');
    let errorMessage = `Failed to load medical records (${res.status})`;
    
    if (contentType?.includes('application/json')) {
      const errorData = await res.json().catch(() => ({}));
      console.error('❌ Error response data:', errorData);
      errorMessage = errorData.message || errorMessage;
    } else {
      const text = await res.text();
      console.error('❌ Non-JSON error response:', text.substring(0, 500));
    }
    
    throw new Error(errorMessage);
  }

  const contentType = res.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    const text = await res.text();
    console.error('❌ Expected JSON but got:', text.substring(0, 500));
    throw new Error('Server returned non-JSON response');
  }

  const data = await res.json();
  console.log('✅ Successfully fetched records:', {
    recordCount: Array.isArray(data) ? data.length : 'N/A',
    dataType: typeof data,
    isArray: Array.isArray(data)
  });

  return data;
}

// ======================================================
// POST: Create a medical record (metadata only)
// File upload is separate using uploadApi.js
// ======================================================
export async function createMedicalRecord(recordData) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true"
    },
    body: JSON.stringify(recordData),
  });

  if (!res.ok) {
    const contentType = res.headers.get('content-type');
    let errorMessage = `Failed to create medical record (${res.status})`;
    
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
// DELETE: Delete a record
// ======================================================
export async function deleteMedicalRecord(id) {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true"
    }
  });

  if (!res.ok && res.status !== 204) {
    const contentType = res.headers.get('content-type');
    let errorMessage = `Failed to delete record (${res.status})`;
    
    if (contentType?.includes('application/json')) {
      const errorData = await res.json().catch(() => ({}));
      errorMessage = errorData.message || errorMessage;
    } else {
      const text = await res.text();
      console.error('Non-JSON response:', text.substring(0, 200));
    }
    
    throw new Error(errorMessage);
  }

  return true;
}
