import { useEffect, useMemo, useState } from "react";
import AppShell from "../layout/AppShell.jsx";
import Navbar from "../components/Navbar.jsx";
import SidebarPatient from "../layout/SidebarPatient.jsx";
import Button from "../components/Button.jsx";
import Select from "../components/Select.jsx";
import DatePicker from "../components/DatePicker.jsx";
import FormField from "../components/FormField.jsx";
import Pill from "../components/Pill.jsx";
import { Search, Eye, X } from "lucide-react";
import { formatPatientDate } from "../lib/date.js";
import { inputWithIcon } from "../lib/ui.js";
import { fetchMedicalHistory } from "../lib/medicalApi.js";
import { useAuth } from "../context/AuthProvider.jsx";
import { Download } from "lucide-react";
import { API_CONFIG } from '../config/api.js';

function fullUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return API_CONFIG.BASE_URL + path;
}

function toDateOnly(d) {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}


function Modal({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-slate-900 font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer ? <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}

export default function PatientPrescriptions() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        // Patient sees their own prescriptions:
        const data = await fetchMedicalHistory(user.email);

        // Filter only prescription entries
        const prescriptions = data.filter(e => e.type === "Prescription");

        // Normalize field names to match the UI:
        const mapped = prescriptions.map(e => ({
          id: e.id,
          name: e.medicine || e.name,
          dosage: e.dosageInstructions,
          doctor: e.doctorName,
          date: e.date,
          notes: e.notes,
          fileUrl: e.fileUrl
        }));

        setItems(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (user?.email) load();
  }, [user]);

  // filters
  const [q, setQ] = useState("");
  const [doctor, setDoctor] = useState("");
  const [date, setDate] = useState("");

  // details modal
  const [open, setOpen] = useState(null); // selected prescription

  const doctors = useMemo(() => {
    const s = new Set(items.map(i => i.doctor));
    return Array.from(s).sort();
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter(i => {
      if (doctor && i.doctor !== doctor) return false;

      if (date && toDateOnly(i.date) !== toDateOnly(date)) return false;

      if (q) {
        const s = `${i.name} ${i.dosage} ${i.doctor}`.toLowerCase();
        if (!s.includes(q.toLowerCase())) return false;
      }

      return true;
    });
  }, [items, doctor, date, q]);


  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <AppShell sidebar={<SidebarPatient />} navbar={null}>
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Prescriptions</h1>
          <p className="text-sm text-slate-600 mt-1">Your prescribed medications, dosage, and prescribing doctor.</p>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <FormField label="Search" className="md:col-span-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Medicine, dosage, doctor…"
                  className={inputWithIcon}
                />
              </div>
            </FormField>
            <FormField label="Doctor">
              <Select
                className="w-full"
                value={doctor}
                onChange={setDoctor}
                options={[
                  { value: "", label: "All doctors" },
                  ...doctors.map((d) => ({ value: d, label: d })),
                ]}
              />
            </FormField>
            <FormField label="Date">
              <DatePicker
                className="w-full"
                value={date}
                onChange={setDate}
                placeholder="Any date"
              />
            </FormField>
          </div>
        </div>

        {/* Table */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-slate-900 font-medium mb-3">Prescription History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Doctor</th>
                  <th className="px-4 py-2 text-left font-medium">Medicine</th>
                  <th className="px-4 py-2 text-left font-medium">Dosage</th>
                  <th className="px-4 py-2 text-left font-medium">Date</th>
                  <th className="px-4 py-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="px-4 py-3 text-slate-500" colSpan={5}>Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td className="px-4 py-3 text-slate-500" colSpan={5}>No prescriptions match your filters.</td></tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="odd:bg-slate-50">
                      <td className="px-4 py-2">{p.doctor}</td>
                      <td className="px-4 py-2">{p.name}</td>
                      <td className="px-4 py-2">
                        <Pill tone="info">{p.dosage}</Pill>
                      </td>
                      <td className="px-4 py-2">{formatPatientDate(p.date)}</td>
                      <td className="px-4 py-2">
                        <Button
                          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                          onClick={() => setOpen(p)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Details Modal */}
        {open && (
          <Modal title="Prescription Details" onClose={() => setOpen(null)} footer={
            <Button
              onClick={async () => {
                if (open.fileUrl) {
                  try {
                    const url = fullUrl(open.fileUrl);
                    // Fetch with ngrok header to bypass warning
                    const response = await fetch(url, {
                      headers: {
                        'ngrok-skip-browser-warning': 'true'
                      }
                    });
                    
                    if (!response.ok) throw new Error('Failed to fetch PDF');
                    
                    const blob = await response.blob();
                    const blobUrl = window.URL.createObjectURL(blob);
                    window.open(blobUrl, '_blank');
                  } catch (error) {
                    console.error('Error opening PDF:', error);
                    alert('Failed to open PDF. Please try again.');
                  }
                }
              }}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={!open.fileUrl}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>

          }>
            <div className="space-y-2 text-sm text-slate-700">
              <div>
                <span className="font-medium text-slate-800">Date:</span>{" "}
                {formatPatientDate(open.date)}
              </div>

              <div>
                <span className="font-medium text-slate-800">Doctor:</span>{" "}
                {open.doctor}
              </div>

              <div>
                <span className="font-medium text-slate-800">Medicine:</span>{" "}
                {open.name}
              </div>

              <div>
                <span className="font-medium text-slate-800">Dosage:</span>{" "}
                {open.dosage}
              </div>

              {open.notes && (
                <div>
                  <span className="font-medium text-slate-800">Notes:</span>{" "}
                  {open.notes}
                </div>
              )}

              {/* PDF PREVIEW */}
              {open.fileUrl ? (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-600 mb-2">
                    Click "Download PDF" button above to view the prescription document.
                  </p>
                </div>
              ) : (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  PDF not attached.
                </div>
              )}
            </div>

          </Modal>
        )}
      </AppShell>
    </div>
  );
}
