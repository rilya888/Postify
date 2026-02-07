export type LanguageCode = "ru" | "en" | "es" | "de" | "fr" | "pt" | "it" | "uk" | "unknown";

export type LanguageDetectionResult = {
  code: LanguageCode;
  confidence: number;
  isMixed: boolean;
};

const SHORT_TEXT_THRESHOLD = 60;

const STOP_WORDS: Record<Exclude<LanguageCode, "unknown">, string[]> = {
  ru: ["и", "в", "не", "на", "что", "это", "как", "для", "по", "с", "из"],
  en: ["the", "and", "for", "with", "this", "that", "you", "from", "are", "to"],
  es: ["el", "la", "de", "que", "y", "en", "para", "con", "una", "los"],
  de: ["der", "die", "und", "ist", "mit", "für", "das", "ein", "nicht", "auf"],
  fr: ["le", "la", "et", "les", "des", "pour", "avec", "une", "dans", "est"],
  pt: ["de", "que", "e", "o", "a", "para", "com", "uma", "não", "os"],
  it: ["di", "che", "e", "il", "la", "per", "con", "una", "non", "gli"],
  uk: ["і", "в", "не", "на", "що", "це", "як", "для", "з", "до"],
};

const LANGUAGE_NAMES: Record<Exclude<LanguageCode, "unknown">, string> = {
  ru: "Russian",
  en: "English",
  es: "Spanish",
  de: "German",
  fr: "French",
  pt: "Portuguese",
  it: "Italian",
  uk: "Ukrainian",
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function countScriptChars(text: string): { cyrillic: number; latin: number } {
  let cyrillic = 0;
  let latin = 0;
  for (const ch of text) {
    if (/\p{Script=Cyrillic}/u.test(ch)) cyrillic++;
    else if (/\p{Script=Latin}/u.test(ch)) latin++;
  }
  return { cyrillic, latin };
}

function scoreByStopWords(tokens: string[], code: Exclude<LanguageCode, "unknown">): number {
  const set = new Set(STOP_WORDS[code]);
  let score = 0;
  for (const token of tokens) {
    if (set.has(token)) score++;
  }
  return score;
}

export function detectLanguage(text: string): LanguageDetectionResult {
  const normalized = text.trim();
  if (!normalized) {
    return { code: "unknown", confidence: 0, isMixed: false };
  }

  const tokens = tokenize(normalized);
  const script = countScriptChars(normalized);
  const totalScript = Math.max(script.cyrillic + script.latin, 1);
  const cyrillicShare = script.cyrillic / totalScript;
  const latinShare = script.latin / totalScript;

  // Strong script hints first.
  if (cyrillicShare >= 0.75) {
    const ukScore = scoreByStopWords(tokens, "uk");
    const ruScore = scoreByStopWords(tokens, "ru");
    const code: LanguageCode = ukScore > ruScore ? "uk" : "ru";
    return {
      code,
      confidence: normalized.length < SHORT_TEXT_THRESHOLD ? 0.72 : 0.9,
      isMixed: latinShare > 0.2,
    };
  }

  const latinCodes: Exclude<LanguageCode, "unknown" | "ru" | "uk">[] = ["en", "es", "de", "fr", "pt", "it"];
  const scores = latinCodes.map((code) => ({ code, score: scoreByStopWords(tokens, code) }));
  scores.sort((a, b) => b.score - a.score);

  const top = scores[0];
  const second = scores[1];

  if (top.score === 0 && latinShare >= 0.6) {
    return {
      code: "en",
      confidence: normalized.length < SHORT_TEXT_THRESHOLD ? 0.58 : 0.68,
      isMixed: cyrillicShare > 0.2,
    };
  }

  if (top.score > 0) {
    const gap = top.score - (second?.score ?? 0);
    const confidenceBase = top.score >= 3 ? 0.85 : 0.72;
    const confidence = Math.min(0.95, confidenceBase + Math.min(gap, 3) * 0.03);
    return {
      code: top.code,
      confidence,
      isMixed: cyrillicShare > 0.2,
    };
  }

  return { code: "unknown", confidence: 0.35, isMixed: cyrillicShare > 0.2 && latinShare > 0.2 };
}

export function resolveTargetLanguage(sourceContent: string, fallback: LanguageCode = "en"): LanguageDetectionResult {
  const detected = detectLanguage(sourceContent);
  if (detected.code !== "unknown" && detected.confidence >= 0.55) {
    return detected;
  }
  return {
    code: fallback,
    confidence: Math.max(detected.confidence, 0.5),
    isMixed: detected.isMixed,
  };
}

export function getLanguageName(code: LanguageCode): string {
  if (code === "unknown") return "source language";
  return LANGUAGE_NAMES[code];
}

export function buildLanguageInstruction(code: LanguageCode, strict = false): string {
  const languageName = getLanguageName(code);
  if (strict) {
    return `LANGUAGE REQUIREMENT: Write the final output strictly in ${languageName}. Do not switch to English unless ${languageName} is English. Keep brand names, product names, @mentions, URLs, and hashtags unchanged.`;
  }
  return `LANGUAGE REQUIREMENT: Write the final output in ${languageName}. Preserve this language consistently.`;
}
