export interface KaraokeWord {
  text: string;
  start: number;
  end: number;
}

export interface KaraokeLine {
  start: number;
  end: number;
  text: string;
  words: KaraokeWord[];
}

export interface KaraokeLrc {
  lines: KaraokeLine[];
  duration: number;
  plainText: string;
}

export const scaleKaraokeLrc = (k: KaraokeLrc, scale: number): KaraokeLrc => {
  const s = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const lines = k.lines.map((line) => {
    const words = line.words.map((w) => ({
      ...w,
      start: w.start * s,
      end: w.end * s,
    }));

    return {
      ...line,
      start: line.start * s,
      end: line.end * s,
      words,
    };
  });

  const duration = k.duration * s;
  return { ...k, lines, duration };
};

export const detectKaraokeStanzaBreaks = (lrc: string): number[] => {
  const raw = (lrc || '').replace(/\r\n?/g, '\n');
  const rawLines = raw.split('\n');

  const breaks: number[] = [];
  let stanzaBreakPending = false;
  let timedLineIndex = 0;

  for (const line of rawLines) {
    const trimmed = (line ?? '').trim();
    if (trimmed.length === 0) {
      stanzaBreakPending = true;
      continue;
    }

    const m = line.match(lineTimeTagRe);
    if (!m) continue;

    if (stanzaBreakPending && timedLineIndex > 0) {
      breaks.push(timedLineIndex);
    }

    stanzaBreakPending = false;
    timedLineIndex++;
  }

  return breaks;
};

const parseTimestampToSeconds = (raw: string): number | null => {
  const s = raw.trim();
  const parts = s.split(':');
  if (parts.length < 2 || parts.length > 3) return null;

  const hasHours = parts.length === 3;
  const h = hasHours ? Number(parts[0]) : 0;
  const m = Number(parts[hasHours ? 1 : 0]);
  const sec = Number(parts[hasHours ? 2 : 1]);

  if (!Number.isFinite(h) || !Number.isFinite(m) || !Number.isFinite(sec)) return null;
  if (m < 0 || sec < 0 || h < 0) return null;

  return h * 3600 + m * 60 + sec;
};

const lineTimeTagRe = /^\s*\[(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d{1,3})?)\]\s*(.*)$/;
const inlineTimeTagRe = /<(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d{1,3})?)>/g;

export const parseKaraokeLrc = (lrc: string): KaraokeLrc | null => {
  const raw = (lrc || '').replace(/\r\n?/g, '\n');
  const rawLines = raw.split('\n');

  const parsed: Array<{ start: number; rawText: string; rawWords: Array<{ start: number; text: string }> }> = [];

  for (const line of rawLines) {
    const m = line.match(lineTimeTagRe);
    if (!m) continue;

    const start = parseTimestampToSeconds(m[1]);
    if (start == null) continue;

    const rest = (m[2] ?? '').toString();

    const tokens: Array<{ start: number; text: string }> = [];
    let lastIdx = 0;
    let currentStart: number | null = null;
    let sawInline = false;

    inlineTimeTagRe.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = inlineTimeTagRe.exec(rest))) {
      const t = parseTimestampToSeconds(match[1]);
      if (t == null) continue;

      if (!sawInline) {
        const prefix = rest.slice(0, match.index);
        const prefixText = prefix;
        if (prefixText.length > 0) tokens.push({ start, text: prefixText });
        sawInline = true;
      }

      if (currentStart != null) {
        const seg = rest.slice(lastIdx, match.index);
        const text = seg;
        if (text.length > 0) tokens.push({ start: currentStart, text });
      }

      currentStart = t;
      lastIdx = match.index + match[0].length;
    }

    if (currentStart != null) {
      const seg = rest.slice(lastIdx);
      const text = seg;
      if (text.length > 0) tokens.push({ start: currentStart, text });
    }

    const plain = rest.replace(inlineTimeTagRe, '').trimEnd();

    parsed.push({ start, rawText: plain, rawWords: tokens });
  }

  if (parsed.length === 0) return null;

  parsed.sort((a, b) => a.start - b.start);

  const lines: KaraokeLine[] = parsed.map((p) => ({ start: p.start, end: p.start, text: p.rawText, words: [] }));

  for (let i = 0; i < parsed.length; i++) {
    const nextLineStart = parsed[i + 1]?.start;
    const lineStart = parsed[i].start;

    const wordStarts = parsed[i].rawWords;
    const words: KaraokeWord[] = [];

    for (let w = 0; w < wordStarts.length; w++) {
      const start = wordStarts[w].start;
      const nextWordStart = wordStarts[w + 1]?.start;
      const endCandidate = nextWordStart ?? nextLineStart ?? (start + 0.6);
      const end = Math.max(start, endCandidate);
      words.push({ text: wordStarts[w].text, start, end });
    }

    const lineEnd = nextLineStart ?? (words.length > 0 ? words[words.length - 1].end : lineStart + 1);

    lines[i] = {
      start: lineStart,
      end: Math.max(lineStart, lineEnd),
      text: parsed[i].rawText,
      words,
    };
  }

  const duration = Math.max(...lines.map((l) => l.end));
  const plainText = lines.map((l) => l.text).join('\n');

  return { lines, duration, plainText };
};

export const findActiveKaraokeLineIndex = (lines: KaraokeLine[], t: number): number => {
  if (lines.length <= 1) return 0;
  const tt = Math.max(0, t);

  for (let i = lines.length - 1; i >= 0; i--) {
    if (tt >= lines[i].start) return i;
  }

  return 0;
};

export const findKaraokeWordProgress = (
  line: KaraokeLine,
  t: number
): { wordIndex: number; within: number } => {
  if (line.words.length === 0) return { wordIndex: 0, within: 0 };

  const tt = Math.max(line.start, Math.min(t, line.end));

  let wordIndex = 0;
  for (let i = line.words.length - 1; i >= 0; i--) {
    if (tt >= line.words[i].start) { wordIndex = i; break; }
  }

  const w = line.words[wordIndex];
  const denom = Math.max(0.000001, w.end - w.start);
  const within = Math.max(0, Math.min(1, (tt - w.start) / denom));

  return { wordIndex, within };
};
