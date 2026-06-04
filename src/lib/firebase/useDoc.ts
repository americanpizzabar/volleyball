"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./config";

/** Subscribe to a single document by collection + id. */
export function useDoc<T>(
  collection: string,
  id: string | null,
): { data: (T & { id: string }) | null; loading: boolean } {
  const [data, setData] = useState<(T & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(doc(db, collection, id), (snap) => {
      setData(snap.exists() ? ({ id: snap.id, ...(snap.data() as T) }) : null);
      setLoading(false);
    });
    return unsub;
  }, [collection, id]);

  return { data, loading };
}
