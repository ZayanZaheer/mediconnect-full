import { useEffect, useState } from "react";
import AppShell from "../layout/AppShell.jsx";
import Navbar from "../components/Navbar.jsx";
import SidebarAdmin from "../layout/SidebarAdmin.jsx";
import Button from "../components/Button.jsx";
import { API_CONFIG } from '../config/api.js';

const API_BASE = API_CONFIG.BASE_URL;

function Tile({ label, value, helper, status }) {
  const statusColors = {
    healthy: "bg-green-50 border-green-200",
    warning: "bg-yellow-50 border-yellow-200",
    error: "bg-red-50 border-red-200",
    default: "bg-white border-slate-200"
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-card ${statusColors[status] || statusColors.default}`}>
      <div className="text-sm text-slate-600">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
      {helper ? <div className="mt-1 text-xs text-slate-500">{helper}</div> : null}
    </div>
  );
}

function StatCard({ title, items }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <h3 className="text-slate-900 font-semibold mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center">
            <span className="text-sm text-slate-600">{item.label}</span>
            <span className="text-sm font-medium text-slate-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminMonitoring() {
  const [status, setStatus] = useState(null);
  const [latency, setLatency] = useState(null);
  const [errors, setErrors] = useState(null);
  const [storage, setStorage] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchMonitoringData() {
    setLoading(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      };

      console.log('🔍 Fetching monitoring data from:', {
        status: `${API_BASE}/admin/monitoring/status`,
        latency: `${API_BASE}/admin/monitoring/latency`,
        errors: `${API_BASE}/admin/monitoring/errors`,
        storage: `${API_BASE}/admin/monitoring/storage`
      });

      const [statusRes, latencyRes, errorsRes, storageRes] = await Promise.all([
        fetch(`${API_BASE}/admin/monitoring/status`, { headers }).then(async r => {
          console.log('📊 Status response:', r.status, r.statusText);
          if (!r.ok) {
            const text = await r.text();
            console.error('❌ Status endpoint error:', text);
            throw new Error(`Status endpoint failed: ${r.status}`);
          }
          return r.json();
        }),
        fetch(`${API_BASE}/admin/monitoring/latency`, { headers }).then(async r => {
          if (!r.ok) throw new Error(`Latency endpoint failed: ${r.status}`);
          return r.json();
        }),
        fetch(`${API_BASE}/admin/monitoring/errors`, { headers }).then(async r => {
          if (!r.ok) throw new Error(`Errors endpoint failed: ${r.status}`);
          return r.json();
        }),
        fetch(`${API_BASE}/admin/monitoring/storage`, { headers }).then(async r => {
          if (!r.ok) throw new Error(`Storage endpoint failed: ${r.status}`);
          return r.json();
        })
      ]);

      console.log('✅ Monitoring data loaded:', { statusRes, latencyRes, errorsRes, storageRes });

      setStatus(statusRes);
      setLatency(latencyRes);
      setErrors(errorsRes);
      setStorage(storageRes);
    } catch (error) {
      console.error("❌ Error fetching monitoring data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMonitoringData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMonitoringData, 30000);
    return () => clearInterval(interval);
  }, []);

  function getStatusColor(status) {
    return status?.toLowerCase() === "healthy" ? "healthy" : "error";
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <AppShell sidebar={<SidebarAdmin />} navbar={null}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">System Monitoring</h1>
            <p className="text-sm text-slate-600 mt-1">Health and performance indicators.</p>
          </div>
          <Button 
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100" 
            onClick={fetchMonitoringData}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Tile 
            label="System Status" 
            value={status?.status || "Loading..."} 
            helper={status?.database?.status || "Checking..."}
            status={getStatusColor(status?.status)}
          />
          <Tile 
            label="Avg Latency" 
            value={latency?.averageResponseTime || "-- ms"} 
            helper={`p95: ${latency?.statistics?.p95 || "-- ms"}`}
          />
          <Tile 
            label="Error Rate" 
            value={errors?.errorRate || "0%"} 
            helper={`${errors?.last24Hours || 0} errors (24h)`}
          />
          <Tile 
            label="Storage Usage" 
            value={storage?.summary?.usage || "0%"} 
            helper={`${storage?.summary?.used || "0 GB"} / ${storage?.summary?.total || "0 GB"}`}
          />
        </div>

        {/* System Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatCard 
            title="System Information"
            items={[
              { label: "Uptime", value: status?.uptime || "00:00:00" },
              { label: "Version", value: status?.version || "N/A" },
              { label: "Environment", value: status?.environment || "N/A" },
              { label: "Database", value: status?.database?.provider || "N/A" },
              { label: "DB Response Time", value: status?.database?.responseTime || "-- ms" },
              { label: "Memory Used", value: `${status?.memory?.usedMB || 0} MB` }
            ]}
          />

          <StatCard 
            title="Service Status"
            items={[
              { label: "Appointment Service", value: status?.services?.appointmentService || "Unknown" },
              { label: "User Service", value: status?.services?.userService || "Unknown" },
              { label: "Doctor Service", value: status?.services?.doctorService || "Unknown" },
              { label: "Total Users", value: status?.dataCounts?.users || 0 },
              { label: "Total Doctors", value: status?.dataCounts?.doctors || 0 },
              { label: "Total Appointments", value: status?.dataCounts?.appointments || 0 }
            ]}
          />
        </div>

        {/* Latency Details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h3 className="text-slate-900 font-semibold mb-4">API Latency Breakdown</h3>
          <div className="space-y-3">
            {latency?.endpoints?.map((endpoint, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-slate-100 pb-2">
                <div>
                  <div className="text-sm font-medium text-slate-900">{endpoint.endpoint}</div>
                  <div className="text-xs text-slate-500">{endpoint.requestCount} requests</div>
                </div>
                <div className="text-sm font-semibold text-slate-900">{endpoint.avgLatency}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-xs text-slate-500">Min</div>
                <div className="text-sm font-semibold text-slate-900">{latency?.statistics?.min || "-- ms"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Avg</div>
                <div className="text-sm font-semibold text-slate-900">{latency?.statistics?.avg || "-- ms"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Max</div>
                <div className="text-sm font-semibold text-slate-900">{latency?.statistics?.max || "-- ms"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">P95</div>
                <div className="text-sm font-semibold text-slate-900">{latency?.statistics?.p95 || "-- ms"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">P99</div>
                <div className="text-sm font-semibold text-slate-900">{latency?.statistics?.p99 || "-- ms"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Errors */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h3 className="text-slate-900 font-semibold mb-4">Recent Errors</h3>
          {errors?.errors?.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {errors.errors.slice(0, 10).map((error) => (
                <div key={error.id} className="border-l-4 border-red-500 bg-red-50 p-3 rounded">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">{error.endpoint}</div>
                      <div className="text-xs text-slate-600 mt-1">{error.message}</div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(error.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">{error.level}</span>
                    <span className="text-xs px-2 py-1 bg-slate-100 text-slate-800 rounded">HTTP {error.statusCode}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">No errors in the last 24 hours</p>
              <p className="text-xs mt-1">✓ System running smoothly</p>
            </div>
          )}
          {errors?.errorsByType && Object.keys(errors.errorsByType).length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Errors by Type</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(errors.errorsByType).map(([type, count]) => (
                  <span key={type} className="text-xs px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
                    {type}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Storage Details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h3 className="text-slate-900 font-semibold mb-4">Database Storage</h3>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">Total Database Size</span>
              <span className="font-semibold text-slate-900">{storage?.database?.size || "0 MB"}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">Total Records</span>
              <span className="font-semibold text-slate-900">{storage?.database?.totalRows?.toLocaleString() || 0}</span>
            </div>
          </div>
          
          <h4 className="text-sm font-medium text-slate-700 mb-3">Tables</h4>
          <div className="space-y-2">
            {storage?.database?.tables?.map((table, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                <span className="text-slate-700">{table.name}</span>
                <div className="text-right">
                  <div className="font-medium text-slate-900">{table.rows} rows</div>
                  <div className="text-xs text-slate-500">{table.size}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Disk Usage</h4>
            <div className="bg-slate-100 rounded-full h-3 overflow-hidden mb-2">
              <div 
                className="bg-rose-600 h-full transition-all duration-500"
                style={{ width: storage?.disk?.usagePercentage || "0%" }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>{storage?.disk?.used || "0 GB"} used</span>
              <span>{storage?.disk?.free || "0 GB"} free</span>
            </div>
          </div>
        </div>

        {/* Auto-refresh notice */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-900">
            ℹ️ This dashboard auto-refreshes every 30 seconds. Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </AppShell>
    </div>
  );
}