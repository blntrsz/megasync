import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { PGliteProvider } from "@electric-sql/pglite-react";
import { PGlite } from "@electric-sql/pglite";
import { electricSync } from "@electric-sql/pglite-sync";
import { live } from "@electric-sql/pglite/live";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export async function clientLoader() {
  const db = await PGlite.create({
    dataDir: "idb://my-database",
    extensions: {
      electric: electricSync(),
      live,
    },
  });

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
    await db.electric.syncShapeToTable({
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
  }

  return db;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const db = useLoaderData<typeof clientLoader>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <PGliteProvider db={db as any}>{children}</PGliteProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
