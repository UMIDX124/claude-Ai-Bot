const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE = /\+?\d[\d\s\-().]{7,}\d/g;
const LONG_TOKEN = /\b[A-Za-z0-9_-]{32,}\b/g;

export function scrub(value: string): string {
  return value
    .replace(EMAIL, "[email]")
    .replace(PHONE, "[phone]")
    .replace(LONG_TOKEN, "[token]");
}

const PII_KEYS = new Set([
  "email",
  "phone",
  "password",
  "apiKey",
  "api_key",
  "token",
  "ssn",
  "dob",
  "birthday",
  "address",
]);

export function redactObject<T>(input: T): T {
  if (input === null || input === undefined) return input;
  if (typeof input === "string") return scrub(input) as unknown as T;
  if (Array.isArray(input)) return input.map(redactObject) as unknown as T;
  if (typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (PII_KEYS.has(k)) {
        out[k] = "[redacted]";
      } else {
        out[k] = redactObject(v);
      }
    }
    return out as T;
  }
  return input;
}
