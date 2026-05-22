import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-4">
        <div>
          <Link to="/" className="font-display text-2xl tracking-tight">evia<span className="text-accent">.</span></Link>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Considered essentials, made in small batches with materials chosen to last.
          </p>
        </div>
        {[
          { h: "Shop", links: ["Apparel", "Accessories", "Footwear", "Home"] },
          { h: "Company", links: ["About", "Journal", "Stockists", "Sustainability"] },
          { h: "Support", links: ["Shipping", "Returns", "Sizing", "Contact"] },
        ].map((col) => (
          <div key={col.h}>
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">{col.h}</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {col.links.map((l) => (
                <li key={l}><a href="#" className="transition-colors hover:text-foreground">{l}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Evia Studio. All rights reserved.</p>
          <p>Free shipping on orders over $150 · 30-day returns</p>
        </div>
      </div>
    </footer>
  );
}
