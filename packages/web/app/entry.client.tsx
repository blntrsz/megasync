import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { DB } from "./routes/pg-lite";
import { PGliteProvider } from "@electric-sql/pglite-react";
import { ShapeStream } from "@electric-sql/client";
import { StreamProvider } from "./stream-provider";

DB.instance.get().then(async (db) => {
  // Setup the local database schema
  await db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      "id" serial PRIMARY KEY,
      "name" text NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      deleted_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS comments (
      "id" serial PRIMARY KEY,
      "name" text NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      deleted_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS domain_objects (
      "id" serial PRIMARY KEY,
      "domain_object_type" text NOT NULL,
      "domain_object_id" integer NOT NULL,
      "name" text NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      deleted_at TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS relationships (
      "id" serial PRIMARY KEY,
      "previous_domain_object_id" integer NOT NULL,
      "next_domain_object_id" integer NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      deleted_at TIMESTAMPTZ
    );
  `);

  if (typeof window !== "undefined") {
    // @ts-ignore
    window.db = db;
  }

  const streams: Record<string, ShapeStream> = {};

  for (const { table, schema } of [
    {
      table: "articles",
      schema: "article_manager",
    },
    {
      table: "comments",
      schema: "comment_service",
    },
    {
      table: "domain_objects",
      schema: "relationships",
    },
    {
      table: "relationships",
      schema: "relationships",
    },
  ]) {
    const syncShape = await db.electric.syncShapeToTable({
      table,
      shape: {
        url: `http://localhost:3000/v1/shape`,
        params: {
          table: `"${schema}"."${table}"`,
        },
      },
      shapeKey: table,
      primaryKey: ["id"],
    });

    streams[table] = syncShape.stream as ShapeStream;
  }

  return startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <StreamProvider streams={streams}>
          <PGliteProvider db={db}>
            <HydratedRouter />
          </PGliteProvider>
        </StreamProvider>
      </StrictMode>
    );
  });
});
