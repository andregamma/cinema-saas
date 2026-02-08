import { count, sql, type InferSelectModel, type SQL } from "drizzle-orm";
import type { PgColumn, PgSelect, PgSelectBase, PgSelectJoin, PgTable } from "drizzle-orm/pg-core";
import { db } from "../../database";
import z from "zod";
import { validator } from "hono-openapi";

export async function withPagination<T extends PgTable>(
  table: T,
  options: {
    page: number | string,
    pageSize: number | string,
    orderBy?: PgColumn | SQL | SQL.Aliased;
    where?: SQL<unknown>;
    leftJoin?: {
      table: PgTable,
      condition: SQL<unknown>
    }
  } = { page: 1, pageSize: 10 },
) {
  let query = db.select().from(table as any).$dynamic();

  if (options?.where) {
    query.where(options.where);
  }

  // Pagination
  query
    .limit(Number(options.pageSize))
    .offset((Number(options.page) - 1) * Number(options.pageSize));

  if (options?.orderBy) {
    query.orderBy(options.orderBy);
  }

  if (options?.leftJoin) {
    query.leftJoin(options.leftJoin.table, options.leftJoin.condition);
  }
  
  const [data, totalCount] = await Promise.all([
    query,
    db.select({ totalCount: count() }).from(sql`${query}`),
  ])

  const total = totalCount[0]?.totalCount || 0;

  return {
    data: data as InferSelectModel<T>[],
    pagination: {
      page: Number(options.page),
      pageSize: Number(options.pageSize),
      total,
      totalPages: Math.ceil(total / Number(options.pageSize))
    }
  }
}

export function paginationValidators(){
  return validator(
    "query",
    z.object({
      page: z.string().default("1"),
      pageSize: z.string().default("10"),
    }),
  )
}