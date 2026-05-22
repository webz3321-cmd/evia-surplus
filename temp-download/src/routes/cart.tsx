import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, X, ArrowRight } from "lucide-react";
import { useCart, formatPrice } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  component: CartPage,
  head: () => ({
    meta: [
      { title: "Your bag — Evia" },
      { name: "description", content: "Review the items in your bag and check out securely." },
    ],
  }),
});

function CartPage() {
  const { detailed, subtotal, setQty, remove, count } = useCart();
  const shipping = subtotal >= 150 || subtotal === 0 ? 0 : 12;
  const total = subtotal + shipping;

  if (count === 0) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-display text-5xl text-foreground">Your bag is empty</h1>
        <p className="mt-4 text-muted-foreground">Find something you'll keep for years.</p>
        <Link to="/shop" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">
          Browse the shop <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-14">
      <h1 className="font-display text-5xl text-foreground md:text-6xl">Your bag</h1>
      <p className="mt-2 text-muted-foreground">{count} {count === 1 ? "item" : "items"}</p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y divide-border border-y border-border">
          {detailed.map(({ product, qty }) => (
            <li key={product.slug} className="flex gap-5 py-6">
              <Link to="/products/$slug" params={{ slug: product.slug }} className="shrink-0">
                <img src={product.image} alt={product.name} className="h-32 w-24 rounded-lg object-cover sm:h-36 sm:w-28" />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{product.category}</p>
                    <Link to="/products/$slug" params={{ slug: product.slug }} className="mt-1 block text-base text-foreground hover:underline">{product.name}</Link>
                    <p className="mt-1 text-sm text-muted-foreground">{product.tagline}</p>
                  </div>
                  <p className="text-base text-foreground">{formatPrice(product.price * qty)}</p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <div className="inline-flex items-center rounded-full border border-border">
                    <button onClick={() => setQty(product.slug, qty - 1)} className="p-2.5"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-8 text-center text-sm">{qty}</span>
                    <button onClick={() => setQty(product.slug, qty + 1)} className="p-2.5"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <button onClick={() => remove(product.slug)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-display text-2xl text-foreground">Order summary</h2>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="text-foreground">{formatPrice(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd className="text-foreground">{shipping === 0 ? "Free" : formatPrice(shipping)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Estimated tax</dt><dd className="text-muted-foreground">Calculated at checkout</dd></div>
          </dl>
          <div className="mt-5 flex items-baseline justify-between border-t border-border pt-5">
            <span className="text-sm font-semibold uppercase tracking-wider text-foreground">Total</span>
            <span className="font-display text-2xl text-foreground">{formatPrice(total)}</span>
          </div>
          <button className="mt-6 w-full rounded-full bg-primary py-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
            Checkout securely
          </button>
          <Link to="/shop" className="mt-3 block text-center text-xs text-muted-foreground underline-offset-4 hover:underline">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
