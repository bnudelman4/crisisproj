export const DEMO_REQUESTER_PHONE = process.env.DEMO_REQUESTER_PHONE || "+16464771086";
export const DEMO_HELPER_PHONE = process.env.DEMO_HELPER_PHONE || "+19293940349";

export type Role = "requester" | "helper";

export function resolveDemoPhone(role: Role, fallback: string): string {
  if (process.env.DEMO_DISABLE_ROUTING === "1") return fallback;
  return role === "requester" ? DEMO_REQUESTER_PHONE : DEMO_HELPER_PHONE;
}
