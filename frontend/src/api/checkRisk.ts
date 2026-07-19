import type { ChatMessage, ChatTurn, MythFact } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function sendChat(messages: ChatMessage[]): Promise<ChatTurn> {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

export async function fetchMythsFacts(): Promise<MythFact[]> {
  const res = await fetch(`${BASE_URL}/content/myths-facts`);
  if (!res.ok) throw new Error("Failed to load myths & facts");
  return res.json();
}