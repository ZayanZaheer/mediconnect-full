/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import AppShell from "../layout/AppShell.jsx";
import Navbar from "../components/Navbar.jsx";
import SidebarAdmin from "../layout/SidebarAdmin.jsx";
import Button from "../components/Button.jsx";
import Select from "../components/Select.jsx";
import FormField from "../components/FormField.jsx";
import { Download, TrendingUp, Users, Calendar, DollarSign } from "lucide-react";

const API_BASE = "http://100.26.176.5:5000/api";

function StatTile({ icon: Icon, label, value, change }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-600">{label}</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
          {change && (
            <div className="mt-1 text-xs text-green-600">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              {change}
            </div>
          )}
        </div>
        {Icon && <Icon className="h-8 w-8 text-slate-400" />}
      </div>
    </div>
  );
}

function TableCard({ title, headers, rows, emptyMessage }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <h3 className="text-slate-900 font-semibold mb-4">{title}</h3>
      {rows && rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200">
              <tr>
                {headers.map((header, idx) => (
                  <th key={idx} className="text-left py-2 px-3 font-medium text-slate-700">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="py-3 px-3 text-slate-900">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          <p className="text-sm">{emptyMessage || "No data available"}</p>
        </div>
      )}
    </div>
  );
}

export default function AdminReports() {
  const [reportType, setReportType] = useState("appointments");
  const [range, setRange] = useState("last_30");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const reportTypeOptions = [
    { value: "appointments", label: "Appointments Report" },
    { value: "patients", label: "Patients Report" },
    { value: "doctors", label: "Doctors Report" },
    { value: "payments", label: "Payments Report" },
  ];

  const rangeOptions = [
    { value: "last_7", label: "Last 7 days" },
    { value: "last_30", label: "Last 30 days" },
    { value: "last_90", label: "Last 90 days" },
    { value: "custom", label: "Custom Range" },
  ];

  async function fetchReport() {
    setLoading(true);
    try {
      if (range === "custom" && (!startDate || !endDate)) {
        setLoading(false);
        return alert("Please select both start and end dates for a custom range.");
      }
      if (startDate && endDate && startDate > endDate) {
        setLoading(false);
        return alert("Start date must be before end date.");
      }

      let url = `${API_BASE}/admin/reports/${reportType}`;
      const params = new URLSearchParams();

      if (range === "custom" && startDate && endDate) {
        params.append("startDate", startDate);
        params.append("endDate", endDate);
      } else if (reportType === "appointments") {
        params.append("range", range);
      } else if (startDate && endDate) {
        params.append("startDate", startDate);
        params.append("endDate", endDate);
      }

      const response = await fetch(`${url}?${params.toString()}`);
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error("Error fetching report:", error);
      alert("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  }

  async function exportReport(format) {
    try {
      const params = new URLSearchParams();
      params.append("type", reportType);
      
      if (range === "custom" && (!startDate || !endDate)) {
        return alert("Please select both start and end dates for a custom range.");
      }
      if (startDate && endDate && startDate > endDate) {
        return alert("Start date must be before end date.");
      }

      if (range === "custom" && startDate && endDate) {
        params.append("startDate", startDate);
        params.append("endDate", endDate);
      } else if (startDate && endDate) {
        params.append("startDate", startDate);
        params.append("endDate", endDate);
      }

      const response = await fetch(`${API_BASE}/admin/reports/export/${format}?${params.toString()}`);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${reportType}_report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting report:", error);
      alert("Failed to export report");
    }
  }

  useEffect(() => {
    fetchReport();
  }, []);

  function renderAppointmentsReport() {
    if (!reportData) return null;

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatTile 
            icon={Calendar} 
            label="Total Appointments" 
            value={reportData.summary?.totalAppointments || 0} 
          />
          <StatTile 
            icon={Calendar} 
            label="Completed" 
            value={reportData.summary?.completedAppointments || 0} 
          />
          <StatTile 
            icon={Calendar} 
            label="Cancelled" 
            value={reportData.summary?.cancelledAppointments || 0} 
          />
          <StatTile 
            icon={Calendar} 
            label="Pending" 
            value={reportData.summary?.pendingAppointments || 0} 
          />
          <StatTile 
            icon={Calendar} 
            label="No Show" 
            value={reportData.summary?.noShowAppointments || 0} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TableCard
            title="Top Doctors by Appointments"
            headers={["Doctor", "Appointments", "Completion Rate"]}
            rows={reportData.byDoctor?.slice(0, 5).map(d => [
              d.doctorName,
              d.appointmentCount,
              `${d.completionRate.toFixed(1)}%`
            ])}
            emptyMessage="No doctor data available"
          />

          <TableCard
            title="Busy Hours"
            headers={["Time Slot", "Appointments"]}
            rows={reportData.busyHours?.map(h => [h.hour, h.count])}
            emptyMessage="No busy hour data available"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h3 className="text-slate-900 font-semibold mb-4">Appointment Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {reportData.byType && Object.entries(reportData.byType).map(([type, count]) => (
              <div key={type} className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-semibold text-slate-900">{count}</div>
                <div className="text-sm text-slate-600 mt-1">{type}</div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  function renderPatientsReport() {
    if (!reportData) return null;

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatTile 
            icon={Users} 
            label="Total Patients" 
            value={reportData.summary?.totalPatients || 0} 
          />
          <StatTile 
            icon={Users} 
            label="New Patients" 
            value={reportData.summary?.newPatients || 0} 
          />
          <StatTile 
            icon={Users} 
            label="Active" 
            value={reportData.summary?.activePatients || 0} 
          />
          <StatTile 
            icon={Users} 
            label="Inactive" 
            value={reportData.summary?.inactivePatients || 0} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <h3 className="text-slate-900 font-semibold mb-4">Demographics by Gender</h3>
            <div className="space-y-3">
              {reportData.demographics?.byGender && Object.entries(reportData.demographics.byGender).map(([gender, count]) => (
                <div key={gender} className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">{gender}</span>
                  <span className="text-sm font-semibold text-slate-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <h3 className="text-slate-900 font-semibold mb-4">Age Distribution</h3>
            <div className="space-y-3">
              {reportData.demographics?.byAgeGroup && Object.entries(reportData.demographics.byAgeGroup).map(([age, count]) => (
                <div key={age} className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">{age}</span>
                  <span className="text-sm font-semibold text-slate-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <TableCard
          title="Top Patients by Appointments"
          headers={["Patient Name", "Email", "Appointments", "Last Visit"]}
          rows={reportData.topPatients?.map(p => [
            p.patientName,
            p.patientEmail,
            p.appointmentCount,
            p.lastVisit
          ])}
          emptyMessage="No patient data available"
        />
      </>
    );
  }

  function renderDoctorsReport() {
    if (!reportData) return null;

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatTile 
            icon={Users} 
            label="Total Doctors" 
            value={reportData.summary?.totalDoctors || 0} 
          />
          <StatTile 
            icon={Users} 
            label="Active Doctors" 
            value={reportData.summary?.activeDoctors || 0} 
          />
          <StatTile 
            icon={Calendar} 
            label="Total Consultations" 
            value={reportData.summary?.totalConsultations || 0} 
          />
        </div>

        <TableCard
          title="Doctor Performance"
          headers={["Doctor", "Specialty", "Total Appts", "Completed", "Completion Rate", "Avg Time", "Revenue"]}
          rows={reportData.doctors?.map(d => [
            d.doctorName,
            d.specialty,
            d.statistics.totalAppointments,
            d.statistics.completedAppointments,
            d.statistics.completionRate,
            d.statistics.averageConsultationTime,
            `RM ${d.revenue.totalEarned.toFixed(2)}`
          ])}
          emptyMessage="No doctor data available"
        />

        {reportData.topPerformers && reportData.topPerformers.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <h3 className="text-slate-900 font-semibold mb-4">🏆 Top Performers</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reportData.topPerformers.map((doctor, idx) => (
                <div key={idx} className="text-center p-4 bg-gradient-to-br from-rose-50 to-orange-50 rounded-lg">
                  <div className="text-3xl mb-2">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                  </div>
                  <div className="font-semibold text-slate-900">{doctor.doctorName}</div>
                  <div className="text-sm text-slate-600 mt-1">{doctor.completionRate} completion</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  }

  function renderPaymentsReport() {
    if (!reportData) return null;

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatTile 
            icon={DollarSign} 
            label="Total Revenue" 
            value={`RM ${reportData.summary?.totalRevenue?.toFixed(2) || 0}`} 
          />
          <StatTile 
            icon={DollarSign} 
            label="Transactions" 
            value={reportData.summary?.totalTransactions || 0} 
          />
          <StatTile 
            icon={DollarSign} 
            label="Avg Transaction" 
            value={`RM ${reportData.summary?.averageTransactionValue?.toFixed(2) || 0}`} 
          />
          <StatTile 
            icon={TrendingUp} 
            label="Success Rate" 
            value={reportData.summary?.successRate || "0%"} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <h3 className="text-slate-900 font-semibold mb-4">Payment Methods</h3>
            <div className="space-y-3">
              {reportData.byPaymentMethod?.map((method, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-slate-900">{method.method}</div>
                    <div className="text-xs text-slate-500">{method.percentage}</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    RM {method.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <h3 className="text-slate-900 font-semibold mb-4">Insurance Breakdown</h3>
            <div className="space-y-3">
              {reportData.byInsurance?.map((ins, idx) => (
                <div key={idx} className="border-b border-slate-100 pb-2">
                  <div className="text-sm font-medium text-slate-900">{ins.provider}</div>
                  <div className="grid grid-cols-3 gap-2 mt-1 text-xs">
                    <div>
                      <div className="text-slate-500">Billed</div>
                      <div className="font-medium">RM {ins.totalBilled.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Covered</div>
                      <div className="font-medium text-green-600">RM {ins.insuranceCovered.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Patient</div>
                      <div className="font-medium text-orange-600">RM {ins.patientPaid.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h3 className="text-slate-900 font-semibold mb-4">Daily Revenue Trend</h3>
          <div className="h-64 flex items-end justify-around gap-2">
            {reportData.dailyRevenue?.slice(-14).map((day, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-rose-600 rounded-t hover:bg-rose-700 transition-all cursor-pointer"
                  style={{ 
                    height: `${(day.amount / Math.max(...reportData.dailyRevenue.map(d => d.amount))) * 200}px`,
                    minHeight: "10px"
                  }}
                  title={`${day.date}: RM ${day.amount.toFixed(2)}`}
                />
                <div className="text-xs text-slate-500 mt-2 transform -rotate-45 origin-top-left">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <AppShell sidebar={<SidebarAdmin />} navbar={null}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Reports & Analytics</h1>
            <p className="text-sm text-slate-600 mt-1">Comprehensive insights and data exports.</p>
          </div>
          <div className="flex gap-2">
            <Button 
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100" 
              onClick={() => exportReport("csv")}
            >
              <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
            <Button 
              className="bg-rose-600 text-white hover:bg-rose-700" 
              onClick={() => exportReport("pdf")}
            >
              <Download className="mr-2 h-4 w-4" /> PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <FormField label="Report Type">
              <Select
                className="w-full"
                value={reportType}
                onChange={setReportType}
                options={reportTypeOptions}
              />
            </FormField>
            <FormField label="Date Range">
              <Select
                className="w-full"
                value={range}
                onChange={setRange}
                options={rangeOptions}
              />
            </FormField>
            {range === "custom" && (
              <>
                <FormField label="Start Date">
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </FormField>
                <FormField label="End Date">
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </FormField>
              </>
            )}
            <div className="flex items-end">
              <Button 
                className="bg-rose-600 text-white hover:bg-rose-700 w-full" 
                onClick={fetchReport} 
                disabled={loading}
              >
                {loading ? "Loading..." : "Generate Report"}
              </Button>
            </div>
          </div>
        </div>

        {/* Report Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-rose-600 border-t-transparent"></div>
            <p className="mt-4 text-slate-600">Loading report data...</p>
          </div>
        ) : reportData ? (
          <>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-900">
                📊 Report Period: {reportData.period?.startDate} to {reportData.period?.endDate}
              </p>
            </div>

            {reportType === "appointments" && renderAppointmentsReport()}
            {reportType === "patients" && renderPatientsReport()}
            {reportType === "doctors" && renderDoctorsReport()}
            {reportType === "payments" && renderPaymentsReport()}
          </>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <p>Select report parameters and click "Generate Report" to view data</p>
          </div>
        )}
      </AppShell>
    </div>
  );
}
