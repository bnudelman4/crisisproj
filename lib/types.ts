export type NeedType = "food" | "ride" | "medicine" | "shelter" | "info" | "other";
export type ResourceType = "car" | "food" | "money" | "time" | "skill";

export interface Need {
  id: string;
  person: string;
  type: NeedType;
  description: string;
  urgency: 1 | 2 | 3 | 4 | 5;
  location: string | null;
}

export interface Resource {
  id: string;
  person: string;
  type: ResourceType;
  description: string;
  availability: string | null;
}

export interface Match {
  needId: string;
  resourceId: string;
  confidence: number;
  action: string;
  safetyFlag: boolean;
  safetyNote: string | null;
}

export interface Summary {
  totalNeeds: number;
  totalResources: number;
  urgentCases: number;
  safeMatches: number;
}

export interface AnalyzeResult {
  needs: Need[];
  resources: Resource[];
  matches: Match[];
  summary: Summary;
}
