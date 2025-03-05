import { Offset, ShapeStream } from "@electric-sql/client";
import { writeFileSync, readFileSync } from "node:fs";
import * as Minio from "minio";
import assert from "node:assert";

const bucketName = "domainobjects";

const minioClient = new Minio.Client({
  endPoint: "127.0.0.1",
  port: 9000,
  useSSL: false,
  accessKey: "admin",
  secretKey: "password",
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

const exists = await minioClient.bucketExists(bucketName);

if (!exists) {
  await minioClient.makeBucket(bucketName);
  await minioClient.setBucketVersioning(bucketName, { Status: "Enabled" });
  console.log(`Bucket "${bucketName}" created.`);
} else {
  console.log(`Bucket "${bucketName}" already exists.`);
}

stream.subscribe(async (data) => {
  const values = [...data.values()];

  if (values.length === 1 && values[0].headers.control === "up-to-date") {
    console.log("up-to-date");
    return;
  }

  for (const value of values) {
    if (value.headers.control?.toString() === "up-to-date") {
      console.log("up-to-date");
      continue;
    }

    assert("value" in value, "value is missing " + JSON.stringify(value));
    assert("key" in value, "headers is missing");
    assert("updated_at" in value.value, "updated_at is missing");

    await minioClient.putObject(
      bucketName,
      value.key,
      JSON.stringify(value.value)
    );
    writeFileSync(OFFSET_FILE, stream.lastOffset);
    stream.shapeHandle && writeFileSync(HANDLE_FILE, stream.shapeHandle);

    console.log(
      `Processed ${values.length - 1} rows. New offset: ${
        stream.lastOffset
      } in handle: ${stream.shapeHandle}`
    );
  }
}, console.error);
