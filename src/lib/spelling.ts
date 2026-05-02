import { ChildSpellingData, SpellingWord } from "./types";

export const extractionPrompt = `You are helping me prepare Chinese spelling practice for my child.

From the image or text I provide, extract ONLY the Chinese test words or characters that the child needs to practice.

Ignore:
- instructions
- names
- dates
- page numbers
- English text
- punctuation
- example sentences
- unrelated Chinese text

Return the result in this exact JSON format only:

{
  "title": "Chinese Spelling Practice",
  "language": "zh",
  "words": [
    {
      "text": "学校",
      "characters": ["学", "校"],
      "meaning": "",
      "pinyin": ""
    }
  ]
}

Rules:
1. Only include actual tested words or characters.
2. Do not include explanations.
3. Do not wrap the JSON in markdown.
4. If you are unsure, include the possible word but set "uncertain": true.
5. Keep the original order from the worksheet.
6. For single characters, still use the same format.
7. Fill up all the fields in the JSON

Now extract the tested Chinese spelling words from the content I upload.`;

export function normalizeSpellingData(value: unknown): ChildSpellingData | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as { title?: unknown; language?: unknown; words?: unknown };
  if (raw.language !== "zh" || !Array.isArray(raw.words)) return null;

  const words = raw.words
    .map((word) => {
      const item = word as { text?: unknown; characters?: unknown; meaning?: unknown; pinyin?: unknown; uncertain?: unknown };
      const text = String(item?.text ?? "").trim();
      const characters = Array.isArray(item?.characters)
        ? item.characters.map((char) => String(char ?? "").trim()).filter(Boolean)
        : [];
      if (!text || !characters.length) return null;
      return {
        text,
        characters,
        meaning: String(item?.meaning ?? "").trim(),
        pinyin: String(item?.pinyin ?? "").trim(),
        uncertain: Boolean(item?.uncertain)
      } satisfies SpellingWord;
    })
    .filter(Boolean) as SpellingWord[];

  if (!words.length) return null;

  return {
    title: String(raw.title ?? "Chinese Spelling Practice").trim() || "Chinese Spelling Practice",
    language: "zh",
    words,
    updatedAt: new Date().toISOString()
  };
}
