export type RiskTier = "Low" | "Moderate" | "High";

export interface ExtractedFacts {
  antibiotic_name: string | null;
  symptom_or_reason: string | null;
  duration_days: number | null;
  prescribed_by_doctor: boolean | null;
  course_completed: boolean | null;
  source: "prescribed" | "self_purchased" | "leftover" | "unknown";
}

export interface ChatTurn {
  type: "question" | "result";
  message: string;
  quick_replies: string[];
  extracted: ExtractedFacts;
  risk_tier: RiskTier | null;
  risk_flags: string[];
  safe_advice: string[];
  disclaimer: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  turn?: ChatTurn; // present on assistant messages, drives rendering
}

export interface MythFact {
  myth: string;
  fact: string;
}
export interface Medicine {
  name: string;
  dosage: string | null;
  frequency_per_day: number | null;
  duration_days: number | null;
  instructions: string | null;
  is_antibiotic: boolean;
}

export interface PrescriptionResult {
  medicines: Medicine[];
  doctor_name: string | null;
  date: string | null;
  notes: string | null;
}

export interface TrackedMedication extends Medicine {
  id: string;
  start_date: string;      // ISO date
  schedule_times: string[]; // e.g. ["08:00", "14:00", "20:00"]
  doses_taken: Record<string, string[]>; // { "2026-07-18": ["08:00"] }
}

export interface Source {
  fact: string;
  source: string;
  url: string;
}

export interface ChatTurn {
  type: "question" | "result";
  message: string;
  quick_replies: string[];
  sources: Source[];
  extracted: ExtractedFacts;
  risk_tier: RiskTier | null;
  risk_flags: string[];
  safe_advice: string[];
  disclaimer: string;
}