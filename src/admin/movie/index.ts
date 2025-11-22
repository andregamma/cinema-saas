import { Hono } from "hono";
import { movieTable } from "../../../database/schema";
import z from "zod";
import { describeRoute, validator } from "hono-openapi";
import { eq } from "drizzle-orm";
import { db } from "../../../database";

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
  describeRoute({
    tags: ["Movies"],
    summary: "Get a list of movies",
  }),
  async (c) => {
    const movies = await db.select().from(movieTable).limit(10);

    return c.json({
      data: movies,
    });
  },
);

app.get(
  "/:movieId",
  validator("param", z.object({
    movieId: z.uuidv7(),
  })),
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
      .limit(1)

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
  validator("param", z.object({
    movieId: z.uuidv7(),
  })),
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
  validator("param", z.object({
    movieId: z.uuidv7(),
  })),
  describeRoute({
    tags: ["Movies", "Screenings"],
    summary: "Get screenings for a movie",
  }),
  async (c) => {
    const { movieId } = c.req.valid("param");

    const screenings = await db
      .select()
      .from(movieTable)
      .where(eq(movieTable.id, movieId))
      .limit(10);

    return c.json({
      data: screenings,
    });
  },
);

app.post(
  "/:movieId/screening",
  validator("param", z.object({
    movieId: z.uuidv7(),
  })),
  describeRoute({
    tags: ["Movies", "Screenings"],
    summary: "Create a screening for a movie",
  }),
  async (c) => {
    const { movieId } = c.req.valid("param");

    // Implementation for creating a screening goes here

    return c.json({ message: "Screening created" });
  },
);

app.put(
  "/:movieId/screening/:screeningId",
  validator("param", z.object({
    movieId: z.uuidv7(),
    screeningId: z.uuidv7(),
  })),
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
  validator("param", z.object({
    movieId: z.uuidv7(),
    screeningId: z.uuidv7(),
  })),
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
