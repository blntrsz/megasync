import { Message, Row } from "@electric-sql/client";
import assert from "node:assert";
import pgvector from "pgvector";
import postgres from "postgres";
import config from "config";
import { createStreamListener } from "core/src/index";

const sql = postgres({
  host: config.get("db.host"),
  port: config.get("db.port"),
  user: config.get("db.user"),
  password: config.get("db.password"),
  database: config.get("db.database"),
});

function handler(table: string) {
  return async function (values: Message<Row<never>>[]) {
    sql.begin(async (tx) => {
      for (const value of values) {
        if (value.headers.control?.toString() === "up-to-date") {
          console.log("up-to-date");
          continue;
        }

        assert("value" in value, "value is missing " + JSON.stringify(value));
        assert("key" in value, "headers is missing");
        assert("id" in value.value, "id is missing");

        const embedding = Array.from({
          length: 4096,
        }).fill(0) as number[];

        await tx`
        INSERT INTO ${sql(table)} (
          id, 
          vector
        ) 
        VALUES (
          ${value.value.id as string}, 
          ${pgvector.toSql(embedding)}
        )
        ON CONFLICT (id) DO UPDATE SET vector = ${pgvector.toSql(embedding)};
      `;
      }
    });
  };
}

createStreamListener({
  table: "relationships.relationships",
  callback: handler("relationships.relationships"),
});
createStreamListener({
  table: "relationships.domain_objects",
  callback: handler("relationships.domain_objects"),
});
createStreamListener({
  table: "article_manager.articles",
  callback: handler("article_manager.articles"),
});
createStreamListener({
  table: "comment_service.comments",
  callback: handler("comment_service.comments"),
});
