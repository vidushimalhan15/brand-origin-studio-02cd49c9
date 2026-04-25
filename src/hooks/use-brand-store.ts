import { useEffect, useState, useCallback } from "react";

export type Audience = {
  id: string;
  name: string;
  roleAndIndustry: string;
  challenge: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
};

const AUDIENCES_KEY = "socialflow.audiences";
const PRODUCTS_KEY = "socialflow.products";

function readStorage<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeStorage<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("brand-store-change", { detail: { key } }));
  } catch {
    // ignore
  }
}

function usePersistedList<T>(key: string) {
  const [items, setItems] = useState<T[]>(() => readStorage<T>(key));

  useEffect(() => {
    const sync = (e: Event) => {
      const detail = (e as CustomEvent).detail as { key?: string } | undefined;
      if (!detail || detail.key === key) {
        setItems(readStorage<T>(key));
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setItems(readStorage<T>(key));
    };
    window.addEventListener("brand-store-change", sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("brand-store-change", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, [key]);

  const update = useCallback(
    (updater: T[] | ((prev: T[]) => T[])) => {
      setItems((prev) => {
        const next = typeof updater === "function" ? (updater as (p: T[]) => T[])(prev) : updater;
        writeStorage(key, next);
        return next;
      });
    },
    [key],
  );

  return [items, update] as const;
}

export const useAudiences = () => usePersistedList<Audience>(AUDIENCES_KEY);
export const useProducts = () => usePersistedList<Product>(PRODUCTS_KEY);
