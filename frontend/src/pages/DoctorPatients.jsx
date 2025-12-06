import { useMemo, useState } from "react";
import AppShell from "../layout/AppShell.jsx";
import Navbar from "../components/Navbar.jsx";
import SidebarDoctor from "../layout/SidebarDoctor.jsx";
import FormField from "../components/FormField.jsx";
import Button from "../components/Button.jsx";
import Pill from "../components/Pill.jsx";
import { Search, CalendarRange, FileText, History } from "lucide-react";
import { inputWithIcon } from "../lib/ui.js";
import { useClinicData } from "../context/ClinicDataProvider.jsx";
import MemoModal, { memoStatusMeta } from "../components/MemoModal.jsx";
import ReceiptModal from "../components/ReceiptModal.jsx";
import { formatPatientDate } from "../lib/date.js";

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

export default function DoctorPatients() {
  const { consultationMemos, receipts, doctors } = useClinicData();
  const [q, setQ] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const receiptsByAppointment = useMemo(() => {
    const map = new Map();
    receipts.forEach((receipt) => {
      map.set(receipt.appointmentId, receipt);
    });
    return map;
  }, [receipts]);

  const doctorHistory = useMemo(() => {
    return consultationMemos
      .filter((memo) => memo.status !== "Waiting")
      .sort((a, b) => {
        const dateA = new Date(a.completedAt || a.startedAt || a.issuedAt || 0);
        const dateB = new Date(b.completedAt || b.startedAt || b.issuedAt || 0);
        return dateB - dateA;
      });
  }, [consultationMemos]);

  const filtered = useMemo(() => {
    return doctorHistory.filter((memo) => {
      const haystack = `${memo.patientName || ""} ${memo.patientEmail || ""}`.toLowerCase();
      const matchesQuery = haystack.includes(q.toLowerCase());
      const visitDateRaw = memo.completedAt || memo.startedAt || memo.issuedAt;
      const visitDate = normalizeDate(visitDateRaw);
      const afterStart = startDate ? (visitDate ? visitDate >= startDate : false) : true;
      const beforeEnd = endDate ? (visitDate ? visitDate <= endDate : false) : true;
      return matchesQuery && afterStart && beforeEnd;
    });
  }, [doctorHistory, q, startDate, endDate]);

  const activeDoctor = doctors.find((doc) => doc.name && filtered.some((memo) => memo.doctorId === doc.id));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <AppShell sidebar={<SidebarDoctor />} navbar={null}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Patient History</h1>
            <p className="text-sm text-slate-600 mt-1">
              Search completed consultations and open records directly from here.
            </p>
          </div>
          {activeDoctor ? (
            <Pill tone="info">{activeDoctor.name}</Pill>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card md:grid-cols-3">
          <FormField label="Search patient">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Name or email…"
                className={inputWithIcon}
              />
            </div>
          </FormField>
          <FormField label="Start date">
            <div className="relative">
              <CalendarRange className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputWithIcon}
              />
            </div>
          </FormField>
          <FormField label="End date">
            <div className="relative">
              <CalendarRange className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputWithIcon}
              />
            </div>
          </FormField>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Consultations</h2>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{filtered.length} records</p>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Patient</th>
                  <th className="px-4 py-2 text-left font-medium">Doctor</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-left font-medium">Memo #</th>
                  <th className="px-4 py-2 text-left font-medium">Visit date</th>
                  <th className="px-4 py-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-center text-slate-500" colSpan={6}>
                      No records match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((memo) => {
                    const meta = memoStatusMeta[memo.status] ?? memoStatusMeta.Waiting;
                    const visitDate = memo.completedAt || memo.startedAt || memo.issuedAt;
                    const receipt = receiptsByAppointment.get(memo.appointmentId);
                    return (
                      <tr key={memo.id} className="odd:bg-white even:bg-slate-50">
                        <td className="px-4 py-3 text-slate-900">
                          <div className="font-semibold">{memo.patientName || memo.patientEmail}</div>
                          <div className="text-xs text-slate-500">{memo.patientEmail}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{memo.doctorName}</td>
                        <td className="px-4 py-3">
                          <Pill tone={meta.tone}>{meta.label}</Pill>
                        </td>
                        <td className="px-4 py-3 text-slate-700">#{memo.memoNumber}</td>
                        <td className="px-4 py-3 text-slate-600">{visitDate ? formatPatientDate(visitDate.slice(0, 10)) : "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                              onClick={() => setSelectedMemo(memo)}
                            >
                              <FileText className="mr-2 h-4 w-4" /> Memo
                            </Button>
                            {receipt ? (
                              <Button
                                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                onClick={() => setSelectedReceipt(receipt)}
                              >
                                <History className="mr-2 h-4 w-4" /> Receipt
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </AppShell>

      <MemoModal
        memo={selectedMemo}
        receipt={selectedMemo ? receiptsByAppointment.get(selectedMemo.appointmentId) : null}
        onClose={() => setSelectedMemo(null)}
      />
      <ReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
    </div>
  );
}
