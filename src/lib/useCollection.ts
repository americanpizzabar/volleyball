"use client";

import { useEffect, useState } from "react";
import type { QuerySpec } from "./db";
import { fetchRows } from "./server/actions";

/**
 * Fetch a collection (built from a QuerySpec) via a server function.
 * Pass a factory returning `null` to skip (e.g. while the team id is loading).
 * Realtime was removed in the Neon migration — data refreshes on (re)mount and
 * whenever `deps` change.
 */
export function useCollection<T>(
  buildSpec: () => QuerySpec<T> | null,
  deps: unknown[],
): { data: T[]; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const spec = buildSpec();
    if (!spec) {
      setData([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchRows({ table: spec.table, filters: spec.filters, order: spec.order, limit: spec.limit })
      .then((rows) => {
        if (cancelled) return;
        setData(rows.map(spec.map));
        setError(null);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e : new Error(String(e)));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
