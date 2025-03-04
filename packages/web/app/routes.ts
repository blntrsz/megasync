import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/:article_id", "routes/$article_id.tsx"),
] satisfies RouteConfig;
