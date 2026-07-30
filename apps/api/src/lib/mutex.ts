/**
 * Serialises async work per key within this process.
 *
 * Several auction paths follow a read-then-write shape — read the current
 * price / NIPL quota / lot status, await a few queries, then write. Between
 * the read and the write another request can slip in and read the same stale
 * value, so both pass a check only one of them should have passed. The auction
 * API runs as a single container, so chaining the work per key is enough to
 * close those windows.
 *
 * Callers that need more than one key always acquire them in the same order
 * (user before lot), so the wait graph has no cycle and cannot deadlock.
 */
const chains = new Map<string, Promise<unknown>>();

export function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = chains.get(key) ?? Promise.resolve();

  // A rejected predecessor must not stop the queue behind it: one bidder's
  // failed bid cannot be allowed to block everyone else on the same lot.
  const run = previous.catch(() => undefined).then(fn);
  const tail = run.then(
    () => undefined,
    () => undefined
  );

  chains.set(key, tail);

  // Only the last waiter clears the entry, so the map does not grow without
  // bound over a long auction day.
  void tail.then(() => {
    if (chains.get(key) === tail) chains.delete(key);
  });

  return run;
}
