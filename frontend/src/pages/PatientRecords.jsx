import { useCallback, useEffect, useState } from "react";
import AppShell from "../layout/AppShell.jsx";
import Navbar from "../components/Navbar.jsx";
import SidebarPatient from "../layout/SidebarPatient.jsx";
import Button from "../components/Button.jsx";
import Select from "../components/Select.jsx";
import DatePicker from "../components/DatePicker.jsx";
import FormField from "../components/FormField.jsx";
import Pill from "../components/Pill.jsx";
import { Eye, Upload, X } from "lucide-react";
import { formatPatientDate } from "../lib/date.js";
import { inputBase } from "../lib/ui.js";
import { useToast } from "../components/ToastProvider.jsx";
import { uploadMedicalRecordFile } from "../lib/uploadApi.js";
import { API_CONFIG } from '../config/api.js';

const API_BASE = API_CONFIG.BASE_URL;

export default function PatientRecords() {
  const pushToast = useToast();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [preview, setPreview] = useState(null);
  const [fileKey, setFileKey] = useState(Date.now());

  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState({
    type: "Blood Test",
    date: "",
    doctor: ""
  });

  const recordTypeOptions = [
    "Blood Test",
    "Imaging",
    "Prescription",
    "Discharge Summary",
    "Other",
  ];

  // ================================
  // Load records from backend
  // ================================
  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const email = JSON.parse(localStorage.getItem("auth"))?.user?.email;

      const res = await fetch(
        `${API_BASE}/medicalrecords?patientEmail=${email}`
      );
      const data = await res.json();

      setRecords(data);
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      pushToast({ tone: "error", message: "Failed to load records" });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);


  useEffect(() => {
    loadRecords();
  }, [pushToast]);

  // ================================
  // Upload file + create record
  // ================================
  async function handleUpload() {
    if (!file) {
      return pushToast({ tone: "error", message: "Please select a file." });
    }
    if (!meta.date || !meta.doctor) {
      return pushToast({ tone: "error", message: "Date and doctor are required." });
    }

    try {
      // 1. Upload actual file
      const fileResult = await uploadMedicalRecordFile(file);

      // 2. Create DB record
      const email = JSON.parse(localStorage.getItem("auth"))?.user?.email;

      const payload = {
        patientEmail: email,
        doctorName: meta.doctor,
        recordType: meta.type,
        fileName: file.name,
        fileUrl: fileResult.url,
        contentType: file.type,
        fileSizeBytes: file.size,
        recordDate: meta.date
      };

      const res = await fetch(`${API_BASE}/medicalrecords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || "Upload failed");

      pushToast({ tone: "success", message: "Record uploaded successfully." });

      // Reload list
      loadRecords();

      setFile(null);
      setMeta({ type: "Blood Test", date: "", doctor: "" });
      setFileKey(Date.now());   // ⬅️ resets file chooser and removes filename from UI

    } catch (err) {
      pushToast({ tone: "error", message: err.message });
    }
  }

  // ================================
  // Delete record
  // ================================
  async function deleteRecord(id) {
    try {
      const res = await fetch(`${API_BASE}/medicalrecords/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Delete failed");

      pushToast({ tone: "success", message: "Record deleted." });
      loadRecords();
    } catch {
      pushToast({ tone: "error", message: "Failed to delete record." });
    }
  }

  // ================================
  // Render
  // ================================

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <AppShell sidebar={<SidebarPatient />} navbar={null}>

        {/* Upload Form */}
        <section className="rounded-2xl border bg-white p-6 shadow-card mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">Upload Medical Record</h2>

          <div className="grid gap-4 lg:grid-cols-3">
            <FormField label="Record Type">
              <Select
                value={meta.type}
                onChange={(v) => setMeta({ ...meta, type: v })}
                options={recordTypeOptions.map((x) => ({ value: x, label: x }))}
              />
            </FormField>

            <FormField label="Date">
              <DatePicker
                value={meta.date}
                onChange={(v) => setMeta({ ...meta, date: v })}
              />
            </FormField>

            <FormField label="Doctor Name">
              <input
                className={inputBase}
                value={meta.doctor}
                onChange={(e) => setMeta({ ...meta, doctor: e.target.value })}
                placeholder="Dr. Name"
              />
            </FormField>

            <FormField label="File" className="lg:col-span-2">
              <input
                key={fileKey}               // ⬅️ forces reset of the input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm file:rounded-lg file:border-0
                          file:bg-emerald-600 file:px-4 file:py-2 file:text-white hover:file:bg-emerald-700"
              />
            </FormField>


            <div className="flex items-end">
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                disabled={!file || !meta.date || !meta.doctor}
                onClick={handleUpload}
              >
                <Upload className="mr-2 h-4 w-4" /> Upload
              </Button>
            </div>
          </div>
        </section>

        {/* Records Table */}
        <section className="rounded-2xl border bg-white p-6 shadow-card">
          <h2 className="font-semibold text-slate-900 mb-3">Your Records</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="px-4 py-2 text-left">Doctor</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">File</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr><td className="px-4 py-3" colSpan={5}>Loading...</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-3">No records uploaded.</td></tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="odd:bg-slate-50">
                      <td className="px-4 py-2">{r.doctorName}</td>
                      <td className="px-4 py-2"><Pill tone="info">{r.recordType}</Pill></td>
                      <td className="px-4 py-2">{r.fileName}</td>
                      <td className="px-4 py-2">{formatPatientDate(r.recordDate)}</td>

                      <td className="px-4 py-2 flex gap-2">
                        <Button
                          className="bg-white border border-slate-300 text-slate-700"
                          onClick={() => setPreview(r)}
                        >
                          <Eye className="mr-2 h-4 w-4" /> Preview
                        </Button>

                        <Button
                          className="bg-white border border-rose-300 text-rose-700"
                          onClick={() => deleteRecord(r.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

            </table>
          </div>
        </section>

        {/* Preview Modal */}
        {preview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-3xl shadow-lg">
              <div className="flex justify-between p-4 border-b">
                <h3 className="font-semibold">{preview.fileName}</h3>
                <button onClick={() => setPreview(null)}><X /></button>
              </div>

              <div className="p-4">
                {preview.contentType === "application/pdf" ? (
                  <iframe
                    src={preview.fileUrl}
                    className="w-full h-[600px] border rounded"
                  />
                ) : preview.contentType?.startsWith("image/") ? (
                  <img
                    src={preview.fileUrl}
                    alt="preview"
                    className="mx-auto max-h-[600px] rounded shadow"
                  />
                ) : (
                  <div className="p-4 text-center text-slate-600">
                    Preview not available — use Open in New Tab.
                  </div>
                )}
              </div>

              <div className="p-4 border-t flex justify-end">
                <a
                  href={preview.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
                    Open in New Tab
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}

      </AppShell>
    </div>
  );
}
