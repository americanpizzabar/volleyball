"use client";

import { useEffect, useState } from "react";
import type { Row } from "./mappers";
import { fetchRow } from "./server/actions";

/**
 * Fetch a single row by id (default column "id"), mapped to type T, via a
 * server function. Realtime was removed in the Neon migration.
 * `map` must be a stable reference (module-level).
 */
export function useDoc<T>(
  table: string,
  id: string | null,
  map: (row: Row) => T,
  idColumn = "id",
): { data: T | null; loading: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setData(null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [table, id, idColumn, map]);

  return { data, loading };
}
