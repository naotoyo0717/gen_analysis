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
    typeof r.attack_str === "string" &&
    typeof r.instruction === "string" &&
    typeof r.poisoned_input === "string" &&
    typeof r.response === "string" &&
    (typeof r.hacked === "boolean" || r.hacked === null || r.hacked === undefined)
  );
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
      const valid = arr.filter(isLogRecord);
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
