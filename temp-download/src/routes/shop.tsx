import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";
import { PRODUCTS, CATEGORIES } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

const search = z.object({
  category: z.enum(CATEGORIES as unknown as [string, ...string[]]).optional(),
  sort: z.enum(["featured", "price-asc", "price-desc"]).optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: search,
  component: ShopPage,
  head: () => ({
    meta: [
      { title: "Shop all — Evia" },
      { name: "description", content: "Browse the full Evia collection of apparel, accessories, footwear, and home essentials." },
    ],
  }),
});

function ShopPage() {
  const { category = "All", sort = "featured" } = Route.useSearch();

  const products = useMemo(() => {
    let list = category === "All" ? PRODUCTS : PRODUCTS.filter((p) => p.category === category);
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [category, sort]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-14">
      <header className="flex flex-col gap-3 border-b border-border pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Collection</p>
        <h1 className="font-display text-5xl text-foreground md:text-6xl">{category === "All" ? "Shop all" : category}</h1>
        <p className="max-w-2xl text-muted-foreground">{products.length} pieces · made in small batches, restocked seasonally.</p>
      </header>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <nav className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const active = (category ?? "All") === c;
            return (
              <Link
                key={c}
                to="/shop"
                search={{ category: c === "All" ? undefined : c, sort: sort === "featured" ? undefined : sort } as any}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  active ? "border-foreground bg-foreground text-background" : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="sort" className="text-muted-foreground">Sort</label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => {
              const v = e.target.value;
              const url = new URL(window.location.href);
              if (v === "featured") url.searchParams.delete("sort"); else url.searchParams.set("sort", v);
              window.history.replaceState({}, "", url.toString());
              window.location.reload();
            }}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-sm outline-none"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price · Low to high</option>
            <option value="price-desc">Price · High to low</option>
          </select>
        </div>
      </div>

      <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => <ProductCard key={p.slug} product={p} />)}
      </div>
    </div>
  );
}
