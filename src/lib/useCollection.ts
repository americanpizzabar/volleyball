"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase/client";
import type { QuerySpec } from "./db";

/**
 * Fetch a Supabase query (built from a QuerySpec) and keep it live via Realtime.
 * Pass a factory returning `null` to skip (e.g. while the team id is loading).
 */
export function useCollection<T>(
  buildSpec: () => QuerySpec<T> | null,
  deps: unknown[],
): { data: T[]; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // Keep the latest spec for the realtime refetch handler.
  const specRef = useRef<QuerySpec<T> | null>(null);

  useEffect(() => {
    const spec = buildSpec();
    specRef.current = spec;
    if (!spec) {
      setData([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function run() {
      const s = specRef.current!;
      let q = supabase.from(s.table).select("*");
      for (const f of s.filters) q = q.eq(f.col, f.val);
      if (s.order) q = q.order(s.order.col, { ascending: s.order.ascending });
      if (s.limit) q = q.limit(s.limit);
      const { data: rows, error: err } = await q;
      if (cancelled) return;
      if (err) {
        setError(new Error(err.message));
      } else {
        setData((rows ?? []).map(s.map));
        setError(null);
      }
      setLoading(false);
    }

    run();

    // Realtime: refetch on any change matching the primary filter.
    const primary = spec.filters[0];
    const channel = supabase
      .channel(`rt:${spec.table}:${primary ? primary.col + "=" + primary.val : "all"}:${Math.random()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: spec.table,
          ...(primary ? { filter: `${primary.col}=eq.${primary.val}` } : {}),
        },
        () => run(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
