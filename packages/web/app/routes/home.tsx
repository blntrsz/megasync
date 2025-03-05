import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/home";
import { useLiveQuery } from "@electric-sql/pglite-react";
import { DB } from "./pg-lite";
import type { Article } from "./models";

const QUERY = `SELECT * FROM articles;`;

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function clientLoader() {
  const db = await DB.instance.get();

  const [result] = await db.exec(QUERY);

  return result as unknown as { rows: Article[] };
}

export default function Home() {
  const defaultItems = useLoaderData<typeof clientLoader>();
  const items = useLiveQuery<Article>(QUERY) ?? defaultItems;

  function createArticle() {
    return fetch("http://localhost:3001/articles", {
      method: "POST",
    });
  }

  return (
    <div className="grid gap-4">
      <h1>Articles</h1>
      <ul>
        {(items?.rows ?? []).map((row) => (
          <li key={row.id}>
            <Link to={`/${row.id}`}>{row.name as string}</Link>
          </li>
        ))}
      </ul>
      <button
        className="px-3 py-2 bg-blue-500 text-white rounded"
        onClick={createArticle}
      >
        Create
      </button>
    </div>
  );
}
