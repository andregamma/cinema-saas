import {
  movieTable,
} from "../database/schema";
import AbacatePay from "abacatepay-nodejs-sdk";
import { Hono } from "hono";
import { Scalar } from "@scalar/hono-api-reference";
import {
  openAPIRouteHandler,
} from "hono-openapi";
import z from "zod";
import { movieRoutes } from "./admin/movie";
import { exhibitorRoutes } from "./admin/exhibitor";
import { db } from "../database";
import { authRoutes } from "./admin/auth";
import { logger } from 'hono/logger'
import { jwt } from "hono/jwt";

const pageSize = 10;
const abacate = AbacatePay(process.env.ABACATE_API_KEY ?? "");

const app = new Hono();
app.use(logger());
app.get(
  "/openapi.json",
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: "Cinema SaaS",
        version: "1.0.0",
        license: {
          name: "GPL-3.0-or-later"
        },
        description: "Documentação da API para gerenciamento de cinemas.",
      },
    },
  }),
);
app.get("/docs", Scalar({ url: "/openapi.json" }));

app.get("/public/movies", async (c) => {
  const movies = await db.select().from(movieTable).limit(10);

  return c.json({
    data: movies,
  });
});

// const checkoutSchema = z.object({
//   costumer: z.object({
//     name: z.string(),
//     cpf: z.string(),
//     email: z.email(),
//   }),
//   screeningId: z.uuidv7(),
//   seats: z.array(
//     z.object({
//       id: z.uuidv7(),
//       halfPrice: z.boolean(),
//     }),
//   ),
// });

// app.post(
//   "/public/checkout",
//   describeRoute({
//     summary: "Create a checkout",
//     tags: ["Public", "Checkout"],
//   }),
//   validator("json", checkoutSchema),
//   async (c) => {
//     const body = c.req.valid("json");

//     let costumer: typeof costumerTable.$inferSelect | undefined = undefined;

//     const [existingCostumer] = await db
//       .select()
//       .from(costumerTable)
//       .where(eq(costumerTable.cpf, body.costumer.cpf))
//       .limit(1);

//     if (!existingCostumer) {
//       const [createdCostumer] = await db
//         .insert(costumerTable)
//         .values({
//           cpf: body.costumer.cpf,
//           email: body.costumer.email,
//           password: await password.hash(
//             `${body.costumer.cpf}${Date.now()}-${body.costumer.email}${Math.random()}#`,
//           ),
//         })
//         .returning();

//       if (createdCostumer) {
//         costumer = createdCostumer;
//       }
//     } else {
//       costumer = existingCostumer;
//     }

//     await db.transaction(async (tx) => {
//       if (!costumer) {
//         throw new Error("Erro ao criar ou encontrar cliente");
//       }

//       const [screening] = await tx
//         .select()
//         .from(schema.screeningTable)
//         .where(eq(schema.screeningTable.id, body.screeningId))
//         .limit(1);

//       if (!screening) {
//         throw new Error("Exibição não encontrada");
//       }

//       const [booking] = await tx
//         .insert(bookingTable)
//         .values({
//           costumerId: costumer.id,
//           screeningId: screening.id,
//         })
//         .returning();

//       if (!booking) {
//         throw new Error("Erro ao criar reserva");
//       }

//       const bookingSeats = await tx
//         .insert(bookingSeatTable)
//         .values(
//           body.seats.map((seat) => ({
//             bookingId: booking.id,
//             exhibitorScreenSeatId: seat.id,
//             halfPrice: seat.halfPrice,
//           })),
//         )
//         .returning();

//       if (!bookingSeats || bookingSeats.length === 0) {
//         throw new Error("Erro ao criar assentos da reserva");
//       }

//       const bill = await abacate.billing.createLink({
//         products: [
//           {
//             name: `Exibição #${booking.screeningId}`,
//             quantity: bookingSeats.length,
//             externalId: booking.screeningId,
//             price: +screening.price,
//           },
//         ],
//         cutomerId: costumer.id,
//         customer: {
//           taxId: costumer.cpf,
//           email: costumer.email,
//         },
//         methods: ["PIX", "CARD"],
//         completionUrl: `https://${process.env.SITE_URL}/checkout/success`,
//         returnUrl: `https://${process.env.SITE_URL}/checkout/cancel`,
//       });

//       return c.json({
//         message: "Compra realizada com sucesso. Realize o pagamento.",
//         data: {
//           booking,
//           bookingSeats,
//           bill,
//         },
//       });
//     });
//   },
// );

app.route("/admin/auth", authRoutes);
app.use(
  "/admin/*",
  jwt({
    secret: process.env.JWT_SECRET ?? '',
    cookie: {
      key: "cine_auth_token",
    },
    alg: "HS256",
  })
);
app.route("/admin/movie", movieRoutes);
app.route("/admin/exhibitor", exhibitorRoutes);

app.get("*", (c) => {
  return c.json({ message: "Not Found" }, 404);
})

export default app;
