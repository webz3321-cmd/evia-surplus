import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Leaf, Package, Truck } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { PRODUCTS } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const featured = PRODUCTS.slice(0, 4);
  const editorial = PRODUCTS.slice(4, 7);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Autumn collection · 2026</p>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] text-foreground md:text-7xl">
              The quiet shop for things <em className="italic">worth keeping.</em>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              Apparel, accessories and objects, made in small runs from natural materials. Designed to be lived in, repaired, and passed on.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/shop" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                Shop the collection <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/shop" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
                Our story
              </Link>
            </div>
          </div>
          <div className="relative">
            <img src={hero} alt="Evia studio" width={1600} height={1100} className="aspect-[5/6] w-full rounded-2xl object-cover shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)]" />
          </div>
        </div>
      </section>

      {/* Value strip */}
      <section className="border-y border-border">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 md:grid-cols-3">
          {[
            { i: Truck, t: "Free shipping over $150", s: "Carbon-neutral delivery, worldwide." },
            { i: Package, t: "30-day returns", s: "Easy, no questions asked." },
            { i: Leaf, t: "Made to last", s: "Repair program on every product." },
          ].map(({ i: Icon, t, s }) => (
            <div key={t} className="flex items-start gap-4">
              <div className="rounded-full bg-secondary p-2.5"><Icon className="h-4 w-4 text-foreground" /></div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t}</p>
                <p className="text-sm text-muted-foreground">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Featured</p>
            <h2 className="mt-3 font-display text-4xl text-foreground md:text-5xl">New arrivals</h2>
          </div>
          <Link to="/shop" className="hidden items-center gap-1 text-sm text-foreground underline-offset-4 hover:underline md:inline-flex">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => <ProductCard key={p.slug} product={p} />)}
        </div>
      </section>

      {/* Editorial split */}
      <section className="bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-2 md:items-center">
          <div className="grid grid-cols-2 gap-4">
            {editorial.map((p, idx) => (
              <img key={p.slug} src={p.image} alt={p.name} loading="lazy"
                className={`w-full rounded-xl object-cover ${idx === 0 ? "col-span-2 aspect-[16/10]" : "aspect-square"}`} />
            ))}
          </div>
          <div className="md:pl-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">The studio</p>
            <h2 className="mt-4 font-display text-4xl text-foreground md:text-5xl">
              A small team, working slowly, on purpose.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Every piece is developed with a single mill or workshop and produced in limited quantities. We list provenance, materials, and the people behind every product — and we tell you when something is going to take a little longer to make.
            </p>
            <Link to="/shop" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline">
              Visit the journal <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="font-display text-4xl text-foreground md:text-5xl">Letters from the studio</h2>
        <p className="mt-4 text-muted-foreground">New releases, restocks, and the occasional essay. No noise.</p>
        <form className="mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row" onSubmit={(e) => e.preventDefault()}>
          <input type="email" required placeholder="you@example.com"
            className="flex-1 rounded-full border border-input bg-background px-5 py-3 text-sm outline-none focus:border-foreground" />
          <button className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
            Subscribe
          </button>
        </form>
      </section>
    </div>
  );
}
