/** Postgres SQLSTATE kódy — https://www.postgresql.org/docs/current/errcodes-appendix.html */

export const PG_UNIQUE_VIOLATION = "23505";

export function isUniqueViolation(error: { code?: string }): boolean {
  return error.code === PG_UNIQUE_VIOLATION;
}
