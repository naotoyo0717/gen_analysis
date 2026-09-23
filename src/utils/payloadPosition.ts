import type { PayloadPosition } from "../types";

const START_RATIO = 0.05;
const END_RATIO = 0.95;

// poisoned_input内でattack_strを検出し、挿入位置を分類する
export function findPayloadPosition(poisonedInput: string, attackStr: string): PayloadPosition {
  if (!attackStr) {
    return { kind: "not_found", offset: -1, length: 0 };
  }
  const offset = poisonedInput.indexOf(attackStr);
  if (offset === -1) {
    return { kind: "not_found", offset: -1, length: attackStr.length };
  }
  const len = poisonedInput.length;
  const endOffset = offset + attackStr.length;
  if (offset <= len * START_RATIO) {
    return { kind: "start", offset, length: attackStr.length };
  }
  if (endOffset >= len * END_RATIO) {
    return { kind: "end", offset, length: attackStr.length };
  }
  return { kind: "middle", offset, length: attackStr.length };
}

export const PAYLOAD_POSITION_LABEL: Record<PayloadPosition["kind"], string> = {
  start: "先頭",
  middle: "中間",
  end: "末尾",
  not_found: "位置特定不可",
};
