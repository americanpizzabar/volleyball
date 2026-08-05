"use client";

import { useCallback, useEffect, useState } from "react";
import type { Row } from "./mappers";
import { fetchRow } from "./server/actions";

/**
 * Fetch a single row by id (default column "id"), mapped to type T, via a
 * server function. Realtime was removed in the Neon migration, so callers that
 * mutate this row should call the returned `refresh()` afterwards to re-read it.
 * `map` must be a stable reference (module-level).
 */
export function useDoc<T>(
  table: string,
  id: string | null,
  map: (row: Row) => T,
  idColumn = "id",
): { data: T | null; loading: boolean; error: Error | null; refresh: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchRow(table, idColumn, id)
      .then((row) => {
        if (cancelled) return;
        setData(row ? map(row) : null);
        setError(null);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setData(null);
        setError(e instanceof Error ? e : new Error(String(e)));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [table, id, idColumn, map, reloadKey]);

  return { data, loading, error, refresh };
}
