"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase/client";
import type { Row } from "./db";

/**
 * Subscribe to a single row by id (default column "id"), mapped to type T.
 * Stays live via Realtime. `map` must be a stable reference (module-level).
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

    async function run() {
      const { data: row } = await supabase
        .from(table)
        .select("*")
        .eq(idColumn, id)
        .maybeSingle();
      if (cancelled) return;
      setData(row ? map(row) : null);
      setLoading(false);
    }

    run();

    const channel = supabase
      .channel(`rt:${table}:${idColumn}=${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `${idColumn}=eq.${id}` },
        () => run(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [table, id, idColumn, map]);

  return { data, loading };
}
