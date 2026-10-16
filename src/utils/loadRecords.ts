import type { LogRecord } from "../types";

function isLogRecord(v: unknown): v is LogRecord {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.sample_id === "number" &&
    typeof r.condition === "string" &&
    typeof r.domain === "string" &&
    typeof r.attack_type === "string" &&
    typeof r.attack_name === "string" &&
    typeof r.response === "string" &&
    (typeof r.hacked === "boolean" || r.hacked === null || r.hacked === undefined)
  );
}

// records_asr.json形式などの欠損フィールドを補う（既存の値があればそれを優先）
function normalizeRecord(v: unknown, fileCondition: string): unknown {
  if (typeof v !== "object" || v === null) return v;
  const r = { ...(v as Record<string, unknown>) };
  if (typeof r.sample_id === "string" && r.sample_id.trim() !== "" && !Number.isNaN(Number(r.sample_id))) {
    r.sample_id = Number(r.sample_id);
  }
  if (r.hacked === undefined && typeof r.asr === "number") {
    r.hacked = r.asr === 1 ? true : r.asr === 0 ? false : null;
  }
  if (r.judge_method === undefined && typeof r.asr_method === "string") {
    r.judge_method = r.asr_method;
  }
  if (r.condition === undefined) {
    r.condition = fileCondition;
  }
  return r;
}

export interface LoadResult {
  records: LogRecord[];
  fileResults: { name: string; count: number; error?: string }[];
}

export async function loadRecordsFromFiles(files: FileList | File[]): Promise<LoadResult> {
  const records: LogRecord[] = [];
  const fileResults: LoadResult["fileResults"] = [];

  for (const file of Array.from(files)) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const arr = Array.isArray(data) ? data : [data];
      const fileCondition = file.name.replace(/\.[^.]+$/, "");
      const valid = arr.map((v) => normalizeRecord(v, fileCondition)).filter(isLogRecord);
      records.push(...valid);
      fileResults.push({
        name: file.name,
        count: valid.length,
        error: valid.length < arr.length ? `${arr.length - valid.length}件はスキーマ不一致でスキップ` : undefined,
      });
    } catch (e) {
      fileResults.push({ name: file.name, count: 0, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return { records, fileResults };
}
