import { Message, Row } from "@electric-sql/client";
import * as Minio from "minio";
import assert from "node:assert";
import { createStreamListener } from "core/src/index";

const bucketName = "domainobjects";

const minioClient = new Minio.Client({
  endPoint: "127.0.0.1",
  port: 9000,
  useSSL: false,
  accessKey: "admin",
  secretKey: "password",
});

const exists = await minioClient.bucketExists(bucketName);

if (!exists) {
  await minioClient.makeBucket(bucketName);
  await minioClient.setBucketVersioning(bucketName, { Status: "Enabled" });
  console.log(`Bucket "${bucketName}" created.`);
} else {
  console.log(`Bucket "${bucketName}" already exists.`);
}

async function handler(values: Message<Row<never>>[]) {
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
  }
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
