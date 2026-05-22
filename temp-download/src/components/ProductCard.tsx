import { Link } from "@tanstack/react-router";
import { formatPrice } from "@/lib/cart";
import type { Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link to="/products/$slug" params={{ slug: product.slug }} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-surface">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
        />
        {product.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
            {product.badge}
          </span>
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{product.category}</p>
          <h3 className="mt-1 text-base text-foreground">{product.name}</h3>
        </div>
        <div className="text-right">
          <p className="text-base text-foreground">{formatPrice(product.price)}</p>
          {product.compareAt && (
            <p className="text-xs text-muted-foreground line-through">{formatPrice(product.compareAt)}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
