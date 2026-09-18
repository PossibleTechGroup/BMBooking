export const PHONE_PREFIX = "+251";

/**
 * Normalize a raw phone input to the canonical Ethiopian format (+251XXXXXXXXX).
 * Handles full international numbers, national leading-0, and 251- prefixed
 * values without double-prefixing. Returns null when not a valid number.
 */
export function normalizeEthiopianPhone(input: string): string | null {
  const trimmed = (input || "").trim();
  if (!trimmed) return null;

  let digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("251")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);

  if (!/^[79]\d{8}$/.test(digits)) return null;
  return `${PHONE_PREFIX}${digits}`;
}

/**
 * Strip a canonical full number down to its 9 national digits (for use in
 * inputs that display the +251 prefix separately). Strips 251, +251, and any
 * leading national "0". Returns "" for empty input.
 */
export function ethiopianPhoneDigits(input: string): string {
  const digits = (input || "").replace(/\D/g, "");
  if (digits.startsWith("251")) return digits.slice(3);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}