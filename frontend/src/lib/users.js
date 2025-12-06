const KEY = "mc-users"; // NOTE: Local persistence placeholder; replace with real API storage.

const DEFAULT_USERS = [
  {
    role: "Patient",
    firstName: "Aishath",
    lastName: "Rahman",
    name: "Aishath Rahman",
    email: "aishath@example.com",
    nationalId: "901231-14-2234",
    phoneCountryCode: "MYS|+60",
    phone: "+60 12-345 6789",
    gender: "Female",
    dateOfBirth: "1990-12-31",
    addressStreet: "22 Jalan Ampang",
    addressCity: "Kuala Lumpur",
    addressState: "Kuala Lumpur (Federal Territory)",
    postcode: "50450",
    nationality: "Malaysian",
    insurance: "AIA Malaysia",
    insuranceNumber: "AIA-556677",
    emergencyName: "Rahman K.",
    emergencyRelationship: "Spouse",
    emergencyCountryCode: "MYS|+60",
    emergencyPhone: "+60 19-000 1122",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    role: "Patient",
    firstName: "Lim",
    lastName: "Wei",
    name: "Lim Wei",
    email: "lim.wei@example.com",
    nationalId: "880101-10-5566",
    phoneCountryCode: "MYS|+60",
    phone: "+60 11-222 3344",
    gender: "Male",
    dateOfBirth: "1988-01-01",
    addressStreet: "88 Jalan Tun Razak",
    addressCity: "Kuala Lumpur",
    addressState: "Kuala Lumpur (Federal Territory)",
    postcode: "50450",
    nationality: "Malaysian",
    insurance: "self-pay",
    insuranceNumber: "",
    emergencyName: "Lim Siew",
    emergencyRelationship: "Parent",
    emergencyCountryCode: "MYS|+60",
    emergencyPhone: "+60 10-123 4567",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    role: "Patient",
    firstName: "Nor",
    lastName: "Zakiah",
    name: "Nor Zakiah",
    email: "zakiah@example.com",
    nationalId: "930215-08-7788",
    phoneCountryCode: "MYS|+60",
    phone: "+60 17-876 5432",
    gender: "Female",
    dateOfBirth: "1993-02-15",
    addressStreet: "18 Jalan Bintang",
    addressCity: "Johor Bahru",
    addressState: "Johor",
    postcode: "80000",
    nationality: "Malaysian",
    insurance: "Prudential BSN",
    insuranceNumber: "PruBSN-998877",
    emergencyName: "Zakiah N.",
    emergencyRelationship: "Sibling",
    emergencyCountryCode: "MYS|+60",
    emergencyPhone: "+60 13-555 1234",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Read the mock user directory from localStorage.
function loadRawUsers() {
  try {
    const stored = localStorage.getItem(KEY);
    if (!stored) {
      persistUsers(DEFAULT_USERS);
      return [...DEFAULT_USERS];
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    persistUsers(DEFAULT_USERS);
    return [...DEFAULT_USERS];
  }
}

// Write the mock user directory back to localStorage.
function persistUsers(users) {
  localStorage.setItem(KEY, JSON.stringify(users));
}

export function getRegisteredUsers() {
  // Expose the mock registry; useful for debugging in the playground.
  return loadRawUsers();
}

export function searchRegisteredUsers(keyword) {
  if (!keyword) return [];
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return [];
  return loadRawUsers().filter((user) => {
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim().toLowerCase();
    const nationalId = (user.nationalId || "").toLowerCase();
    return (
      (fullName && fullName.includes(normalized)) ||
      (nationalId && nationalId.includes(normalized))
    );
  });
}

export function upsertRegisteredUser(user) {
  if (!user?.email) return;
  const email = user.email.trim().toLowerCase();
  const entries = loadRawUsers();
  const index = entries.findIndex((u) => (u.email || "").toLowerCase() === email);
  const payload = { ...user, email };
  if (index >= 0) {
    entries[index] = { ...entries[index], ...payload };
  } else {
    entries.push(payload);
  }
  persistUsers(entries);
}

export function findRegisteredUser(email) {
  // Helper used by the mock login flow to map email -> stored profile.
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  return loadRawUsers().find((user) => (user.email || "").toLowerCase() === normalized) || null;
}
