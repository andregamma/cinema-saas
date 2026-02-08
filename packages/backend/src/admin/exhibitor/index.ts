import { Hono } from "hono";
import { exhibitorInsertSchema, exhibitorScreenTable, exhibitorSelectSchema, exhibitorTable, exhibitorUpdateSchema } from "../../../database/schema";
import { describeRoute, resolver, validator } from "hono-openapi";
import z from "zod";
import { db } from "../../../database";
import { eq } from "drizzle-orm";
import { withPagination } from "../../utils/withPagination";

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


/**
 * Exhibitor Screens
 */
app.get(
  "/:exhibitorId/screen",
  validator("query", z.object({
    page: z.number().min(1).positive().optional(),
  })),
  validator("param", z.object({
    exhibitorId: z.uuidv7(),
  })),
  describeRoute({
    tags: ["Exhibitor Screens"],
    summary: "Get a list of exhibitor screens",
  }),
  async (c) => {
    const { page } = c.req.valid("query");
    const { exhibitorId } = c.req.valid("param")
    const screens = await db.query.exhibitorScreenTable.findMany({
      where: eq(exhibitorScreenTable.exhibitorId, exhibitorId),
      limit: 10,
      offset: page ? (page - 1) * 10 : 0,
    });

    const totalScreens = await db.query.exhibitorScreenTable.findMany({
      where: eq(exhibitorScreenTable.exhibitorId, exhibitorId),
    });

    return c.json({
      data: screens,
      pagination: {
        page: page || 1,
        pageSize: 10,
        total: totalScreens.length,
        totalPages: Math.ceil(totalScreens.length / 10),
      }
    });
  },
)

app.get(
  "/:exhibitorId/screen/:screenId",
  describeRoute({
    tags: ["Exhibitor Screens"],
    summary: "Get an exhibitor screen by ID",
  }),
  async (c) => {
    return c.json({ message: "Not implemented yet" });
  },
)

app.post(
  "/:exhibitorId/screen",
  validator("param", z.object({
    exhibitorId: z.uuidv7(),
  })),
  validator("json", z.object({
    name: z.string().min(1),
    capacity: z.number().min(1),
  })),
  describeRoute({
    tags: ["Exhibitor Screens"],
    summary: "Create a new exhibitor screen",
  }),
  async (c) => {
    const body = c.req.valid("json");
    const { exhibitorId } = c.req.valid("param");

    const exhibitor = await db.query.exhibitorTable.findFirst({
      where: eq(exhibitorTable.id, exhibitorId),
    });

    if (!exhibitor) {
      return c.json({ message: "Exhibitor not found" }, 404);
    }

    const [createdScreen] = await db.insert(exhibitorScreenTable).values({
      exhibitorId,
      name: body.name,
      capacity: body.capacity,
    }).returning();

    return c.json(createdScreen);
  },
)

app.put(
  "/:exhibitorId/screen/:screenId",
  describeRoute({
    tags: ["Exhibitor Screens"],
    summary: "Update an exhibitor screen",
  }),
  async (c) => {
    return c.json({ message: "Not implemented yet" });
  },
);

app.delete(
  "/:exhibitorId/screen/:screenId",
  describeRoute({
    tags: ["Exhibitor Screens"],
    summary: "Delete an exhibitor screen",
  }),
  async (c) => {
    return c.json({ message: "Not implemented yet" });
  },
);


export { app as exhibitorRoutes };
