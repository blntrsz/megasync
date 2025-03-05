import assert from "node:assert";
import config from "config";
import postgres from "postgres";
import { createStreamListener } from "core/src/index";
import { Message, Row } from "@electric-sql/client";

const sql = postgres({
  host: config.get("db.host"),
  port: config.get("db.port"),
  user: config.get("db.user"),
  password: config.get("db.password"),
  database: config.get("db.database"),
});

async function handler(values: Message<Row<never>>[]) {
  sql.begin(async (tx) => {
    for (const value of values) {
      assert("value" in value, "value is missing " + JSON.stringify(value));
      assert("key" in value, "headers is missing");
      assert("updated_at" in value.value, "updated_at is missing");

      await tx`
        INSERT INTO logs (
          id, 
          updated_at, 
          data, 
          operation
        ) 
        VALUES (
          ${value.key}, 
          ${
            value.headers.operation === "delete"
              ? (value.value.deleted_at as string)
              : (value.value.updated_at as string)
          }, 
          ${JSON.stringify(value.value)}, 
          ${value.headers.operation}
        )
        ON CONFLICT DO NOTHING;
      `;
    }
  });
}

createStreamListener({
  table: "relationships.relationships",
  callback: handler,
});
createStreamListener({
  table: "relationships.domain_objects",
  callback: handler,
});
createStreamListener({
  table: "article_manager.articles",
  callback: handler,
});
createStreamListener({
  table: "comment_service.comments",
  callback: handler,
});
