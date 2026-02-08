import { asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { screeningTable, movieTable } from "../../database/schema";
import { paginationValidators, withPagination } from "../utils/withPagination";
import { describeRoute } from "hono-openapi";

const app = new Hono();

app.get(
  "/movies",
  paginationValidators(),
  describeRoute({
    tags: ["Public"],
    summary: "Get a list of screening movies",
  }),
  async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const movies = await withPagination(screeningTable, {
      page,
      pageSize,
      orderBy: asc(screeningTable.start_time),
      leftJoin: {
        table: movieTable,
        condition: eq(screeningTable.movieId, movieTable.id),
      }
    });

    return c.json(movies);
  }
);

export { app as publicRoutes }