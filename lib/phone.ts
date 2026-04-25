const E164 = /^\+[1-9]\d{1,14}$/;

export function isE164(phone: string): boolean {
  return E164.test(phone);
}

export function normalizePhone(input: string): string {
  const trimmed = input.trim().replace(/[\s().-]/g, "");
  if (E164.test(trimmed)) return trimmed;
  if (/^\d{10}$/.test(trimmed)) return `+1${trimmed}`;
  if (/^1\d{10}$/.test(trimmed)) return `+${trimmed}`;
  return trimmed;
}
