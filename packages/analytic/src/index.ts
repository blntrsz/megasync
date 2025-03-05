import { Offset, ShapeStream } from "@electric-sql/client";
import assert from "node:assert";
import { writeFileSync, readFileSync } from "node:fs";
import config from "config";
import postgres from "postgres";

const sql = postgres({
  host: config.get("db.host"),
  port: config.get("db.port"),
  user: config.get("db.user"),
  password: config.get("db.password"),
  database: config.get("db.database"),
});

const OFFSET_FILE = "offset";
const HANDLE_FILE = "handle";
let offset: Offset | undefined = undefined;
let handle: string | undefined = undefined;
try {
  offset = readFileSync(OFFSET_FILE, "utf-8") as Offset;
  handle = readFileSync(HANDLE_FILE, "utf-8");
} catch (e) {}

const stream = new ShapeStream({
  url: `http://localhost:3000/v1/shape`,
  offset,
  handle,
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
    writeFileSync(OFFSET_FILE, stream.lastOffset);
    stream.shapeHandle && writeFileSync(HANDLE_FILE, stream.shapeHandle);

    console.log(
      `Processed ${values.length - 1} rows. New offset: ${
        stream.lastOffset
      } in handle: ${stream.shapeHandle}`
    );
  });
}, console.error);
