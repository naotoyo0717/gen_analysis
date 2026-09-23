import type { Annotation, LogRecord } from "../types";
import { recordKey } from "../types";

export interface Stats {
  total: number;
  judged: number;
  hackedCount: number;
  asr: number | null; // 判定済みが0件ならnull
  correctedJudged: number;
  correctedHackedCount: number;
  correctedAsr: number | null;
}

// アノテーションのオーバーライドを反映したhacked値。未オーバーライドなら元のhackedをそのまま使う
export function effectiveHacked(
  record: LogRecord,
  annotations: Map<string, Annotation>,
): boolean | null {
  const a = annotations.get(recordKey(record));
  if (a && a.overrideHacked !== null) return a.overrideHacked;
  return record.hacked ?? null;
}

export function computeStats(records: LogRecord[], annotations: Map<string, Annotation>): Stats {
  let judged = 0;
  let hackedCount = 0;
  let correctedJudged = 0;
  let correctedHackedCount = 0;

  for (const r of records) {
    if (r.hacked === true) {
      judged++;
      hackedCount++;
    } else if (r.hacked === false) {
      judged++;
    }

    const eff = effectiveHacked(r, annotations);
    if (eff === true) {
      correctedJudged++;
      correctedHackedCount++;
    } else if (eff === false) {
      correctedJudged++;
    }
  }

  return {
    total: records.length,
    judged,
    hackedCount,
    asr: judged > 0 ? hackedCount / judged : null,
    correctedJudged,
    correctedHackedCount,
    correctedAsr: correctedJudged > 0 ? correctedHackedCount / correctedJudged : null,
  };
}

export function formatPercent(v: number | null): string {
  if (v === null) return "—";
  return `${(v * 100).toFixed(1)}%`;
}
