import Dexie, { type Table } from "dexie";
import type { Annotation } from "./types";

class ReviewDB extends Dexie {
  annotations!: Table<Annotation, string>;

  constructor() {
    super("bipia_review_db");
    this.version(1).stores({
      // keyが主キー。sample_id/condition/attack_nameで絞り込めるよう複合インデックスも張る
      annotations: "key, sample_id, condition, attack_name, [condition+attack_name]",
    });
  }
}

export const db = new ReviewDB();
