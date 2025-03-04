import { useLiveQuery } from "@electric-sql/pglite-react";
import { Link, useParams } from "react-router";

export default function ArticleID() {
  const { article_id } = useParams();
  const items = useLiveQuery<{ id: number; name: string }>(
    `SELECT * FROM articles where id = ${article_id}`
  ) ?? { rows: [] };

  if (!items.rows.length) {
    return <div>Not found</div>;
  }

  function addComment() {
    return fetch(
      `http://localhost:3001/comments/with-article-relationship?id=${article_id}`,
      {
        method: "POST",
      }
    );
  }

  return (
    <div className="grid gap-4">
      {JSON.stringify(items.rows)}
      <CommentList />
      <button
        className="px-3 py-2 bg-blue-500 text-white rounded"
        onClick={addComment}
      >
        Add Comment
      </button>
    </div>
  );
}

function CommentList() {
  const { article_id } = useParams();
  const items = useLiveQuery<{
    pid: number;
    ptype: string;
    nid: number;
    ntype: string;
  }>(
    `
      SELECT 
        pco.domain_object_id as pid,
        pco.domain_object_type as ptype,
        nco.domain_object_id as nid,
        nco.domain_object_type as ntype
      FROM relationships
      JOIN domain_objects as nco
        ON relationships.previous_domain_object_id = nco.id
      JOIN domain_objects as pco
        ON relationships.next_domain_object_id = pco.id
      WHERE (pco.domain_object_id = ${article_id} and pco.domain_object_type = 'article')
        OR (nco.domain_object_id = ${article_id} and nco.domain_object_type = 'article')
  `
  );

  return (
    <div>
      <ul>
        {(items?.rows ?? []).map((row) => {
          const id = row.ptype === "comment" ? row.pid : row.nid;

          return (
            <li key={id}>
              <Link to={`/${id}`}>
                <CommentItem id={id} />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CommentItem({ id }: { id: number }) {
  const items = useLiveQuery<{ id: number; name: string }>(
    `SELECT * FROM comments where id = ${id}`
  ) ?? { rows: [] };
  const item = items.rows[0];

  if (!item) {
    return <div>Not found</div>;
  }

  return <div>{item.name}</div>;
}
