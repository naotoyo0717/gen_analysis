import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { db } from "../db";
import { emptyAnnotation, recordKey, type Annotation, type LogRecord } from "../types";

export function useAnnotationsMap(): Map<string, Annotation> {
  const list = useLiveQuery(() => db.annotations.toArray(), [], []);
  return useMemo(() => new Map((list ?? []).map((a) => [a.key, a])), [list]);
}

export async function upsertAnnotation(record: LogRecord, patch: Partial<Annotation>): Promise<void> {
  const key = recordKey(record);
  const existing = await db.annotations.get(key);
  const base = existing ?? emptyAnnotation(record);
  const updated: Annotation = { ...base, ...patch, updatedAt: Date.now() };
  await db.annotations.put(updated);
}
