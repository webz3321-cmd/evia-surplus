import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Minus, Plus, ShoppingBag, Truck, RotateCcw, Shield } from "lucide-react";
import { getProduct, PRODUCTS } from "@/lib/products";
import { useCart, formatPrice } from "@/lib/cart";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/products/$slug")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} — Evia` },
          { name: "description", content: loaderData.product.tagline },
          { property: "og:title", content: `${loaderData.product.name} — Evia` },
          { property: "og:description", content: loaderData.product.tagline },
          { property: "og:image", content: loaderData.product.image },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="font-display text-4xl">Product not found</h1>
      <Link to="/shop" className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">Back to shop</Link>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const related = PRODUCTS.filter((p) => p.category === product.category && p.slug !== product.slug).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <nav className="mb-8 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/shop" className="hover:text-foreground">Shop</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl bg-surface">
            <img src={product.image} alt={product.name} className="aspect-[4/5] w-full object-cover" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[product.image, product.image, product.image].map((src, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-lg bg-surface opacity-80">
                <img src={src} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="md:sticky md:top-24 md:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{product.category}</p>
          <h1 className="mt-3 font-display text-4xl text-foreground md:text-5xl">{product.name}</h1>
          <p className="mt-3 text-muted-foreground">{product.tagline}</p>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-2xl text-foreground">{formatPrice(product.price)}</span>
            {product.compareAt && <span className="text-sm text-muted-foreground line-through">{formatPrice(product.compareAt)}</span>}
          </div>

          <div className="mt-8 space-y-5">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground">Size</p>
              <div className="flex flex-wrap gap-2">
                {["XS", "S", "M", "L", "XL"].map((s, i) => (
                  <button key={s} className={`min-w-12 rounded-full border px-4 py-2 text-sm ${i === 1 ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:border-foreground"}`}>{s}</button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground">Quantity</p>
              <div className="inline-flex items-center rounded-full border border-border">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-3"><Minus className="h-3.5 w-3.5" /></button>
                <span className="w-8 text-center text-sm">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="p-3"><Plus className="h-3.5 w-3.5" /></button>
              </div>
            </div>

            <button
              onClick={() => { add(product.slug, qty); setAdded(true); setTimeout(() => setAdded(false), 1800); }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {added ? <><Check className="h-4 w-4" /> Added to bag</> : <><ShoppingBag className="h-4 w-4" /> Add to bag · {formatPrice(product.price * qty)}</>}
            </button>
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Details</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          </div>

          <ul className="mt-6 grid gap-3 text-sm text-muted-foreground">
            {[
              { i: Truck, t: "Free shipping over $150 · ships in 1–2 days" },
              { i: RotateCcw, t: "30-day free returns" },
              { i: Shield, t: "Lifetime repair program" },
            ].map(({ i: Icon, t }) => (
              <li key={t} className="flex items-center gap-3"><Icon className="h-4 w-4 text-foreground" /> {t}</li>
            ))}
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24 border-t border-border pt-16">
          <h2 className="font-display text-3xl text-foreground">You might also like</h2>
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
