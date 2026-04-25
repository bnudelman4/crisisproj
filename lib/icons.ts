import {
  Apple,
  Car,
  Pill,
  Home,
  Info,
  HelpCircle,
  DollarSign,
  Clock,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { NeedType, ResourceType } from "./types";

export const NEED_ICON: Record<NeedType, LucideIcon> = {
  food: Apple,
  ride: Car,
  medicine: Pill,
  shelter: Home,
  info: Info,
  other: HelpCircle,
};

export const RESOURCE_ICON: Record<ResourceType, LucideIcon> = {
  car: Car,
  food: Apple,
  money: DollarSign,
  time: Clock,
  skill: Wrench,
};

export function urgencyColors(urgency: number) {
  if (urgency >= 5) return { bg: "bg-red-500/10", border: "border-red-500/60", text: "text-red-400", chip: "bg-red-500 text-white" };
  if (urgency === 4) return { bg: "bg-orange-500/10", border: "border-orange-500/60", text: "text-orange-400", chip: "bg-orange-500 text-white" };
  if (urgency === 3) return { bg: "bg-yellow-500/10", border: "border-yellow-500/60", text: "text-yellow-400", chip: "bg-yellow-500 text-black" };
  return { bg: "bg-emerald-500/10", border: "border-emerald-500/60", text: "text-emerald-400", chip: "bg-emerald-500 text-white" };
}
