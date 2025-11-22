import { Hono } from "hono";
import { exhibitorInsertSchema, exhibitorSelectSchema, exhibitorTable, exhibitorUpdateSchema } from "../../../database/schema";
import { describeRoute, resolver, validator } from "hono-openapi";
import z from "zod";
import { db } from "../../../database";
import { eq } from "drizzle-orm";

const app = new Hono()

app.get(
  "/",
  describeRoute({
    tags: ["Exhibitor"],
    summary: "Get a list of exhibitors",
    responses: {
      200: {
        description: "A list of exhibitors",
        content: {
          "application/json": {
            schema: resolver(z.object({
              data: z.array(exhibitorSelectSchema),
            }))
          },
        }
      }
    },
  }),
  async (c) => {
    const movies = await db.select().from(exhibitorTable).limit(10);

    return c.json({
      data: movies,
    });
  },
);

app.get(
  "/:exhibitorId",
  validator("param", z.object({
    exhibitorId: z.uuidv7(),
  })),
  describeRoute({
    tags: ["Exhibitor"],
    summary: "Get an exhibitor by ID",
    responses: {
      200: {
        description: "An exhibitor",
        content: {
          "application/json": {
            schema: resolver(exhibitorSelectSchema)
          },
        }
      },
      404: {
        description: "Exhibitor not found",
        content: {
          "application/json": {
            schema: resolver(z.object({
              message: z.string(),
            }))
          },
        },
      }
    },
  }),
  async (c) => {
    const { exhibitorId } = c.req.valid("param");

    const [exhibitor] = await db
      .select()
      .from(exhibitorTable)
      .where(eq(exhibitorTable.id, exhibitorId))
      .limit(1)

    if (!exhibitor) {
      return c.json({ message: "Exhibitor not found" }, 404);
    }

    return c.json(exhibitor);
  },
);

app.post(
  "/",
  validator("json", exhibitorInsertSchema.pick({ name: true })),
  describeRoute({
    tags: ["Exhibitor"],
    summary: "Create a new exhibitor",
  }),
  async (c) => {
    const body = c.req.valid("json");

    const [createdExhibitor] = await db.insert(exhibitorTable).values(body).returning();

    return c.json(createdExhibitor);
  },
);

app.put(
  "/:exhibitorId",
  validator("param", z.object({
    exhibitorId: z.uuidv7(),
  })),
  validator("json", exhibitorUpdateSchema.pick({ name: true })),
  describeRoute({
    tags: ["Exhibitor"],
    summary: "Update an exhibitor",
  }),
  async (c) => {
    const { exhibitorId } = c.req.valid("param");
    const body = c.req.valid("json");

    const [updatedExhibitor] = await db
      .update(exhibitorTable)
      .set(body)
      .where(eq(exhibitorTable.id, exhibitorId))
      .returning();

    return c.json(updatedExhibitor);
  },
);


export { app as exhibitorRoutes };
