import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import LearnAppointments from "./pages/LearnAppointments.jsx";
import LearnDocuments from "./pages/LearnDocuments.jsx";
import LearnTasks from "./pages/LearnTasks.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";

/* Guards */
import RequireAuth from "./components/RequireAuth.jsx";

/* Patient */
import PatientDashboard from "./pages/PatientDashboard.jsx";
import PatientAppointments from "./pages/PatientAppointments.jsx";
import PatientRecords from "./pages/PatientRecords.jsx";
import PatientPrescriptions from "./pages/PatientPrescriptions.jsx";
import PatientProfile from "./pages/PatientProfile.jsx";

/* Doctor */
import DoctorDashboard from "./pages/DoctorDashboard.jsx";
import DoctorAppointments from "./pages/DoctorAppointments.jsx";
import DoctorPatients from "./pages/DoctorPatients.jsx";
import DoctorRecords from "./pages/DoctorRecords.jsx";
import DoctorAvailability from "./pages/DoctorAvailability.jsx";
import DoctorProfile from "./pages/DoctorProfile.jsx";

/* Receptionist */
import ReceptionistDashboard from "./pages/ReceptionistDashboard.jsx";
import ReceptionistProfile from "./pages/ReceptionistProfile.jsx";
import ReceptionistRegisterPatient from "./pages/ReceptionistRegisterPatient";

/* Admin */
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminReports from "./pages/AdminReports.jsx";
import AdminMonitoring from "./pages/AdminMonitoring.jsx";
import AdminProfile from "./pages/AdminProfile.jsx";
import AdminUserCreate from "./pages/AdminUserCreate.jsx";
import AdminConsultations from "./pages/AdminConsultations.jsx";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/learn/appointments" element={<LearnAppointments />} />
      <Route path="/learn/documents" element={<LearnDocuments />} />
      <Route path="/learn/tasks" element={<LearnTasks />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/reception/register" element={<ReceptionistRegisterPatient />} />


      {/* Patient (guarded) */}
      <Route
        path="/patient/dashboard"
        element={<RequireAuth roles={["Patient"]}><PatientDashboard /></RequireAuth>}
      />
      <Route
        path="/patient/appointments"
        element={<RequireAuth roles={["Patient"]}><PatientAppointments /></RequireAuth>}
      />
      <Route
        path="/patient/records"
        element={<RequireAuth roles={["Patient"]}><PatientRecords /></RequireAuth>}
      />
      <Route
        path="/patient/prescriptions"
        element={<RequireAuth roles={["Patient"]}><PatientPrescriptions /></RequireAuth>}
      />
      <Route
        path="/patient/profile"
        element={<RequireAuth roles={["Patient"]}><PatientProfile /></RequireAuth>}
      />

      {/* Doctor (guarded) */}
      <Route
        path="/doctor/dashboard"
        element={<RequireAuth roles={["Doctor"]}><DoctorDashboard /></RequireAuth>}
      />
      <Route
        path="/doctor/appointments"
        element={<RequireAuth roles={["Doctor"]}><DoctorAppointments /></RequireAuth>}
      />
      <Route
        path="/doctor/patients"
        element={<RequireAuth roles={["Doctor"]}><DoctorPatients /></RequireAuth>}
      />
      <Route
        path="/doctor/records"
        element={<RequireAuth roles={["Doctor"]}><DoctorRecords /></RequireAuth>}
      />
      <Route
        path="/doctor/availability"
        element={<RequireAuth roles={["Doctor"]}><DoctorAvailability /></RequireAuth>}
      />
      <Route
        path="/doctor/profile"
        element={<RequireAuth roles={["Doctor"]}><DoctorProfile /></RequireAuth>}
      />

      {/* Receptionist (guarded) */}
      <Route
        path="/receptionist/dashboard"
        element={<RequireAuth roles={["Receptionist"]}><ReceptionistDashboard /></RequireAuth>}
      />
      <Route
        path="/receptionist/profile"
        element={<RequireAuth roles={["Receptionist"]}><ReceptionistProfile /></RequireAuth>}
      />

      {/* Admin (guarded) */}
      <Route
        path="/admin/dashboard"
        element={<RequireAuth roles={["Admin"]}><AdminDashboard /></RequireAuth>}
      />
      <Route
        path="/admin/users"
        element={<RequireAuth roles={["Admin"]}><AdminUsers /></RequireAuth>}
      />
      <Route
        path="/admin/users/new"
        element={<RequireAuth roles={["Admin"]}><AdminUserCreate /></RequireAuth>}
      />
      <Route
        path="/admin/reports"
        element={<RequireAuth roles={["Admin"]}><AdminReports /></RequireAuth>}
      />
      <Route
        path="/admin/monitoring"
        element={<RequireAuth roles={["Admin"]}><AdminMonitoring /></RequireAuth>}
      />
      <Route
        path="/admin/consultations"
        element={<RequireAuth roles={["Admin"]}><AdminConsultations /></RequireAuth>}
      />
      <Route
        path="/admin/profile"
        element={<RequireAuth roles={["Admin"]}><AdminProfile /></RequireAuth>}
      />
    </Routes>
  );
}
