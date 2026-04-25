import twilio from "twilio";

export interface SmsResult {
  to: string;
  sid: string | null;
  mode: "sent" | "logged";
  channel: "sms" | "whatsapp";
}

const WHATSAPP_SANDBOX_DEFAULT = "+14155238886";

function channel(): "sms" | "whatsapp" {
  return process.env.TWILIO_CHANNEL?.toLowerCase() === "whatsapp" ? "whatsapp" : "sms";
}

function fromAddress(): string {
  if (channel() === "whatsapp") {
    const num = process.env.TWILIO_WHATSAPP_FROM || WHATSAPP_SANDBOX_DEFAULT;
    return `whatsapp:${num}`;
  }
  return process.env.TWILIO_PHONE_NUMBER!;
}

function toAddress(to: string): string {
  return channel() === "whatsapp" ? `whatsapp:${to}` : to;
}

export function isTwilioConfigured(): boolean {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return false;
  if (channel() === "whatsapp") return true;
  return Boolean(process.env.TWILIO_PHONE_NUMBER);
}

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  const ch = channel();
  if (!isTwilioConfigured()) {
    console.log(`[CrisisMesh ${ch}:demo-mode] to=${to} body=${JSON.stringify(body)}`);
    return { to, sid: null, mode: "logged", channel: ch };
  }
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  const msg = await client.messages.create({
    from: fromAddress(),
    to: toAddress(to),
    body,
  });
  return { to, sid: msg.sid, mode: "sent", channel: ch };
}
