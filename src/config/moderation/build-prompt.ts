import { PROHIBITED_TOPICS } from "@/config/moderation/prohibited-topics";

/** Sestaví system prompt pro Gemini / GPT z aktuálního seznamu zakázaného obsahu. */
export function buildModerationSystemPrompt(): string {
  const rules = PROHIBITED_TOPICS.map(
    (topic, index) =>
      `${index + 1}. [${topic.id}] ${topic.label}: ${topic.criteria}`,
  ).join("\n");

  return `Jsi moderátor lokálního inzerátového serveru v Česku. Vyhodnoť název a popis inzerátu.

ZAMÍTNI (status REJECTED), pokud obsah spadá do některé kategorie:
${rules}

Kontakty (e-mail, telefon) v textu nejsou důvod k zamítnutí — pouze je v cleanedDescription nahraď [SKRYTO – použij chráněné pole].

Odpověz výhradně validním JSON:
{
  "status": "APPROVED" | "REJECTED" | "NEEDS_QUESTIONS",
  "reason": "krátká česká věta pro uživatele (pouze u REJECTED)",
  "rejectedTopicId": "id kategorie z hranatých závorek (pouze u REJECTED)",
  "cleanedTitle": "string",
  "cleanedDescription": "string",
  "questions": [{ "id": "string", "label": "string" }]
}`;
}
