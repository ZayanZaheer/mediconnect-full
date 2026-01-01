import { API_CONFIG } from '../config/api.js';

/**
 * Upload profile photo
 */
export async function uploadProfilePhoto(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_CONFIG.BASE_URL}/upload/file?type=profile-photo`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Failed to upload photo");

  return await res.json();
}

/**
 * Upload medical record file to Lambda
 */
export async function uploadMedicalRecordFile(file, metadata = {}) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("patientEmail", metadata.patientEmail || "");
  formData.append("recordType", metadata.recordType || "General");
  formData.append("doctorName", metadata.doctorName || "");
  formData.append("recordDate", metadata.recordDate || new Date().toISOString());

  const res = await fetch(API_CONFIG.UPLOAD.MEDICAL_RECORD, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to upload medical record file");
  }

  const data = await res.json();
  return {
    url: data.url,
    fileName: file.name,
    contentType: file.type,
    fileSizeBytes: file.size,
  };
}

