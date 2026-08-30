export type Flashcard = {
  front: string;
  back: string;
  tags: string[];
};

type FlashcardPayload = {
  cards?: unknown;
};

function normalizeCard(value: unknown): Flashcard | null {
  if (!value || typeof value !== "object") return null;
  const card = value as { front?: unknown; back?: unknown; tags?: unknown };
  if (typeof card.front !== "string" || !card.front.trim() || typeof card.back !== "string" || !card.back.trim()) return null;
  const tags = Array.isArray(card.tags) ? card.tags.filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim())).map((tag) => tag.trim().replace(/\s+/g, "-")) : [];
  return { front: card.front.trim(), back: card.back.trim(), tags };
}

export function parseFlashcards(result: string): Flashcard[] | null {
  const json = result.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  try {
    const payload = JSON.parse(json) as FlashcardPayload;
    if (!Array.isArray(payload.cards) || !payload.cards.length) return null;
    const cards = payload.cards.map(normalizeCard);
    return cards.every((card): card is Flashcard => card !== null) ? cards : null;
  } catch {
    return null;
  }
}