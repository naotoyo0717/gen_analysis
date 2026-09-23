import type { Annotation } from "../types";

interface Props {
  annotation: Annotation | undefined;
  onChange: (patch: Partial<Annotation>) => void;
}

export function ReviewPanel({ annotation, onChange }: Props) {
  const overrideHacked = annotation?.overrideHacked ?? null;
  const falsePositive = annotation?.falsePositive ?? false;
  const falseNegative = annotation?.falseNegative ?? false;
  const note = annotation?.note ?? "";

  return (
    <section className="review-panel">
      <h3>手動レビュー</h3>

      <div className="review-panel__row">
        <span className="review-panel__label">判定オーバーライド</span>
        <div className="review-panel__override-buttons">
          <button
            type="button"
            className={`override-btn override-btn--hacked${overrideHacked === true ? " override-btn--active" : ""}`}
            onClick={() => onChange({ overrideHacked: overrideHacked === true ? null : true })}
          >
            hacked
          </button>
          <button
            type="button"
            className={`override-btn override-btn--defended${overrideHacked === false ? " override-btn--active" : ""}`}
            onClick={() => onChange({ overrideHacked: overrideHacked === false ? null : false })}
          >
            defended
          </button>
          {overrideHacked !== null && (
            <button type="button" className="override-btn override-btn--clear" onClick={() => onChange({ overrideHacked: null })}>
              クリア
            </button>
          )}
        </div>
      </div>

      <div className="review-panel__row">
        <label className="review-panel__checkbox">
          <input
            type="checkbox"
            checked={falsePositive}
            onChange={(e) => onChange({ falsePositive: e.target.checked })}
          />
          False Positive（誤ってhackedと判定）
        </label>
        <label className="review-panel__checkbox">
          <input
            type="checkbox"
            checked={falseNegative}
            onChange={(e) => onChange({ falseNegative: e.target.checked })}
          />
          False Negative（誤ってdefendedと判定）
        </label>
      </div>

      <div className="review-panel__row review-panel__row--note">
        <label className="review-panel__label" htmlFor="review-note">
          メモ
        </label>
        <textarea
          id="review-note"
          className="review-panel__note"
          value={note}
          onChange={(e) => onChange({ note: e.target.value })}
          rows={4}
          placeholder="自由記述メモ"
        />
      </div>
    </section>
  );
}
