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
    body: formData,
  });

  if (!res.ok) throw new Error("Failed to upload photo");

  return await res.json();
}

/**
 * Upload medical record file
 */
export async function uploadMedicalRecordFile(file, patientEmail) {
  const formData = new FormData();
  formData.append("file", file);

  // tell backend which bucket/folder this is for
  formData.append("type", "medical-record");
  formData.append("patientEmail", patientEmail);

  const res = await fetch(`${API_BASE}/upload/file?type=medical-record`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to upload medical record file");
  }

  const data = await res.json();

  // unify naming for PatientRecords.jsx usage
  return {
    url: data.url,               // example: /uploads/medical-record/123.pdf
    fileName: file.name,
    contentType: file.type,
    fileSizeBytes: file.size,
  };
}
