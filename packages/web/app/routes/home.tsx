import { Link } from "react-router";
import type { Route } from "./+types/home";
import { useLiveQuery } from "@electric-sql/pglite-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const items = useLiveQuery.sql<{ id: number; name: string }>`
    SELECT * FROM articles;
  `;

  console.log(items);

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
