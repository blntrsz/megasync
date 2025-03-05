import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/home";
import { useLiveQuery } from "@electric-sql/pglite-react";
import { DB } from "./pg-lite";
import type { Article } from "./models";
import { useMutation } from "@tanstack/react-query";
import { useStream } from "~/stream-provider";
import { matchStream } from "@electric-sql/experimental";

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

  const stream = useStream("articles");
  const mutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        fetch("http://localhost:3001/articles", {
          method: "POST",
        }),

        matchStream(stream, ["insert"], () => true),
      ]);
    },
  });

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
        className="px-3 py-2 bg-blue-500 text-white rounded disabled:bg-gray-500"
        onClick={() => mutation.mutate()}
        disabled={mutation.status === "pending"}
      >
        {mutation.status === "pending" ? "Creating..." : "Create"}
      </button>
    </div>
  );
}
