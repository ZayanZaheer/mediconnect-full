// Helpers for phone number validation and normalization by country.
// Country codes come in as "ISO|+dial", e.g. "MYS|+60".

// Per-country digit limits (without the dial code). Extend as needed.
export const PHONE_DIGIT_LIMITS = {
  MYS: { min: 10, max: 10 }, // Malaysia
  USA: { min: 10, max: 10 }, // United States/Canada NANP
  CAN: { min: 10, max: 10 }, // Canada
  SGP: { min: 8, max: 8 },   // Singapore
  IDN: { min: 9, max: 12 },  // Indonesia
  // Default/fallback handled separately.
};

// Default digit bounds if country not listed
export const DEFAULT_PHONE_LIMIT = { min: 7, max: 10 };

export function parseIsoFromCode(code) {
  if (!code) return "";
  const [iso] = String(code).split("|");
  return iso || "";
}

export function digitsOnly(value) {
  return (value || "").replace(/\D/g, "");
}

export function getPhoneLimit(code) {
  const iso = parseIsoFromCode(code);
  return PHONE_DIGIT_LIMITS[iso] || DEFAULT_PHONE_LIMIT;
}

export function normalizePhoneInput(rawValue, code) {
  const limit = getPhoneLimit(code);
  const digits = digitsOnly(rawValue).slice(0, limit.max);
  return digits;
}

export function validatePhoneDigits(rawValue, code) {
  const limit = getPhoneLimit(code);
  const digits = digitsOnly(rawValue);
  const ok = digits.length >= limit.min && digits.length <= limit.max;
  return { ok, digits, limit };
}
