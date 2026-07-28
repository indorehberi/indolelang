/**
 * How many NIPL slots an unlimited package is actually issued.
 *
 * Unlimited lets a bidder win any number of units on its activation day, but
 * the deposit still materialises a fixed number of NIPL codes — those are what
 * remain once the package is downgraded the next day.
 */
export const UNLIMITED_NIPL_SLOTS = 5;

/**
 * `deposits.package_type` values that mean "unlimited".
 *
 * '999' is the original spelling, from before the literal 'unlimited' string
 * was introduced. It is NOT a quota of 999 slots — reading it as a number is
 * what made an old unlimited deposit look like a bidder holding 999 NIPL, and
 * kept it out of every `package_type === 'unlimited'` check in the codebase.
 * New deposits can only be created as '1'|'2'|'3'|'4'|'unlimited' (see
 * deposits.schema.ts), so this exists purely to read historical rows
 * correctly.
 */
const UNLIMITED_PACKAGE_TYPES = new Set(['unlimited', '999']);

/** Whether this package_type denotes an unlimited package, either spelling. */
export function isUnlimitedPackage(packageType?: string | null): boolean {
  return !!packageType && UNLIMITED_PACKAGE_TYPES.has(packageType);
}

/**
 * Whether the deposit grants unlimited wins *right now* — i.e. it is an
 * unlimited package that the daily cron has not yet downgraded.
 */
export function grantsUnlimitedNow(deposit: {
  package_type?: string | null;
  unlimited_downgraded_at?: Date | null;
}): boolean {
  return isUnlimitedPackage(deposit.package_type) && !deposit.unlimited_downgraded_at;
}

/**
 * NIPL slots a package_type is worth. Unlimited packages are issued
 * UNLIMITED_NIPL_SLOTS codes; anything else is its own numeric value.
 */
export function niplSlotsFor(packageType?: string | null, fallback = 0): number {
  if (isUnlimitedPackage(packageType)) return UNLIMITED_NIPL_SLOTS;
  const parsed = parseInt(packageType || '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/** Prisma `where` fragment matching deposits of either unlimited spelling. */
export const UNLIMITED_PACKAGE_TYPE_FILTER = {
  package_type: { in: Array.from(UNLIMITED_PACKAGE_TYPES) },
};
