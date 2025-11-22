import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sql";
import { boolean, decimal, integer, pgEnum, pgTable, timestamp, unique, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { createUpdateSchema } from "drizzle-zod";
import { createInsertSchema } from "drizzle-zod";
import { createSelectSchema } from "drizzle-zod";

export const userTable = pgTable("user", {
  id: uuid().primaryKey().default(sql`uuidv7()`),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull()
});

export const costumerTable = pgTable("costumer", {
  id: uuid().primaryKey().default(sql`uuidv7()`),
  email: varchar({ length: 255 }).notNull().unique(),
  cpf: varchar({ length: 14 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull()
})

export const exhibitorTable = pgTable("exhibitor", {
  id: uuid().primaryKey().default(sql`uuidv7()`),
  name: varchar({ length: 255 }).notNull(),
})

export const exhibitorSelectSchema = createSelectSchema(exhibitorTable);
export const exhibitorInsertSchema = createInsertSchema(exhibitorTable);
export const exhibitorUpdateSchema = createUpdateSchema(exhibitorTable);

export const exhibitorScreenTable = pgTable("exhibitor_screen", {
  id: uuid().primaryKey().default(sql`uuidv7()`),
  exhibitorId: uuid().notNull().references(() => exhibitorTable.id),
  name: varchar({ length: 255 }).notNull(),
  capacity: integer().notNull(),
})

export const seatStatusEnum = pgEnum("seat_status", ["enabled", "disabled", "temporarily_disabled"])
export const seatAxisIdentifier = pgEnum("seat_axis_identifier", ["number", "letter"])

export const exhibitorScreenSeatTable = pgTable("exhibitor_screen_seat", {
  id: uuid().primaryKey().default(sql`uuidv7()`),
  exhibitorScreenId: uuid().notNull().references(() => exhibitorScreenTable.id),
  row: integer().notNull(),
  column: integer().notNull(),
  rowIdentifier: seatAxisIdentifier().notNull(),
  columnIdentifier: seatAxisIdentifier().notNull(),
  status: seatStatusEnum().notNull().default("enabled"),
}, (t) => [
  unique().on(t.exhibitorScreenId, t.row, t.column),
])

export const movieTable = pgTable("movie", {
  id: uuid().primaryKey().default(sql`uuidv7()`),
  title: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 1000 }).notNull(),
  durationMinutes: integer().notNull(),
  imdbId: varchar({ length: 20 }).notNull().unique(),
  tmdbId: varchar({ length: 20 }).notNull().unique()
})

export const screeningTable = pgTable("screening", {
  id: uuid().primaryKey().default(sql`uuidv7()`),
  movieId: uuid().notNull().references(() => movieTable.id),
  exhibitorScreenId: uuid().notNull().references(() => exhibitorScreenTable.id),
  start_time: varchar({ length: 50 }).notNull(),
  price: decimal({ precision: 10, scale: 2 }).notNull(),
})

// export const bookingPaymentStatusEnum = pgEnum("booking_payment_status", ["pending", "completed", "failed", "refunded"])
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "canceled", "completed"])
// export const payment_method = pgEnum("payment_method", ["pix", "card"])

export const bookingTable = pgTable("booking", {
  id: uuid().primaryKey().default(sql`uuidv7()`),
  costumerId: uuid().notNull().references(() => costumerTable.id),
  screeningId: uuid().notNull().references(() => screeningTable.id),
  status: bookingStatusEnum().notNull().default("pending"),
  billId: varchar({ length: 255 }),
  totalPrice: decimal({ precision: 10, scale: 2 }),
  created_at: timestamp().notNull().defaultNow(),
})

export const bookingSeatTable = pgTable("booking_seat", {
  id: uuid().primaryKey().default(sql`uuidv7()`),
  bookingId: uuid().notNull().references(() => bookingTable.id),
  halfPrice: boolean().notNull().default(false),
  exhibitorScreenSeatId: uuid().notNull().references(() => exhibitorScreenSeatTable.id),
}, (t) => [
  uniqueIndex().on(t.bookingId, t.exhibitorScreenSeatId),
]);
