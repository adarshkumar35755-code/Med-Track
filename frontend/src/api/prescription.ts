import type { PrescriptionResult } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function parsePrescription(file: File): Promise<PrescriptionResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/prescription/parse`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to parse prescription");
  }
  return res.json();
}