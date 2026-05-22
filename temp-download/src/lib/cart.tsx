import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PRODUCTS, type Product } from "./products";

export type CartItem = { slug: string; qty: number };
type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  detailed: { product: Product; qty: number }[];
  add: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "evia.cart.v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const value = useMemo<CartCtx>(() => {
    const detailed = items
      .map((i) => ({ product: PRODUCTS.find((p) => p.slug === i.slug)!, qty: i.qty }))
      .filter((x) => x.product);
    return {
      items,
      detailed,
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal: detailed.reduce((s, x) => s + x.product.price * x.qty, 0),
      add: (slug, qty = 1) =>
        setItems((cur) => {
          const ex = cur.find((c) => c.slug === slug);
          if (ex) return cur.map((c) => (c.slug === slug ? { ...c, qty: c.qty + qty } : c));
          return [...cur, { slug, qty }];
        }),
      setQty: (slug, qty) =>
        setItems((cur) => (qty <= 0 ? cur.filter((c) => c.slug !== slug) : cur.map((c) => (c.slug === slug ? { ...c, qty } : c)))),
      remove: (slug) => setItems((cur) => cur.filter((c) => c.slug !== slug)),
      clear: () => setItems([]),
    };
  }, [items]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
