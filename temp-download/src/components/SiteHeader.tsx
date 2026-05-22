import { Link } from "@tanstack/react-router";
import { ShoppingBag, Search, User } from "lucide-react";
import { useCart } from "@/lib/cart";

export function SiteHeader() {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6">
        <div className="flex items-center gap-10">
          <Link to="/" className="font-display text-2xl tracking-tight text-foreground">
            evia<span className="text-accent">.</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <Link to="/shop" className="transition-colors hover:text-foreground">Shop all</Link>
            <Link to="/shop" search={{ category: "Apparel" } as any} className="transition-colors hover:text-foreground">Apparel</Link>
            <Link to="/shop" search={{ category: "Accessories" } as any} className="transition-colors hover:text-foreground">Accessories</Link>
            <Link to="/shop" search={{ category: "Home" } as any} className="transition-colors hover:text-foreground">Home</Link>
          </nav>
        </div>
        <div className="flex items-center gap-1 text-foreground">
          <button aria-label="Search" className="rounded-full p-2 transition-colors hover:bg-secondary">
            <Search className="h-[18px] w-[18px]" />
          </button>
          <button aria-label="Account" className="rounded-full p-2 transition-colors hover:bg-secondary">
            <User className="h-[18px] w-[18px]" />
          </button>
          <Link to="/cart" aria-label="Cart" className="relative rounded-full p-2 transition-colors hover:bg-secondary">
            <ShoppingBag className="h-[18px] w-[18px]" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
