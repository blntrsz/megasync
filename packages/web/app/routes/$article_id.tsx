import { useLiveQuery } from "@electric-sql/pglite-react";
import { Link, useLoaderData, useParams } from "react-router";
import { DB } from "./pg-lite";
import type { ClientLoaderFunctionArgs } from "react-router";
import type { Article, Comment } from "./models";

function getArticlesById(id: string) {
  return `SELECT * FROM articles where id = ${id}`;
}

function getArticleCommentRelationships(id: string) {
  return `
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
    WHERE (pco.domain_object_id = ${id} and pco.domain_object_type = 'article')
      OR (nco.domain_object_id = ${id} and nco.domain_object_type = 'article')
  `;
}

function getCommentsByIds(ids: string[]) {
  if (ids.length === 0) {
    return `SELECT * FROM comments where 1 = 0;`;
  }
  return `SELECT * FROM comments where id in (${ids.join(",")});`;
}

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const db = await DB.instance.get();

  const [articles] = await db.exec(getArticlesById(params.article_id!));

  const [articleCommentRelationships] = await db.exec(
    getArticleCommentRelationships(params.article_id!)
  );

  const commentIds = articleCommentRelationships.rows.map((row) =>
    row.ntype === "comment" ? row.nid : row.pid
  ) as string[];

  const [comments] = commentIds.length
    ? await db.exec(getCommentsByIds(commentIds))
    : [{ rows: [] }];

  return {
    articles: articles as unknown as { rows: Article[] },
    commentIds,
    comments: comments as unknown as { rows: Comment[] },
  };
}

export default function ArticleID() {
  const { article_id } = useParams();
  const loaderData = useLoaderData<typeof clientLoader>();
  const articles =
    useLiveQuery<Article>(getArticlesById(article_id!)) ?? loaderData.articles;

  const comments =
    useLiveQuery<Comment>(getCommentsByIds(loaderData.commentIds)) ??
    loaderData.comments;

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
      {JSON.stringify(articles.rows)}
      <ul>
        {comments.rows.map((comment) => {
          return (
            <li key={comment.id}>
              <Link to={`/${comment.id}`}>
                <div>{comment.name}</div>
              </Link>
            </li>
          );
        })}
      </ul>
      <button
        className="px-3 py-2 bg-blue-500 text-white rounded"
        onClick={addComment}
      >
        Add Comment
      </button>
    </div>
  );
}
