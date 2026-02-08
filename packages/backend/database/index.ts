

import { drizzle } from "drizzle-orm/bun-sql";
import * as schema from "./schema";
export const db = drizzle({ schema, casing: "snake_case" });
