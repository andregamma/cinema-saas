import type { SQL } from "drizzle-orm";
import type { PgColumn, PgSelect } from "drizzle-orm/pg-core";

export function withPagination<T extends PgSelect>(
  qb: T,
  orderByColumn: PgColumn | SQL | SQL.Aliased,
  page = 1,
  pageSize = 10,
) {
  const totalCount = qb

  return {
    data: qb
      .orderBy(orderByColumn)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    pagination: {
      page,
      pageSize,
      total: total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}

export async function queryWithCount<T extends PgSelect>(qb: T): Promise<[Awaited<T>, number]> {
    const result = await qb;
    qb.config.fields = { count: count() };
    qb.config.orderBy = [];
    const [total] = await qb;
    return [result, total.count];
}
