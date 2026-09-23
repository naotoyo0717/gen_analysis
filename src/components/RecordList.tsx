import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import type { Annotation, LogRecord } from "../types";
import { judgeStatus, recordKey } from "../types";
import { effectiveHacked } from "../utils/stats";
import { Tag } from "./Tag";

interface Props {
  records: LogRecord[];
  annotations: Map<string, Annotation>;
  selectedKey: string | null;
  onSelect: (record: LogRecord) => void;
}

const STATUS_LABEL: Record<string, string> = {
  hacked: "HACKED",
  defended: "DEFENDED",
  unjudged: "UNJUDGED",
};

export function RecordList({ records, annotations, selectedKey, onSelect }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: records.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 12,
  });

  return (
    <div className="record-list" ref={parentRef}>
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((vItem) => {
          const record = records[vItem.index];
          const key = recordKey(record);
          const annotation = annotations.get(key);
          const eff = effectiveHacked(record, annotations);
          const status = judgeStatus(eff);
          const isOverridden = !!annotation && annotation.overrideHacked !== null;
          const hasNote = !!annotation && (annotation.note.trim() !== "" || annotation.falsePositive || annotation.falseNegative);

          return (
            <div
              key={key}
              className={`record-row record-row--${status}${key === selectedKey ? " record-row--selected" : ""}`}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${vItem.start}px)`,
                height: vItem.size,
              }}
              onClick={() => onSelect(record)}
            >
              <div className="record-row__top">
                <span className="record-row__id">#{record.sample_id}</span>
                <span className={`record-row__status record-row__status--${status}`}>
                  {STATUS_LABEL[status]}
                  {isOverridden && <span className="record-row__manual"> (manual)</span>}
                </span>
                {hasNote && <span className="record-row__note-flag" title="レビュー済み">memo</span>}
              </div>
              <div className="record-row__tags">
                <Tag kind="domain">{record.domain}</Tag>
                <Tag kind="attack-type">{record.attack_type}</Tag>
                <Tag kind="attack-name">{record.attack_name}</Tag>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
