export type SampleSource = "SMS" | "GROUPME" | "FORM" | "DISCORD" | "MANUAL";

export type SampleMessage = {
  sender: string;
  contact: string;
  source: SampleSource;
  text: string;
  timestamp: string;
};

export const sampleMessages: SampleMessage[] = [
  {
    sender: "Sam K.",
    contact: "+1 (607) 555-0142",
    source: "SMS",
    text: "CORNELL Need insulin delivered to North Campus, room 312 Mews Hall. Power has been out 3 hours.",
    timestamp: "2 min ago",
  },
  {
    sender: "Leo M.",
    contact: "GroupMe · Mutual Aid",
    source: "GROUPME",
    text: "Have a car, can drive 2-5pm today. Based in Collegetown. Happy to do supply runs or rides.",
    timestamp: "4 min ago",
  },
  {
    sender: "Anonymous",
    contact: "QR Form · /r/cornell",
    source: "FORM",
    text: "My grandmother lives alone in Belle Sherman and I cannot reach her. Phone goes to voicemail.",
    timestamp: "7 min ago",
  },
  {
    sender: "Priya R.",
    contact: "Discord · #aid-offers",
    source: "DISCORD",
    text: "I have extra bottled water and granola bars. Can drop at any North Campus address.",
    timestamp: "9 min ago",
  },
  {
    sender: "Coordinator note",
    contact: "Manual entry",
    source: "MANUAL",
    text: "Reported: traffic light out at College Ave and Buffalo. Treat as 4-way stop.",
    timestamp: "11 min ago",
  },
];

export const sourceLabel: Record<SampleSource, string> = {
  SMS: "SMS",
  GROUPME: "GroupMe",
  FORM: "QR Form",
  DISCORD: "Discord",
  MANUAL: "Manual",
};
