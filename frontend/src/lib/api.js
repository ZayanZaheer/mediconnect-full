import { API_CONFIG } from '../config/api.js';

const API_BASE = API_CONFIG.BASE_URL;

export const api = {
  // Auth
  login: (credentials) => {
    // Use Lambda function if available, otherwise fallback to backend
    const url = API_CONFIG.LAMBDA.LOGIN || `${API_BASE}/auth/login`;
    
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    }).then(r => r.json());
  },
  
  register: (data) => {
    // Use Lambda function if available, otherwise fallback to backend
    const url = API_CONFIG.LAMBDA.REGISTER || `${API_BASE}/auth/register`;
    
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json());
  },
  
  // Appointments
  getAppointments: (params) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/appointments?${query}`).then(r => r.json());
  },
  
  getAppointmentsByPatient: (email) =>
    fetch(`${API_BASE}/appointments/patient/${email}`).then(r => r.json()),
  
  getAppointmentsByDoctor: (doctorId) =>
    fetch(`${API_BASE}/appointments/doctor/${doctorId}`).then(r => r.json()),
  
  getAvailableSlots: (doctorId, date) =>
    fetch(`${API_BASE}/appointments/slots?doctorId=${doctorId}&date=${date}`).then(r => r.json()),
  
  createAppointment: (data) =>
    fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  rescheduleAppointment: (id, data) =>
    fetch(`${API_BASE}/appointments/${id}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  checkInAppointment: (id) =>
    fetch(`${API_BASE}/appointments/${id}/check-in`, {
      method: 'POST'
    }).then(r => r.json()),
  
  markNoShow: (id) =>
    fetch(`${API_BASE}/appointments/${id}/no-show`, {
      method: 'POST'
    }).then(r => r.json()),
  
  // Doctors
  getDoctors: () =>
    fetch(`${API_BASE}/doctors`).then(r => r.json()),
  
  getDoctor: (id) =>
    fetch(`${API_BASE}/doctors/${id}`).then(r => r.json()),
  
  updateDoctorAvailability: (id, data) =>
    fetch(`${API_BASE}/doctors/${id}/availability`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  // Users
  getUsers: () =>
    fetch(`${API_BASE}/users`).then(r => r.json()),
  
  getUser: (email) =>
    fetch(`${API_BASE}/users/${email}`).then(r => r.json()),
  
  createUser: (data) =>
    fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  updateUser: (email, data) =>
    fetch(`${API_BASE}/users/${email}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  deleteUser: (email) =>
    fetch(`${API_BASE}/users/${email}`, {
      method: 'DELETE'
    }),
  
  searchUsers: (keyword) =>
    fetch(`${API_BASE}/users/search?keyword=${keyword}`).then(r => r.json()),
  
  // Consultation Memos
  getConsultationMemos: (doctorId) =>
    fetch(`${API_BASE}/consultationmemos?doctorId=${doctorId}`).then(r => r.json()),
  
  updateMemoStatus: (id, data) =>
    fetch(`${API_BASE}/consultationmemos/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  // Doctor Sessions
  getDoctorSession: (doctorId) =>
    fetch(`${API_BASE}/doctorsessions/${doctorId}`).then(r => r.json()),
  
  updateDoctorSession: (doctorId, data) =>
    fetch(`${API_BASE}/doctorsessions/${doctorId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  startNextPatient: (doctorId) =>
    fetch(`${API_BASE}/doctorsessions/${doctorId}/start-next`, {
      method: 'POST'
    }).then(r => r.json()),
  
  completeConsultation: (doctorId) =>
    fetch(`${API_BASE}/doctorsessions/${doctorId}/complete`, {
      method: 'POST'
    }).then(r => r.json()),
  
  // Receipts
  getReceipts: (params) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/receipts?${query}`).then(r => r.json());
  },
  
  getReceiptByAppointment: (appointmentId) =>
    fetch(`${API_BASE}/receipts/appointment/${appointmentId}`).then(r => r.json()),
  
  // Notifications
  getNotifications: (audiences, doctorId) => {
    let url = `${API_BASE}/notifications?`;
    if (audiences) url += `audiences=${audiences}&`;
    if (doctorId) url += `doctorId=${doctorId}`;
    return fetch(url).then(r => r.json());
  },
  
  markNotificationRead: (id) =>
    fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT'
    }).then(r => r.json()),
  
  // Payments
  initiatePayment: (data) =>
    fetch(`${API_BASE}/payments/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  confirmPayment: (sessionId, data) =>
    fetch(`${API_BASE}/payments/${sessionId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  markPaid: (appointmentId) =>
    fetch(`${API_BASE}/payments/${appointmentId}/mark-paid`, {
      method: 'POST'
    }).then(r => r.json()),
  
  // Waitlist
  getWaitlist: (doctorId) =>
    fetch(`${API_BASE}/waitlist?doctorId=${doctorId}`).then(r => r.json()),
  
  createWaitlist: (data) =>
    fetch(`${API_BASE}/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  promoteWaitlist: (id) =>
    fetch(`${API_BASE}/waitlist/${id}/promote`, {
      method: 'POST'
    }).then(r => r.json()),
  
  // Admin Monitoring
  getMonitoringStatus: () =>
    fetch(`${API_BASE}/admin/monitoring/status`).then(r => r.json()),
  
  getMonitoringLatency: () =>
    fetch(`${API_BASE}/admin/monitoring/latency`).then(r => r.json()),
  
  getMonitoringErrors: () =>
    fetch(`${API_BASE}/admin/monitoring/errors`).then(r => r.json()),
  
  getMonitoringStorage: () =>
    fetch(`${API_BASE}/admin/monitoring/storage`).then(r => r.json()),
  
  // Admin Reports
  getAppointmentsReport: (range) =>
    fetch(`${API_BASE}/admin/reports/appointments?range=${range}`).then(r => r.json()),
  
  getPatientsReport: () =>
    fetch(`${API_BASE}/admin/reports/patients`).then(r => r.json()),
  
  getDoctorsReport: () =>
    fetch(`${API_BASE}/admin/reports/doctors`).then(r => r.json()),
  
  getPaymentsReport: () =>
    fetch(`${API_BASE}/admin/reports/payments`).then(r => r.json()),
  
  exportCSV: (type, startDate, endDate) =>
    `${API_BASE}/admin/reports/export/csv?type=${type}&startDate=${startDate}&endDate=${endDate}`,
  
  exportPDF: (type, startDate, endDate) =>
    `${API_BASE}/admin/reports/export/pdf?type=${type}&startDate=${startDate}&endDate=${endDate}`
};