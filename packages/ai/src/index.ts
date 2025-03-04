import { Offset, ShapeStream } from "@electric-sql/client";
import assert from "node:assert";
import { writeFileSync, readFileSync } from "node:fs";
import config from "config";
import postgres from "postgres";
import pgvector from "pgvector";

const sql = postgres({
  host: config.get("db.host"),
  port: config.get("db.port"),
  user: config.get("db.user"),
  password: config.get("db.password"),
  database: config.get("db.database"),
});

const OFFSET_FILE = "offset";
const HANDLE_FILE = "handle";
const offset = readFileSync(OFFSET_FILE, "utf-8");
const handle = readFileSync(HANDLE_FILE, "utf-8");

const stream = new ShapeStream({
  url: `http://localhost:3000/v1/shape`,
  offset: offset ? (offset as Offset) : undefined,
  handle: handle ? handle : undefined,
  params: {
    table: `"article_manager"."articles"`,
    replica: "full",
  },
});

stream.subscribe(async (data) => {
  const values = [...data.values()];

  if (values.length === 1 && values[0].headers.control === "up-to-date") {
    console.log("up-to-date");
    return;
  }

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
        INSERT INTO "article_manager"."articles" (
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
    writeFileSync(OFFSET_FILE, stream.lastOffset);
    stream.shapeHandle && writeFileSync(HANDLE_FILE, stream.shapeHandle);

    console.log(
      `Processed ${values.length - 1} rows. New offset: ${
        stream.lastOffset
      } in handle: ${stream.shapeHandle}`
    );
  });
}, console.error);
