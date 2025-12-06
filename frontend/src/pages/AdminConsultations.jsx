import { useEffect, useMemo, useState } from "react";
import AppShell from "../layout/AppShell.jsx";
import Navbar from "../components/Navbar.jsx";
import SidebarAdmin from "../layout/SidebarAdmin.jsx";
import ConsultationBoard from "../components/ConsultationBoard.jsx";
import Pill from "../components/Pill.jsx";
import Select from "../components/Select.jsx";
import Button from "../components/Button.jsx";
import { useClinicData } from "../context/ClinicDataProvider.jsx";
import MemoModal, { memoStatusMeta } from "../components/MemoModal.jsx";
import ReceiptModal from "../components/ReceiptModal.jsx";
import { formatPatientDate } from "../lib/date.js";
import { FileText, History } from "lucide-react";

export default function AdminConsultations() {
  const {
    doctors,
    consultationMemos,
    doctorSessions,
    receipts,
  } = useClinicData();
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || "");
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    if (!selectedDoctorId && doctors[0]) {
      setSelectedDoctorId(doctors[0].id);
    } else if (selectedDoctorId && !doctors.find((doc) => doc.id === selectedDoctorId) && doctors[0]) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [doctors, selectedDoctorId]);

  const doctorOptions = useMemo(
    () =>
      doctors.map((doctor) => ({
        value: doctor.id,
        label: `${doctor.name} (${doctor.specialty})`,
      })),
    [doctors]
  );

  const activeDoctor = useMemo(
    () => doctors.find((doc) => doc.id === selectedDoctorId) || doctors[0] || null,
    [doctors, selectedDoctorId]
  );

  const session = useMemo(
    () => doctorSessions.find((item) => item.doctorId === activeDoctor?.id) || null,
    [doctorSessions, activeDoctor?.id]
  );

  const doctorMemos = useMemo(
    () =>
      consultationMemos
        .filter((memo) => memo.doctorId === activeDoctor?.id)
        .sort((a, b) => (b.issuedAt || "").localeCompare(a.issuedAt || "")),
    [consultationMemos, activeDoctor?.id]
  );

  const stats = useMemo(() => {
    const waiting = doctorMemos.filter((memo) => memo.status === "Waiting").length;
    const inProgress = doctorMemos.filter((memo) => memo.status === "InProgress").length;
    const rescheduled = doctorMemos.filter((memo) => memo.status === "Rescheduled").length;
    const completedToday = doctorMemos.filter(
      (memo) => memo.status === "Completed" && memo.completedAt?.slice(0, 10) === new Date().toISOString().slice(0, 10)
    ).length;
    return { waiting, inProgress, rescheduled, completedToday };
  }, [doctorMemos]);

  const receiptsByAppointment = useMemo(() => {
    const map = new Map();
    receipts.forEach((receipt) => {
      map.set(receipt.appointmentId, receipt);
    });
    return map;
  }, [receipts]);

  if (!activeDoctor) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <AppShell sidebar={<SidebarAdmin />} navbar={null}>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-600 shadow-card">
            No doctors found. Add a doctor account to view consultation details.
          </div>
        </AppShell>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <AppShell sidebar={<SidebarAdmin />} navbar={null}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Consultation Details</h1>
            <p className="mt-1 text-sm text-slate-600">
              Monitor live sessions, queue health, and consultation history across the clinic.
            </p>
          </div>
          <div className="md:w-80">
            <Select
              value={selectedDoctorId}
              onChange={setSelectedDoctorId}
              options={doctorOptions}
              placeholder="Select doctor"
              maxVisible={5}
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <p className="text-xs uppercase tracking-wide text-slate-500">Waiting</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.waiting}</p>
            <p className="text-xs text-slate-500">Patients ready for consultation</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <p className="text-xs uppercase tracking-wide text-slate-500">In consultation</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.inProgress}</p>
            <p className="text-xs text-slate-500">Currently with doctor</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <p className="text-xs uppercase tracking-wide text-slate-500">Rescheduled</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.rescheduled}</p>
            <p className="text-xs text-slate-500">Pending follow-up</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <p className="text-xs uppercase tracking-wide text-slate-500">Completed today</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.completedToday}</p>
            <p className="text-xs text-slate-500">Finished consultations</p>
          </div>
        </div>

        <ConsultationBoard doctorId={activeDoctor.id} className="mt-6" />

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-slate-900 font-semibold">Consultation history</h2>
              <p className="text-sm text-slate-500">Last 20 memos for {activeDoctor.name}</p>
            </div>
          </div>
          {doctorMemos.length === 0 ? (
            <p className="text-sm text-slate-500">No consultation history yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Memo</th>
                    <th className="px-4 py-2 text-left font-medium">Patient</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                    <th className="px-4 py-2 text-left font-medium">Issued</th>
                    <th className="px-4 py-2 text-left font-medium">Updated</th>
                    <th className="px-4 py-2 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorMemos.slice(0, 20).map((memo) => {
                    const meta = memoStatusMeta[memo.status] ?? memoStatusMeta.Waiting;
                    const receipt = receiptsByAppointment.get(memo.appointmentId);
                    return (
                      <tr key={memo.id} className="odd:bg-white even:bg-slate-50">
                        <td className="px-4 py-2 font-medium text-slate-900">#{memo.memoNumber}</td>
                        <td className="px-4 py-2 text-slate-700">
                          <div>{memo.patientName || memo.patientEmail}</div>
                          <div className="text-xs text-slate-400">{memo.patientEmail}</div>
                        </td>
                        <td className="px-4 py-2">
                          <Pill tone={meta.tone}>{meta.label}</Pill>
                        </td>
                        <td className="px-4 py-2 text-slate-600">
                          {memo.issuedAt ? formatPatientDate(memo.issuedAt.slice(0, 10)) : "—"}
                        </td>
                        <td className="px-4 py-2 text-slate-600">
                          {memo.completedAt
                            ? formatPatientDate(memo.completedAt.slice(0, 10))
                            : memo.startedAt
                            ? formatPatientDate(memo.startedAt.slice(0, 10))
                            : "—"}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                              onClick={() => setSelectedMemo(memo)}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Memo
                            </Button>
                            <Button
                              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                              disabled={!receipt}
                              onClick={() => receipt && setSelectedReceipt(receipt)}
                            >
                              <History className="mr-2 h-4 w-4" />
                              Receipt
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
