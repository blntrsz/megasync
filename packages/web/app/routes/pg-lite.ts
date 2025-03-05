import { PGlite } from "@electric-sql/pglite";
import {
  electricSync,
  type SyncShapeToTableOptions,
  type SyncShapeToTableResult,
} from "@electric-sql/pglite-sync";
import { live, type LiveNamespace } from "@electric-sql/pglite/live";

export class DB {
  db:
    | Promise<
        PGlite & {
          electric: {
            initMetadataTables: () => Promise<void>;
            syncShapeToTable: (
              options: SyncShapeToTableOptions
            ) => Promise<SyncShapeToTableResult>;
          };
          live: LiveNamespace;
        }
      >
    | undefined;
  static #instance: DB;

  private constructor() {}

  static get instance() {
    if (!this.#instance) {
      this.#instance = new DB();
    }
    return this.#instance;
  }

  async get() {
    if (!this.db) {
      this.db ||= PGlite.create({
        dataDir: "idb://my-database",
        extensions: {
          electric: electricSync(),
          live,
        },
      });
    }
    return this.db;
  }
}
