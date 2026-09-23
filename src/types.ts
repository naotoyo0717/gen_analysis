// BIPIA攻撃ログの1レコード
export interface LogRecord {
  sample_id: number;
  condition: string;
  domain: string;
  attack_type: string;
  attack_name: string;
  attack_str: string;
  instruction: string;
  clean_input?: string;
  poisoned_input: string;
  response: string;
  hacked: boolean | null;
  // 将来拡張用（現状データには存在しない）
  judge_method?: string;
  judge_evidence?: string;
}

// レコードを一意に識別する複合キー
export function recordKey(r: Pick<LogRecord, "sample_id" | "attack_name" | "condition">): string {
  return `${r.sample_id}::${r.attack_name}::${r.condition}`;
}

export type JudgeStatus = "hacked" | "defended" | "unjudged";

export function judgeStatus(hacked: boolean | null | undefined): JudgeStatus {
  if (hacked === true) return "hacked";
  if (hacked === false) return "defended";
  return "unjudged";
}

// 手動レビューのアノテーション（IndexedDBに永続化）
export interface Annotation {
  key: string; // recordKey()の値。Dexieの主キー
  sample_id: number;
  attack_name: string;
  condition: string;
  overrideHacked: boolean | null; // null = オーバーライドなし
  falsePositive: boolean;
  falseNegative: boolean;
  note: string;
  updatedAt: number;
}

export function emptyAnnotation(r: Pick<LogRecord, "sample_id" | "attack_name" | "condition">): Annotation {
  return {
    key: recordKey(r),
    sample_id: r.sample_id,
    attack_name: r.attack_name,
    condition: r.condition,
    overrideHacked: null,
    falsePositive: false,
    falseNegative: false,
    note: "",
    updatedAt: 0,
  };
}

// attack_strのpoisoned_input内での挿入位置
export type PayloadPositionKind = "start" | "middle" | "end" | "not_found";

export interface PayloadPosition {
  kind: PayloadPositionKind;
  offset: number; // not_foundの場合は-1
  length: number;
}
