export interface Mark {
  start: number;
  end: number;
  type: string;
}

export interface Segment {
  text: string;
  types: string[];
}

// 大文字小文字非依存でqueryのすべての出現位置を返す
export function findAllOccurrences(text: string, query: string): { start: number; end: number }[] {
  if (!query) return [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const result: { start: number; end: number }[] = [];
  let from = 0;
  while (from <= lowerText.length) {
    const idx = lowerText.indexOf(lowerQuery, from);
    if (idx === -1) break;
    result.push({ start: idx, end: idx + query.length });
    from = idx + query.length;
  }
  return result;
}

// マークの境界でテキストを分割し、各セグメントに適用されるtypeの一覧を付与する
export function buildSegments(text: string, marks: Mark[]): Segment[] {
  if (marks.length === 0) return [{ text, types: [] }];
  const points = new Set<number>([0, text.length]);
  for (const m of marks) {
    points.add(Math.max(0, Math.min(m.start, text.length)));
    points.add(Math.max(0, Math.min(m.end, text.length)));
  }
  const sorted = Array.from(points).sort((a, b) => a - b);
  const segments: Segment[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i];
    const end = sorted[i + 1];
    if (start >= end) continue;
    const types = marks.filter((m) => m.start <= start && m.end >= end).map((m) => m.type);
    segments.push({ text: text.slice(start, end), types });
  }
  return segments;
}

export function textMatchesQuery(text: string, query: string): boolean {
  if (!query) return true;
  return text.toLowerCase().includes(query.toLowerCase());
}
