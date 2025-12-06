export function decodeJwt(token) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

const KEY = "auth"; // localStorage key

export function loadAuth() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
}

export function saveAuth(auth) {
  localStorage.setItem(KEY, JSON.stringify(auth));
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}
