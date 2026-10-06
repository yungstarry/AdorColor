export type SplitStyle = 'natural' | 'short' | 'balanced' | 'longer';

const STYLE_MULTIPLIERS: Record<SplitStyle, number> = {
  natural: 1,
  short: 0.78,
  balanced: 1.08,
  longer: 1.22,
};

const SENTENCE_END = /[.!?;:]$/;
const STRONG_SENTENCE_END = /[.!?]$/;
const SOFT_PAUSE_END = /[,—–-]$/;
const CONNECTORS = new Set(['and', 'but', 'or', 'because', 'so', 'although', 'while', 'if', 'when']);
const FRAGILE_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'because', 'but', 'by', 'for', 'from', 'in',
  'into', 'of', 'on', 'or', 'the', 'to', 'with',
]);

const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export function splitScript(
  script: string,
  targetDuration: number,
  wordsPerSecond: number,
  style: SplitStyle = 'natural',
): string[] {
  const words = script.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const targetWords = Math.max(1, targetDuration * wordsPerSecond * STYLE_MULTIPLIERS[style]);
  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    const remaining = words.length - start;
    if (remaining <= targetWords * 1.2) {
      chunks.push(words.slice(start).join(' '));
      break;
    }

    const firstSentenceEnd = words.findIndex(
      (word, index) => index >= start && STRONG_SENTENCE_END.test(word),
    );
    if (firstSentenceEnd >= start && firstSentenceEnd - start + 1 <= targetWords * 1.25) {
      chunks.push(words.slice(start, firstSentenceEnd + 1).join(' '));
      start = firstSentenceEnd + 1;
      continue;
    }

    const maxEnd = Math.min(words.length, start + Math.ceil(targetWords * 1.65));
    let bestEnd = Math.min(words.length, Math.max(start + 1, Math.round(start + targetWords)));
    let bestScore = Number.NEGATIVE_INFINITY;

    for (let end = start + 1; end <= maxEnd; end += 1) {
      const count = end - start;
      const token = words[end - 1];
      const nextToken = words[end];
      const lowerToken = token.toLowerCase().replace(/^[("'“‘]+|[)"'”’,.!?;:]+$/g, '');
      const lowerNextToken = nextToken?.toLowerCase().replace(/^[("'“‘]+|[)"'”’,.!?;:]+$/g, '');
      const distancePenalty = Math.abs(count - targetWords);
      let score = -distancePenalty;

      if (count < targetWords * 0.58) score -= 3.5;
      if (SENTENCE_END.test(token)) score += STRONG_SENTENCE_END.test(token) ? 4.8 : 3.6;
      else if (SOFT_PAUSE_END.test(token)) score += 2.5;
      if (CONNECTORS.has(lowerToken)) score -= 2.3;
      if (lowerNextToken && CONNECTORS.has(lowerNextToken)) score -= 1.1;
      if (FRAGILE_WORDS.has(lowerToken)) score -= 3.8;

      if (score > bestScore) {
        bestScore = score;
        bestEnd = end;
      }
    }

    chunks.push(words.slice(start, bestEnd).join(' '));
    start = bestEnd;
  }

  return chunks.filter(Boolean);
}

export function countScriptWords(script: string): number {
  return wordCount(script);
}
