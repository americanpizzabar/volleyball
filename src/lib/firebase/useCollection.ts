"use client";

import { useEffect, useState } from "react";
import { onSnapshot, type Query } from "firebase/firestore";

/**
 * Subscribe to a Firestore query and return live documents (with their id).
 * Pass `null` to skip (e.g. while the team id is still loading).
 */
export function useCollection<T>(
  buildQuery: () => Query | null,
  deps: unknown[],
): { data: (T & { id: string })[]; loading: boolean; error: Error | null } {
  const [data, setData] = useState<(T & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = buildQuery();
    if (!q) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      q,
      (snap) => {
        setData(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) })),
        );
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
