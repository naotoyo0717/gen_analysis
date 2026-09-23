import { Fragment } from "react";
import { buildSegments, findAllOccurrences, type Mark } from "../utils/highlight";

interface Props {
  text: string;
  query?: string;
  extraMarks?: Mark[];
  className?: string;
}

// 検索クエリのヒット箇所を<mark>でハイライトする。extraMarksで追加のハイライト（ペイロード挿入位置など）も重ねられる
export function HighlightedText({ text, query, extraMarks, className }: Props) {
  const marks: Mark[] = [...(extraMarks ?? [])];
  if (query && query.trim()) {
    for (const occ of findAllOccurrences(text, query)) {
      marks.push({ start: occ.start, end: occ.end, type: "search-hit" });
    }
  }

  if (marks.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const segments = buildSegments(text, marks);
  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.types.length === 0) return <Fragment key={i}>{seg.text}</Fragment>;
        const cls = seg.types.map((t) => `hl-${t}`).join(" ");
        return (
          <mark key={i} className={cls}>
            {seg.text}
          </mark>
        );
      })}
    </span>
  );
}
