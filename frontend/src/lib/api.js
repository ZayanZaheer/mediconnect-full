import { API_CONFIG } from '../config/api.js';

export const api = {
  // Auth - Using AWS Lambda endpoints directly
  login: (credentials) => {
    return fetch(API_CONFIG.AUTH.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    }).then(r => r.json());
  },
  
  register: (data) => {
    return fetch(API_CONFIG.AUTH.REGISTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json());
  },
  
  // Appointments
  getAppointments: (params) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_CONFIG.BASE_URL}/appointments?${query}`).then(r => r.json());
  },
  
  getAppointmentsByPatient: (email) =>
    fetch(`${API_CONFIG.BASE_URL}/appointments/patient/${email}`).then(r => r.json()),
  
  getAppointmentsByDoctor: (doctorId) =>
    fetch(`${API_CONFIG.BASE_URL}/appointments/doctor/${doctorId}`).then(r => r.json()),
  
  getAvailableSlots: (doctorId, date) =>
    fetch(`${API_CONFIG.BASE_URL}/appointments/slots?doctorId=${doctorId}&date=${date}`).then(r => r.json()),
  
  createAppointment: (data) =>
    fetch(`${API_CONFIG.BASE_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  rescheduleAppointment: (id, data) =>
    fetch(`${API_CONFIG.BASE_URL}/appointments/${id}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  checkInAppointment: (id) =>
    fetch(`${API_CONFIG.BASE_URL}/appointments/${id}/check-in`, {
      method: 'POST'
    }).then(r => r.json()),
  
  markNoShow: (id) =>
    fetch(`${API_CONFIG.BASE_URL}/appointments/${id}/no-show`, {
      method: 'POST'
    }).then(r => r.json()),
  
  // Doctors
  getDoctors: () =>
    fetch(`${API_CONFIG.BASE_URL}/doctors`).then(r => r.json()),
  
  getDoctor: (id) =>
    fetch(`${API_CONFIG.BASE_URL}/doctors/${id}`).then(r => r.json()),
  
  updateDoctorAvailability: (id, data) =>
    fetch(`${API_CONFIG.BASE_URL}/doctors/${id}/availability`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  // Users
  getUsers: () =>
    fetch(`${API_CONFIG.BASE_URL}/users`).then(r => r.json()),
  
  getUser: (email) =>
    fetch(`${API_CONFIG.BASE_URL}/users/${email}`).then(r => r.json()),
  
  createUser: (data) =>
    fetch(`${API_CONFIG.BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  updateUser: (email, data) =>
    fetch(`${API_CONFIG.BASE_URL}/users/${email}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  deleteUser: (email) =>
    fetch(`${API_CONFIG.BASE_URL}/users/${email}`, {
      method: 'DELETE'
    }),
  
  searchUsers: (keyword) =>
    fetch(`${API_CONFIG.BASE_URL}/users/search?keyword=${keyword}`).then(r => r.json()),
  
  // Consultation Memos
  getConsultationMemos: (doctorId) =>
    fetch(`${API_CONFIG.BASE_URL}/consultationmemos?doctorId=${doctorId}`).then(r => r.json()),
  
  updateMemoStatus: (id, data) =>
    fetch(`${API_CONFIG.BASE_URL}/consultationmemos/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  // Doctor Sessions
  getDoctorSession: (doctorId) =>
    fetch(`${API_CONFIG.BASE_URL}/doctorsessions/${doctorId}`).then(r => r.json()),
  
  updateDoctorSession: (doctorId, data) =>
    fetch(`${API_CONFIG.BASE_URL}/doctorsessions/${doctorId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  startNextPatient: (doctorId) =>
    fetch(`${API_CONFIG.BASE_URL}/doctorsessions/${doctorId}/start-next`, {
      method: 'POST'
    }).then(r => r.json()),
  
  completeConsultation: (doctorId) =>
    fetch(`${API_CONFIG.BASE_URL}/doctorsessions/${doctorId}/complete`, {
      method: 'POST'
    }).then(r => r.json()),
  
  // Receipts
  getReceipts: (params) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_CONFIG.BASE_URL}/receipts?${query}`).then(r => r.json());
  },
  
  getReceiptByAppointment: (appointmentId) =>
    fetch(`${API_CONFIG.BASE_URL}/receipts/appointment/${appointmentId}`).then(r => r.json()),
  
  // Notifications
  getNotifications: (audiences, doctorId) => {
    let url = `${API_CONFIG.BASE_URL}/notifications?`;
    if (audiences) url += `audiences=${audiences}&`;
    if (doctorId) url += `doctorId=${doctorId}`;
    return fetch(url).then(r => r.json());
  },
  
  markNotificationRead: (id) =>
    fetch(`${API_CONFIG.BASE_URL}/notifications/${id}/read`, {
      method: 'PUT'
    }).then(r => r.json()),
  
  // Payments
  initiatePayment: (data) =>
    fetch(`${API_CONFIG.BASE_URL}/payments/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  confirmPayment: (sessionId, data) =>
    fetch(`${API_CONFIG.BASE_URL}/payments/${sessionId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  markPaid: (appointmentId) =>
    fetch(`${API_CONFIG.BASE_URL}/payments/${appointmentId}/mark-paid`, {
      method: 'POST'
    }).then(r => r.json()),
  
  // Waitlist
  getWaitlist: (doctorId) =>
    fetch(`${API_CONFIG.BASE_URL}/waitlist?doctorId=${doctorId}`).then(r => r.json()),
  
  createWaitlist: (data) =>
    fetch(`${API_CONFIG.BASE_URL}/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  promoteWaitlist: (id) =>
    fetch(`${API_CONFIG.BASE_URL}/waitlist/${id}/promote`, {
      method: 'POST'
    }).then(r => r.json()),
  
  // Admin Monitoring
  getMonitoringStatus: () =>
    fetch(`${API_CONFIG.BASE_URL}/admin/monitoring/status`).then(r => r.json()),
  
  getMonitoringLatency: () =>
    fetch(`${API_CONFIG.BASE_URL}/admin/monitoring/latency`).then(r => r.json()),
  
  getMonitoringErrors: () =>
    fetch(`${API_CONFIG.BASE_URL}/admin/monitoring/errors`).then(r => r.json()),
  
  getMonitoringStorage: () =>
    fetch(`${API_CONFIG.BASE_URL}/admin/monitoring/storage`).then(r => r.json()),
  
  // Admin Reports
  getAppointmentsReport: (range) =>
    fetch(`${API_CONFIG.BASE_URL}/admin/reports/appointments?range=${range}`).then(r => r.json()),
  
  getPatientsReport: () =>
    fetch(`${API_CONFIG.BASE_URL}/admin/reports/patients`).then(r => r.json()),
  
  getDoctorsReport: () =>
    fetch(`${API_CONFIG.BASE_URL}/admin/reports/doctors`).then(r => r.json()),
  
  getPaymentsReport: () =>
    fetch(`${API_CONFIG.BASE_URL}/admin/reports/payments`).then(r => r.json()),
  
  exportCSV: (type, startDate, endDate) =>
    `${API_CONFIG.BASE_URL}/admin/reports/export/csv?type=${type}&startDate=${startDate}&endDate=${endDate}`,
  
  exportPDF: (type, startDate, endDate) =>
    `${API_CONFIG.BASE_URL}/admin/reports/export/pdf?type=${type}&startDate=${startDate}&endDate=${endDate}`
};