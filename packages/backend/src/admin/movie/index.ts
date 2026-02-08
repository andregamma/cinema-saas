import { Hono } from "hono";
import {
  exhibitorScreenTable,
  movieTable,
  screeningTable,
  screeningTableInsertSchema,
} from "../../../database/schema";
import z from "zod";
import { describeRoute, resolver, validator } from "hono-openapi";
import { eq } from "drizzle-orm";
import { db } from "../../../database";
import { paginationValidators, withPagination } from "../../utils/withPagination";

const movieSchema = z.object({
  title: z.string().max(255),
  description: z.string().max(1000),
  durationMinutes: z.number().int().positive(),
  imdbId: z.string().max(20),
  tmdbId: z.string().max(20),
});

const app = new Hono();

app.get(
  "/",
  paginationValidators(),
  describeRoute({
    tags: ["Movies"],
    summary: "Get a list of movies",
    responses: {
      200: {
        description: "A list of movies",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                data: z.array(movieSchema),
                pagination: z.object({
                  page: z.number(),
                  pageSize: z.number(),
                  total: z.number(),
                  totalPages: z.number(),
                }),
              }),
            ),
          },
        },
      },
    },
  }),
  async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const result = await withPagination(movieTable, {
      page,
      pageSize,
      orderBy: eq(movieTable.title, "asc"),
    });

    return c.json(result);
  },
);

app.get(
  "/:movieId",
  validator(
    "param",
    z.object({
      movieId: z.uuidv7(),
    }),
  ),
  describeRoute({
    tags: ["Movies"],
    summary: "Get a movie by ID",
  }),
  async (c) => {
    const { movieId } = c.req.param();

    const [movie] = await db
      .select()
      .from(movieTable)
      .where(eq(movieTable.id, movieId))
      .limit(1);

    if (!movie) {
      return c.json({ message: "Movie not found" }, 404);
    }

    return c.json(movie);
  },
);

app.post(
  "/",
  describeRoute({
    tags: ["Movies"],
    summary: "Create a new movie",
  }),
  validator("json", movieSchema),
  async (c) => {
    const body = c.req.valid("json");
    const [createdMovie] = await db.insert(movieTable).values(body).returning();

    return c.json(createdMovie);
  },
);

app.put(
  "/:movieId",
  validator(
    "param",
    z.object({
      movieId: z.uuidv7(),
    }),
  ),
  describeRoute({
    tags: ["Movies"],
    summary: "Update a movie",
  }),
  validator("json", movieSchema),
  async (c) => {
    const { movieId } = c.req.param();
    const body = c.req.valid("json");

    const [updatedMovie] = await db
      .update(movieTable)
      .set(body)
      .where(eq(movieTable.id, movieId))
      .returning();

    return c.json(updatedMovie);
  },
);

/**
 * Screenings
 */

app.get(
  "/:movieId/screening",
  validator(
    "param",
    z.object({
      movieId: z.uuidv7(),
    }),
  ),
  validator("query", z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Format: YYYY-MM-DD
  })),
  describeRoute({
    tags: ["Movies", "Screenings"],
    summary: "Get screenings for a movie",
  }),
  async (c) => {
    const { movieId } = c.req.valid("param");
    const { date } = c.req.valid("query");

    const query = await db
      .select()
      .from(screeningTable)
      .where(eq(screeningTable.movieId, movieId))
      .leftJoin(
        exhibitorScreenTable,
        eq(exhibitorScreenTable.id, screeningTable.exhibitorScreenId),
      )

    return c.json({
      data: query.map((s) => ({
        ...s.screening,
        exhibitorScreen: s.exhibitor_screen,
      })),
    });
  },
);

app.post(
  "/:movieId/screening",
  validator(
    "param",
    z.object({
      movieId: z.uuidv7(),
    }),
  ),
  validator(
    "json",
    z.object({
      exhibitorsId: z.array(z.uuidv7()),
      startTimes: z.array(z.string()),
      price: z.number().positive(),
    }),
  ),
  describeRoute({
    tags: ["Movies", "Screenings"],
    summary: "Create a screening for a movie",
  }),
  async (c) => {
    const { movieId } = c.req.valid("param");
    const body = c.req.valid("json");

    await db.transaction(async (tx) => {
      const createdScreenings = [];

      for (const exhibitorScreenId of body.exhibitorsId) {
        for (const start_time of body.startTimes) {
          const screeningToInsert = screeningTableInsertSchema.parse({
            movieId,
            exhibitorScreenId,
            start_time,
            price: body.price,
          });
          const [screening] = await tx.insert(screeningTable).values(screeningToInsert).returning();

          if(screening){
            createdScreenings.push(screening);
          }
        }
      }

      return c.json({
        data: createdScreenings,
      });
    });
  },
);

app.put(
  "/:movieId/screening/:screeningId",
  validator(
    "param",
    z.object({
      movieId: z.uuidv7(),
      screeningId: z.uuidv7(),
    }),
  ),
  describeRoute({
    tags: ["Movies", "Screenings"],
    summary: "Update a screening for a movie",
  }),
  async (c) => {
    const { movieId, screeningId } = c.req.valid("param");

    // Implementation for updating a screening goes here

    return c.json({ message: "Screening updated" });
  },
);

app.get(
  "/:movieId/screening/:screeningId",
  validator(
    "param",
    z.object({
      movieId: z.uuidv7(),
      screeningId: z.uuidv7(),
    }),
  ),
  describeRoute({
    tags: ["Movies", "Screenings"],
    summary: "Get a screening by ID for a movie",
  }),
  async (c) => {
    const { movieId, screeningId } = c.req.valid("param");

    // Implementation for getting a screening by ID goes here

    return c.json({ message: "Screening details" });
  },
);

export { app as movieRoutes };
