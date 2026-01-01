import { API_CONFIG } from '../config/api.js';

const API_BASE = API_CONFIG.BASE_URL;

/**
 * Upload profile photo
 */
export async function uploadProfilePhoto(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload/file?type=profile-photo`, {
    method: "POST",
    headers: {
      "ngrok-skip-browser-warning": "true"
    },
    body: formData,
  });

  if (!res.ok) throw new Error("Failed to upload photo");

  return await res.json();
}

/**
 * Upload medical record file to S3 via backend
 */
export async function uploadMedicalRecordFile(file, metadata = {}) {
  const formData = new FormData();
  formData.append("file", file);

  // Build query params
  const params = new URLSearchParams({
    type: "medical-record",
    patientEmail: metadata.patientEmail || "",
    recordType: metadata.recordType || "General",
    doctorName: metadata.doctorName || "",
    recordDate: metadata.recordDate || new Date().toISOString()
  });

  const url = `${API_BASE}/upload/file?${params.toString()}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "ngrok-skip-browser-warning": "true"
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to upload medical record file");
  }

  const data = await res.json();

  // Return unified format
  return {
    url: data.url,
    fileName: file.name,
    contentType: file.type,
    fileSizeBytes: file.size,
  };
}

