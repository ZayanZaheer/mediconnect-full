import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthProvider.jsx";
import { API_CONFIG } from '../config/api.js';

const API_BASE = API_CONFIG.BASE_URL;

const ClinicDataContext = createContext(null);

export function ClinicDataProvider({ children }) {
  const { user } = useAuth();

  const getHeaders = useCallback(() => {
    const headers = {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true"
    };
    if (user?.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }
    return headers;
  }, [user]);

  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [consultationMemos, setConsultationMemos] = useState([]);
  const [doctorSessions, setDoctorSessions] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [waitlists, setWaitlists] = useState([]);

  const fetchAllData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const headers = getHeaders();

      // Default: fetch ALL appointments (safe for Patient, Receptionist, Admin)
      let appointmentUrl = `${API_BASE}/appointments`;

      if (user.role === "Doctor") {
        const doctorsResponse = await fetch(`${API_BASE}/doctors`, { headers });
        const allDoctors = await doctorsResponse.json();

        const myDoctorRecord = allDoctors.find(
          (d) =>
            d.email === user.email ||
            d.name === user.name ||
            d.id === user.doctorId ||
            d.id === user.id
        );

        const realDoctorId = myDoctorRecord?.id || user.doctorId || user.id;

        if (realDoctorId) {
          appointmentUrl = `${API_BASE}/appointments/doctor/${realDoctorId}`;
        }
      }

      // Now fetch everything
      const [docs, apts, memos, sessions, recs, notifs, waits] = await Promise.all([
        fetch(`${API_BASE}/doctors`, { headers }).then((r) => r.json()).catch(() => []),
        fetch(appointmentUrl, { headers }).then((r) => r.json()).catch(() => []),
        fetch(`${API_BASE}/consultationmemos`, { headers }).then((r) => r.json()).catch(() => []),
        fetch(`${API_BASE}/doctorsessions`, { headers }).then((r) => r.json()).catch(() => []),
        fetch(`${API_BASE}/receipts`, { headers }).then((r) => r.json()).catch(() => []),
        fetch(`${API_BASE}/notifications`, { headers }).then((r) => r.json()).catch(() => []),
        fetch(`${API_BASE}/waitlist`, { headers }).then((r) => r.json()).catch(() => []),
      ]);

      setDoctors(docs || []);
      setAppointments(apts || []);
      setConsultationMemos(memos || []);
      setDoctorSessions(sessions || []);
      setReceipts(recs || []);
      setNotifications(notifs || []);
      setWaitlists(waits || []);
    } catch (error) {
      console.error("Error fetching clinic data:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [user, getHeaders]);

  // 🔹 ADD THIS:
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // CREATE APPOINTMENT
  const createAppointment = useCallback(
    async (dto) => {
      try {
        // Check slot availability first
        const slotsResponse = await fetch(
          `${API_BASE}/Appointments/slots?doctorId=${dto.doctorId}&date=${dto.date}`,
          { headers: getHeaders() }
        );
        const slotsData = await slotsResponse.json();

        // Check if slot is full
        const slotFull =
          slotsData.availableSlots?.length === 0 ||
          !slotsData.availableSlots?.includes(dto.time);

        if (slotFull) {
          // Add to waitlist instead
          const waitlistPayload = {
            doctorId: dto.doctorId,
            patientEmail: dto.patientEmail,
            patientName: dto.patientName,
            preferredDate: dto.date,
            appointmentType: dto.type,
          };

          const waitlistResponse = await fetch(`${API_BASE}/Waitlist`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(waitlistPayload),
          });

          if (!waitlistResponse.ok) {
            const error = await waitlistResponse.json();
            throw new Error(error.message || "Failed to add to waitlist");
          }

          await fetchAllData();
          return { type: "waitlist" };
        }

        // Create appointment
        const appointmentPayload = {
          patientName: dto.patientName,
          patientEmail: dto.patientEmail,
          doctorId: dto.doctorId,
          type: dto.type,
          date: dto.date,
          time: dto.time,
          paymentMethod: dto.paymentMethod || "Online",
          paymentChannel: dto.paymentChannel,
          paymentInstrument: dto.paymentInstrument,
          fee: dto.fee,
          insurance: dto.insurance,
        };

        const response = await fetch(`${API_BASE}/Appointments`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(appointmentPayload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to create appointment");
        }

        const newAppointment = await response.json();

        // If autoPay is true, immediately mark as paid
        if (dto.autoPay) {
          await fetch(`${API_BASE}/Appointments/${newAppointment.id}/mark-paid`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
              recordedBy: dto.autoPayRecordedBy || "Online Payment",
              amount: newAppointment.fee,
            }),
          });
        }

        await fetchAllData();
        return { type: "appointment", record: newAppointment };
      } catch (error) {
        console.error("Error creating appointment:", error);
        throw error;
      }
    },
    [fetchAllData, getHeaders]
  );

  // UPDATE APPOINTMENT
  const updateAppointment = useCallback(
    async (id, updates) => {
      try {
        const response = await fetch(`${API_BASE}/Appointments/${id}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to update appointment");
        }

        await fetchAllData();
      } catch (error) {
        console.error("Error updating appointment:", error);
        throw error;
      }
    },
    [fetchAllData, getHeaders]
  );

  // CANCEL APPOINTMENT
  const cancelAppointment = useCallback(
    async (id, { message, doctorId, patientEmail } = {}) => {
      try {
        const response = await fetch(`${API_BASE}/Appointments/${id}`, {
          method: "DELETE",
          headers: getHeaders(),
        });

        if (!response.ok) {
          throw new Error("Failed to cancel appointment");
        }

        // Create notification if message provided
        if (message) {
          await fetch(`${API_BASE}/Notifications`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
              appointmentId: id,
              audiences: ["Doctor", "Patient", "Receptionist"],
              doctorId,
              patientEmail,
              message,
              type: "appointment.cancelled",
            }),
          });
        }

        await fetchAllData();
      } catch (error) {
        console.error("Error cancelling appointment:", error);
        throw error;
      }
    },
    [fetchAllData, getHeaders]
  );

  // MARK APPOINTMENT PAID
  const markAppointmentPaid = useCallback(
    async (id, { recordedBy, amount }) => {
      try {
        const response = await fetch(`${API_BASE}/Appointments/${id}/mark-paid`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            recordedBy,
            amount,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to mark as paid");
        }

        await fetchAllData();
      } catch (error) {
        console.error("Error marking paid:", error);
        throw error;
      }
    },
    [fetchAllData, getHeaders]
  );

  // MARK APPOINTMENT NO SHOW
  const markAppointmentNoShow = useCallback(
    async (id) => {
      try {
        const response = await fetch(`${API_BASE}/Appointments/${id}/no-show`, {
          method: "POST",
          headers: getHeaders(),
        });

        if (!response.ok) {
          throw new Error("Failed to mark as no show");
        }

        await fetchAllData();
      } catch (error) {
        console.error("Error marking no show:", error);
        throw error;
      }
    },
    [fetchAllData, getHeaders]
  );

  const rescheduleAppointment = useCallback(
    async (id, { newDate, newTime }) => {
      try {
        const response = await fetch(`${API_BASE}/Appointments/${id}/reschedule`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            newDate,
            newTime,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to reschedule appointment");
        }

        await fetchAllData();
      } catch (error) {
        console.error("Error rescheduling appointment:", error);
        throw error;
      }
    },
    [fetchAllData, getHeaders]
  );

  const checkInAppointment = useCallback(
    async (id) => {
      try {
        const response = await fetch(`${API_BASE}/Appointments/${id}/check-in`, {
          method: "POST",
          headers: getHeaders(),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to check in");
        }

        await fetchAllData();
      } catch (error) {
        console.error("Error checking in:", error);
        throw error;
      }
    },
    [fetchAllData, getHeaders]
  );

  // START NEXT CONSULTATION
  const startNextConsultation = useCallback(
    async (doctorId) => {
      try {
        await fetch(`${API_BASE}/doctorsessions/${doctorId}/start-next`, {
          method: "POST",
          headers: getHeaders(),
        });

        await fetchAllData();
      } catch (error) {
        console.error("Error starting consultation:", error);
        throw error;
      }
    },
    [fetchAllData, getHeaders]
  );

  // COMPLETE CONSULTATION
  const completeConsultation = useCallback(
    async (doctorId) => {
      try {
        await fetch(`${API_BASE}/doctorsessions/${doctorId}/complete`, {
          method: "POST",
          headers: getHeaders(),
        });

        await fetchAllData();
      } catch (error) {
        console.error("Error completing consultation:", error);
        throw error;
      }
    },
    [fetchAllData, getHeaders]
  );

  // SET DOCTOR BREAK
  const setDoctorBreak = useCallback(
    async (doctorId) => {
      try {
        await fetch(`${API_BASE}/doctorsessions/${doctorId}/break`, {
          method: "POST",
          headers: getHeaders(),
        });

        await fetchAllData();
      } catch (error) {
        console.error("Error setting break:", error);
        throw error;
      }
    },
    [fetchAllData, getHeaders]
  );

  // RESUME DOCTOR
  const resumeDoctor = useCallback(
    async (doctorId) => {
      try {
        await fetch(`${API_BASE}/doctorsessions/${doctorId}/resume`, {
          method: "POST",
          headers: getHeaders(),
        });

        await fetchAllData();
      } catch (error) {
        console.error("Error resuming doctor:", error);
        throw error;
      }
    },
    [fetchAllData, getHeaders]
  );

  // DECLARE EMERGENCY
  const declareEmergency = useCallback(
    async (doctorId, { note, rescheduleTo }) => {
      try {
        await fetch(`${API_BASE}/doctorsessions/${doctorId}/emergency`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ note, rescheduleTo }),
        });

        await fetchAllData();
      } catch (error) {
        console.error("Error declaring emergency:", error);
        throw error;
      }
    },
    [fetchAllData, getHeaders]
  );

  // CALL PATIENT REMINDER
  const callPatientReminder = useCallback(
    async (memoId) => {
      try {
        const memo = consultationMemos.find((m) => m.id === memoId);
        if (!memo) return;

        await fetch(`${API_BASE}/notifications`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            appointmentId: memo.appointmentId,
            audiences: ["Patient"],
            patientEmail: memo.patientEmail,
            message: `Reminder: ${memo.doctorName} is ready to see you. Please proceed to the consultation room.`,
            type: "consultation.reminder",
          }),
        });

        await fetchAllData();
      } catch (error) {
        console.error("Error sending reminder:", error);
        throw error;
      }
    },
    [consultationMemos, fetchAllData, getHeaders]
  );

  // UPDATE MEMO
  const updateMemo = useCallback(
    async (id, updates) => {
      try {
        await fetch(`${API_BASE}/consultationmemos/${id}/status`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            status: updates.status || "InProgress",
            ...updates,
          }),
        });

        await fetchAllData();
      } catch (error) {
        console.error("Error updating memo:", error);
        throw error;
      }
    },
    [fetchAllData, getHeaders]
  );

  const ensureDoctorSession = useCallback(
    async (doctorEmail) => {
      try {
        await fetch(`${API_BASE}/doctorsessions/ensure/${doctorEmail}`, {
          method: 'POST',
          headers: getHeaders(),
        });
      } catch (error) {
        console.error('Error ensuring doctor session:', error);
      }
    },
    [getHeaders]
  );

  // SLOT HELPERS
  const slotCapacity = 1;
  const getSlotKey = useCallback((doctorId, date, time) => {
    return `${doctorId}-${date}-${time}`;
  }, []);

  const value = useMemo(
    () => ({
      loading,
      doctors,
      appointments,
      consultationMemos,
      doctorSessions,
      receipts,
      notifications,
      waitlists,
      createAppointment,
      updateAppointment,
      cancelAppointment,
      markAppointmentPaid,
      markAppointmentNoShow,
      rescheduleAppointment,
      checkInAppointment,
      startNextConsultation,
      completeConsultation,
      setDoctorBreak,
      resumeDoctor,
      declareEmergency,
      callPatientReminder,
      updateMemo,
      ensureDoctorSession,
      slotCapacity,
      getSlotKey,
      refreshData: fetchAllData,
    }),
    [
      loading,
      doctors,
      appointments,
      consultationMemos,
      doctorSessions,
      receipts,
      notifications,
      waitlists,
      createAppointment,
      updateAppointment,
      cancelAppointment,
      markAppointmentPaid,
      markAppointmentNoShow,
      rescheduleAppointment,
      checkInAppointment,
      startNextConsultation,
      completeConsultation,
      setDoctorBreak,
      resumeDoctor,
      declareEmergency,
      callPatientReminder,
      updateMemo,
      ensureDoctorSession,
      getSlotKey,
      fetchAllData,
    ]
  );

  return (
    <ClinicDataContext.Provider value={value}>
      {children}
    </ClinicDataContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useClinicData() {
  const context = useContext(ClinicDataContext);
  if (!context) {
    throw new Error("useClinicData must be used within ClinicDataProvider");
  }
  return context;
}
