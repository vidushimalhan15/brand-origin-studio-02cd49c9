import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "birthday-globe:visited-countries";

/**
 * Set of visited country ids, persisted to localStorage with an in-memory
 * fallback (private mode / storage disabled won't crash — state just lives
 * for the session).
 */
export function useVisited() {
  const [visited, setVisited] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return new Set<string>(JSON.parse(raw));
    } catch {
      /* storage unavailable — fall back to in-memory */
    }
    return new Set<string>();
  });

  // Track whether persistence works so we don't spam warnings.
  const canPersist = useRef(true);

  useEffect(() => {
    if (!canPersist.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...visited]));
    } catch {
      canPersist.current = false;
    }
  }, [visited]);

  const toggle = useCallback((id: string) => {
    setVisited((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return { visited, toggle, count: visited.size };
}
