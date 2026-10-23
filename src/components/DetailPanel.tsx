import type { Annotation, LogRecord } from "../types";
import { judgeStatus } from "../types";
import { findPayloadPosition, PAYLOAD_POSITION_LABEL } from "../utils/payloadPosition";
import { HighlightedText } from "./HighlightedText";
import { Tag } from "./Tag";
import { CopyButton } from "./CopyButton";
import { ReviewPanel } from "./ReviewPanel";
import { effectiveHacked } from "../utils/stats";

interface Props {
  record: LogRecord | null;
  annotation: Annotation | undefined;
  onAnnotationChange: (patch: Partial<Annotation>) => void;
  searchQuery: string;
}

const STATUS_LABEL: Record<string, string> = {
  hacked: "攻撃成功 (hacked)",
  defended: "防御成功 (defended)",
  unjudged: "未判定",
};

export function DetailPanel({ record, annotation, onAnnotationChange, searchQuery }: Props) {
  if (!record) {
    return (
      <div className="detail-panel detail-panel--empty">
        <p>左の一覧からレコードを選択してください。</p>
      </div>
    );
  }

  const annotations = new Map(annotation ? [[annotation.key, annotation]] : []);
  const eff = effectiveHacked(record, annotations);
  const status = judgeStatus(eff);
  const originalStatus = judgeStatus(record.hacked);
  const isOverridden = !!annotation && annotation.overrideHacked !== null;

  const position = findPayloadPosition(record.poisoned_input ?? "", record.attack_str ?? "");
  const payloadMarks =
    position.kind !== "not_found" ? [{ start: position.offset, end: position.offset + position.length, type: "payload" }] : [];

  return (
    <div className={`detail-panel detail-panel--${status}`}>
      <div className="detail-panel__header">
        <div className="detail-panel__title">
          <span className="detail-panel__sample-id">Sample #{record.sample_id}</span>
          <span className="detail-panel__condition">{record.condition}</span>
        </div>
        <div className="detail-panel__tags">
          <Tag kind="domain">{record.domain}</Tag>
          <Tag kind="attack-type">{record.attack_type}</Tag>
          <Tag kind="attack-name">{record.attack_name}</Tag>
        </div>
        <div className={`detail-panel__status detail-panel__status--${status}`}>
          {STATUS_LABEL[status]}
          {isOverridden && (
            <span className="detail-panel__original-status">
              （元判定: {STATUS_LABEL[originalStatus]} → 手動で上書き）
            </span>
          )}
        </div>
      </div>

      {record.instruction !== undefined && (
        <section className="detail-section">
          <h3>
            Instruction
            <CopyButton text={record.instruction} />
          </h3>
          <div className="detail-section__body">
            <HighlightedText text={record.instruction} query={searchQuery} />
          </div>
        </section>
      )}

      {record.clean_input !== undefined && (
        <section className="detail-section">
          <h3>
            Clean Input（注入前）
            <CopyButton text={record.clean_input} />
          </h3>
          <div className="detail-section__body detail-section__body--pre">
            <HighlightedText text={record.clean_input} query={searchQuery} />
          </div>
        </section>
      )}

      {record.poisoned_input !== undefined && (
        <section className="detail-section">
          <h3>
            Poisoned Input（注入後）
            <span className={`payload-badge payload-badge--${position.kind}`}>
              {PAYLOAD_POSITION_LABEL[position.kind]}
              {position.kind !== "not_found" && ` (offset: ${position.offset})`}
            </span>
            <CopyButton text={record.poisoned_input} />
          </h3>
          <div className="detail-section__body detail-section__body--pre">
            <HighlightedText text={record.poisoned_input} query={searchQuery} extraMarks={payloadMarks} />
          </div>
        </section>
      )}

      <section className="detail-section">
        <h3>
          Response
          <CopyButton text={record.response} />
        </h3>
        <div className="detail-section__body detail-section__body--pre">
          <HighlightedText text={record.response} query={searchQuery} />
        </div>
      </section>

      {record.judge_evidence && (
        <section className="detail-section">
          <h3>Judge Evidence</h3>
          <div className="detail-section__body detail-section__body--pre">
            <HighlightedText text={record.judge_evidence} query={searchQuery} />
          </div>
        </section>
      )}
      {record.judge_method && (
        <section className="detail-section">
          <h3>Judge Method</h3>
          <div className="detail-section__body">{record.judge_method}</div>
        </section>
      )}

      <ReviewPanel annotation={annotation} onChange={onAnnotationChange} />
    </div>
  );
}
