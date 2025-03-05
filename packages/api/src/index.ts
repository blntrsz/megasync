import { faker } from "@faker-js/faker";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import postgres from "postgres";

const sql = postgres({
  host: "127.0.0.1",
  port: 5001,
  user: "postgres",
  password: "postgres",
  database: "postgres",
});

const app = new Hono();

app.use(cors());

app.post("/articles", async (c) => {
  const name = faker.word.words({
    count: {
      min: 5,
      max: 10,
    },
  });
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const result = await sql`
    INSERT INTO "article_manager"."articles" (name) VALUES (${name});
  `;
  return c.json(result.at(0));
});

app.post("/comments/with-article-relationship", async (c) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const id = new URL(c.req.url).searchParams.get("id");
  const name = faker.word.words({
    count: {
      min: 5,
      max: 10,
    },
  });
  const relationship = await sql.begin(async (tx) => {
    const [article] = await tx`
      SELECT * FROM "article_manager"."articles" WHERE id = ${id};
    `;
    const [articleDomainObject] = await tx`
      INSERT INTO "relationships"."domain_objects" (domain_object_type, domain_object_id, name) 
      VALUES ('article', ${article.id}, ${article.name}) RETURNING *;
    `;
    const [comment] = await tx`
      INSERT INTO "comment_service"."comments" (name) VALUES (${name}) RETURNING *;
    `;
    const [commentDomainObject] = await tx`
      INSERT INTO "relationships"."domain_objects" (domain_object_type, domain_object_id, name) 
      VALUES ('comment', ${comment.id}, ${comment.name}) RETURNING *;
    `;
    const [relationship] = await tx`
      INSERT INTO "relationships"."relationships" (previous_domain_object_id, next_domain_object_id) 
      VALUES (${articleDomainObject.id}, ${commentDomainObject.id}) RETURNING *;
    `;

    return relationship;
  });

  return c.json(relationship);
});

serve(
  {
    fetch: app.fetch,
    port: 3001,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
